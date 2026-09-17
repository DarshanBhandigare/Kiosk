from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import AyurvedaProfile, Case
from backend.app.schemas.schemas import AyurvedaProfileInput
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/ayurveda", tags=["Ayurveda Module"])

@router.get("/case/{case_id}")
def get_ayurveda_profile(case_id: str, db: Session = Depends(get_db)):
    profile = db.query(AyurvedaProfile).filter(AyurvedaProfile.case_id == case_id).first()
    if not profile:
        return {}
    return {
        "id": profile.id,
        "case_id": profile.case_id,
        "prakriti": profile.prakriti,
        "vikriti": profile.vikriti,
        "agni": profile.agni,
        "koshta": profile.koshta,
        "sleep_pattern": profile.sleep_pattern,
        "appetite": profile.appetite,
        "bowel_habits": profile.bowel_habits,
        "notes": profile.notes,
        "recorded_at": profile.recorded_at
    }

@router.post("/case/{case_id}")
def save_ayurveda_profile(case_id: str, profile_in: AyurvedaProfileInput, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    profile = db.query(AyurvedaProfile).filter(AyurvedaProfile.case_id == case.id).first()
    if not profile:
        profile = AyurvedaProfile(case_id=case.id)
        db.add(profile)

    profile.prakriti = profile_in.prakriti
    profile.vikriti = profile_in.vikriti
    profile.agni = profile_in.agni
    profile.koshta = profile_in.koshta
    profile.sleep_pattern = profile_in.sleep_pattern
    profile.appetite = profile_in.appetite
    profile.bowel_habits = profile_in.bowel_habits
    profile.notes = profile_in.notes

    db.commit()
    db.refresh(profile)

    AuditService.log(
        db=db,
        action="AYURVEDA_PROFILE_UPDATED",
        resource_type="CASE",
        resource_id=case.id,
        details={"prakriti": profile.prakriti, "agni": profile.agni}
    )

    return {"status": "SUCCESS", "ayurveda_profile_id": profile.id}
