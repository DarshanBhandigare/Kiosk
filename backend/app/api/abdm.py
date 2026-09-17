from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/abdm", tags=["ABDM / HMIS Integration"])

class AbhaVerifyRequest(BaseModel):
    abha_id: str # 14-digit number or username@abdm

class AbhaVerifyResponse(BaseModel):
    status: str
    abha_id: str
    abha_address: str
    full_name: str
    gender: str
    date_of_birth: str
    mobile: str
    address: str
    is_mock: bool = True
    disclaimer: str = "Mock ABDM Sandbox Gateway. For demonstration and sandbox validation."

class HmisSyncRequest(BaseModel):
    patient_id: str
    case_id: str


DEMO_ABHA_PROFILES = {
    "91884219205412": {
        "abha_id": "91-8842-1920-5412",
        "abha_address": "ramesh.patil@demo",
        "full_name": "Ramesh Patil",
        "gender": "Male",
        "date_of_birth": "1972-06-15",
        "mobile": "+91 98220 11223",
        "address": "Shivaji Nagar, Pune, Maharashtra",
    },
    "91992144128801": {
        "abha_id": "91-9921-4412-8801",
        "abha_address": "sunita.deshmukh@demo",
        "full_name": "Sunita Deshmukh",
        "gender": "Female",
        "date_of_birth": "1984-03-22",
        "mobile": "+91 97654 33211",
        "address": "Kothrud, Pune, Maharashtra",
    },
}

@router.post("/verify-abha", response_model=AbhaVerifyResponse)
def verify_abha(req: AbhaVerifyRequest):
    abha_clean = "".join(character for character in req.abha_id if character.isdigit())
    profile = DEMO_ABHA_PROFILES.get(abha_clean)

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="ABHA ID is not in the local demo registry. Use one of the sample IDs.",
        )

    return {
        "status": "VERIFIED",
        **profile,
        "is_mock": True,
        "disclaimer": "Local demo profile. This is not an ABDM or ABHA verification.",
    }

@router.post("/sync-hmis")
def sync_hmis(req: HmisSyncRequest):
    return {
        "status": "SUCCESS",
        "message": "Patient encounter and case summary queued for HMIS FHIR Bundle export.",
        "patient_id": req.patient_id,
        "case_id": req.case_id,
        "fhir_resource_type": "Encounter",
        "is_mock": True
    }
