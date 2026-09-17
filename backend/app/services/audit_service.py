from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import AuditLog

class AuditService:
    @staticmethod
    def log(
        db: Session,
        action: str,
        resource_type: str,
        resource_id: str,
        user_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
        return log_entry
