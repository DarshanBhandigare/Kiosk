import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import Document, DocumentExtraction, Patient, Case
from backend.app.schemas.schemas import DocumentResponse, DocumentExtractionResponse
from backend.app.ocr.factory import get_ocr_provider
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/documents", tags=["Documents & OCR"])

UPLOAD_DIR = os.path.join(os.getcwd(), "private_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "text/plain"
]
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10 MB

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    patient_id: str = Form(...),
    case_id: Optional[str] = Form(None),
    document_type: str = Form("PRESCRIPTION"), # PRESCRIPTION, LAB_REPORT, DISCHARGE_SUMMARY, OTHER
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Validate mime type
    mime_type = file.content_type or "application/octet-stream"
    if mime_type not in ALLOWED_MIME_TYPES and not file.filename.endswith((".pdf", ".jpg", ".jpeg", ".png", ".txt")):
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: PDF, JPG, PNG, TXT.")

    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    target_path = os.path.join(UPLOAD_DIR, safe_filename)

    # Save file privately
    size = 0
    with open(target_path, "wb") as buffer:
        while content := await file.read(1024 * 1024):
            size += len(content)
            if size > MAX_FILE_SIZE:
                os.remove(target_path)
                raise HTTPException(status_code=400, detail="File size exceeds maximum allowed 10MB limit.")
            buffer.write(content)

    # Create Document record
    doc = Document(
        patient_id=patient.id,
        case_id=case_id,
        document_type=document_type.upper(),
        file_name=file.filename,
        file_path=target_path,
        file_size_bytes=size,
        mime_type=mime_type,
        ocr_status="PROCESSING"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Process with OCR Provider
    ocr_provider = get_ocr_provider()
    try:
        ocr_result = await ocr_provider.extract_text_and_entities(
            file_path=target_path,
            mime_type=mime_type,
            document_type=document_type
        )
        doc.ocr_status = "COMPLETED"
        doc.ocr_raw_text = ocr_result.get("raw_text", "")

        for ent in ocr_result.get("entities", []):
            ext_record = DocumentExtraction(
                document_id=doc.id,
                entity_type=ent["entity_type"],
                extracted_key=ent["extracted_key"],
                extracted_value=ent["extracted_value"],
                reference_range=ent.get("reference_range"),
                is_abnormal=ent.get("is_abnormal", False),
                confidence_score=ent.get("confidence_score", 0.95),
                verified_by_doctor=False
            )
            db.add(ext_record)

        db.commit()
        db.refresh(doc)
    except Exception as err:
        print(f"OCR Extraction error: {err}")
        doc.ocr_status = "FAILED"
        doc.ocr_raw_text = f"OCR failed: {type(err).__name__}: {err}"
        db.commit()

    AuditService.log(
        db=db,
        action="DOCUMENT_UPLOADED_AND_PROCESSED",
        resource_type="DOCUMENT",
        resource_id=doc.id,
        details={"file_name": doc.file_name, "document_type": doc.document_type, "ocr_status": doc.ocr_status}
    )

    return doc

@router.get("/{id}", response_model=DocumentResponse)
def get_document(id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.post("/extraction/{extraction_id}/verify")
def verify_extraction(extraction_id: str, is_verified: bool = True, db: Session = Depends(get_db)):
    ext = db.query(DocumentExtraction).filter(DocumentExtraction.id == extraction_id).first()
    if not ext:
        raise HTTPException(status_code=404, detail="Extraction record not found")

    ext.verified_by_doctor = is_verified
    db.commit()

    AuditService.log(
        db=db,
        action="DOCUMENT_EXTRACTION_VERIFIED",
        resource_type="DOCUMENT_EXTRACTION",
        resource_id=ext.id,
        details={"verified": is_verified}
    )

    return {"status": "SUCCESS", "extraction_id": ext.id, "verified": is_verified}
