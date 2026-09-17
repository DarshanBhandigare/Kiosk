import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import Case, RedFlagAlert, User
from backend.app.security.auth import require_staff_or_doctor
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/triage", tags=["OPD Triage"])


def get_case(case_id: str, db: Session) -> Case:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.post("/cases/{case_id}/mark-triaged")
def mark_case_triaged(
    case_id: str,
    current_user: User = Depends(require_staff_or_doctor),
    db: Session = Depends(get_db),
):
    case = get_case(case_id, db)
    case.status = "TRIAGED"
    db.commit()

    AuditService.log(
        db=db,
        action="CASE_TRIAGED",
        resource_type="CASE",
        resource_id=case.id,
        user_id=current_user.id,
        details={"triaged_by": current_user.full_name},
    )
    return {"status": "SUCCESS", "case_id": case.id, "case_status": case.status}


@router.post("/cases/{case_id}/escalate")
def escalate_case_to_doctor(
    case_id: str,
    current_user: User = Depends(require_staff_or_doctor),
    db: Session = Depends(get_db),
):
    case = get_case(case_id, db)
    case.status = "UNDER_REVIEW"
    alerts = db.query(RedFlagAlert).filter(
        RedFlagAlert.case_id == case.id,
        RedFlagAlert.is_acknowledged.is_(False),
    ).all()
    for alert in alerts:
        alert.is_acknowledged = True
        alert.acknowledged_by = current_user.full_name
        alert.acknowledged_at = datetime.datetime.utcnow()
    db.commit()

    AuditService.log(
        db=db,
        action="CASE_ESCALATED_TO_DOCTOR",
        resource_type="CASE",
        resource_id=case.id,
        user_id=current_user.id,
        details={"escalated_by": current_user.full_name, "alerts_acknowledged": len(alerts)},
    )
    return {"status": "SUCCESS", "case_id": case.id, "case_status": case.status}
