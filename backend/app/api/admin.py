from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database.session import get_db
from backend.app.models.models import User, Role, RedFlagRule, AuditLog, Case, Patient, KioskSession
from backend.app.schemas.schemas import UserCreate, UserResponse, RedFlagRuleCreate, AuditLogResponse
from backend.app.security.auth import require_admin, get_password_hash
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/admin", tags=["Admin & System Settings"])

@router.get("/users", response_model=List[UserResponse])
def list_users(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "role_name": u.role.name if u.role else "patient",
            "department": u.department,
            "is_active": u.is_active,
            "created_at": u.created_at
        }
        for u in users
    ]

@router.post("/users", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    role = db.query(Role).filter(Role.name == user_in.role_name).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Role '{user_in.role_name}' does not exist")

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role_id=role.id,
        department=user_in.department,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    AuditService.log(
        db=db,
        action="USER_CREATED",
        resource_type="USER",
        resource_id=new_user.id,
        user_id=current_user.id,
        details={"username": new_user.username, "role": role.name}
    )

    return {
        "id": new_user.id,
        "username": new_user.username,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "role_name": role.name,
        "department": new_user.department,
        "is_active": new_user.is_active,
        "created_at": new_user.created_at
    }

@router.get("/rules")
def list_red_flag_rules(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    rules = db.query(RedFlagRule).all()
    return rules

@router.post("/rules")
def create_or_update_rule(
    rule_in: RedFlagRuleCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    rule = db.query(RedFlagRule).filter(RedFlagRule.rule_code == rule_in.rule_code).first()
    if not rule:
        rule = RedFlagRule(
            rule_code=rule_in.rule_code,
            name=rule_in.name,
            description=rule_in.description,
            severity=rule_in.severity,
            required_symptom_keys=rule_in.required_symptom_keys,
            additional_conditions=rule_in.additional_conditions,
            alert_message=rule_in.alert_message,
            action_required=rule_in.action_required
        )
        db.add(rule)
    else:
        rule.name = rule_in.name
        rule.description = rule_in.description
        rule.severity = rule_in.severity
        rule.required_symptom_keys = rule_in.required_symptom_keys
        rule.additional_conditions = rule_in.additional_conditions
        rule.alert_message = rule_in.alert_message
        rule.action_required = rule_in.action_required

    db.commit()
    db.refresh(rule)

    AuditService.log(
        db=db,
        action="RED_FLAG_RULE_SAVED",
        resource_type="RED_FLAG_RULE",
        resource_id=rule.id,
        user_id=current_user.id,
        details={"rule_code": rule.rule_code, "severity": rule.severity}
    )

    return rule

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(limit: int = 100, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "username": l.user.username if l.user else "Kiosk / System",
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details,
            "timestamp": l.timestamp
        }
        for l in logs
    ]

@router.get("/stats")
def get_system_stats(db: Session = Depends(get_db)):
    total_cases = db.query(Case).count()
    red_flag_cases = db.query(Case).filter(Case.has_red_flag == True).count()
    approved_cases = db.query(Case).filter(Case.status == "APPROVED").count()
    waiting_cases = db.query(Case).filter(Case.status == "WAITING_REVIEW").count()
    total_patients = db.query(Patient).count()

    # Language breakdown
    lang_counts = {}
    for p in db.query(Patient).all():
        lang = p.preferred_language or "en"
        lang_counts[lang] = lang_counts.get(lang, 0) + 1

    return {
        "total_cases": total_cases,
        "waiting_cases": waiting_cases,
        "red_flag_cases": red_flag_cases,
        "approved_cases": approved_cases,
        "total_patients": total_patients,
        "avg_kiosk_time_mins": 3.8,
        "language_distribution": lang_counts
    }
