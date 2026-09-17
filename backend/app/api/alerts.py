import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import RedFlagAlert, User
from backend.app.schemas.schemas import RedFlagAlertResponse
from backend.app.security.auth import require_authenticated_user
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/alerts", tags=["Red Flag Alerts"])

@router.get("", response_model=List[RedFlagAlertResponse])
def get_active_alerts(is_acknowledged: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(RedFlagAlert)
    if is_acknowledged is not None:
        query = query.filter(RedFlagAlert.is_acknowledged == is_acknowledged)
    return query.order_by(RedFlagAlert.created_at.desc()).all()

@router.post("/{id}/review")
def review_alert(
    id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db)
):
    alert = db.query(RedFlagAlert).filter(RedFlagAlert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_acknowledged = True
    alert.acknowledged_by = current_user.full_name
    alert.acknowledged_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(alert)

    AuditService.log(
        db=db,
        action="RED_FLAG_ALERT_ACKNOWLEDGED",
        resource_type="RED_FLAG_ALERT",
        resource_id=alert.id,
        user_id=current_user.id,
        details={"acknowledged_by": current_user.full_name, "severity": alert.severity}
    )

    return {"status": "SUCCESS", "alert_id": alert.id, "acknowledged": True}
