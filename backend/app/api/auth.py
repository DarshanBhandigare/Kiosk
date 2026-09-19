import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, or_
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import User
from backend.app.schemas.schemas import Token, UserLogin, UserResponse
from backend.app.security.auth import verify_password, create_access_token, require_authenticated_user
from backend.app.services.audit_service import AuditService
from backend.app.services.seed_data import seed_database

router = APIRouter(prefix="/auth", tags=["Authentication"])


class FirebaseLogin(BaseModel):
    id_token: str


def firebase_account(id_token: str) -> dict:
    api_key = os.getenv("FIREBASE_WEB_API_KEY") or os.getenv("VITE_FIREBASE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Firebase server configuration is missing")
    try:
        response = httpx.post(
            f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={api_key}",
            json={"idToken": id_token},
            timeout=10,
        )
        response.raise_for_status()
        users = response.json().get("users", [])
        if not users or not users[0].get("email"):
            raise ValueError("Firebase account has no email")
        return users[0]
    except (httpx.HTTPError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Firebase session")


@router.post("/firebase", response_model=Token)
def firebase_login(login_data: FirebaseLogin, db: Session = Depends(get_db)):
    account = firebase_account(login_data.id_token)
    email = account["email"].strip().lower()
    username = email.split("@", 1)[0]
    user = db.query(User).filter(
        or_(func.lower(User.email) == email, func.lower(User.username) == username)
    ).first()
    # Existing Render databases may pre-date Firebase user provisioning. Reapply the
    # idempotent staff seed once so the Firebase account has its matching local role.
    if not user:
        seed_database(db)
        user = db.query(User).filter(
            or_(func.lower(User.email) == email, func.lower(User.username) == username)
        ).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This Firebase account is not authorized for MediKiosk")

    role_name = user.role.name if user.role else "patient"
    access_token = create_access_token(data={"sub": user.username, "role": role_name, "user_id": user.id})
    AuditService.log(db=db, action="USER_LOGIN", resource_type="USER", resource_id=user.id, user_id=user.id,
                     details={"email": email, "role": role_name, "provider": "firebase"})
    return {"access_token": access_token, "token_type": "bearer", "role": role_name,
            "user_id": user.id, "username": user.username, "full_name": user.full_name}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    role_name = user.role.name if user.role else "patient"
    access_token = create_access_token(
        data={"sub": user.username, "role": role_name, "user_id": user.id}
    )

    AuditService.log(
        db=db,
        action="USER_LOGIN",
        resource_type="USER",
        resource_id=user.id,
        user_id=user.id,
        details={"username": user.username, "role": role_name}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_name,
        "user_id": user.id,
        "username": user.username,
        "full_name": user.full_name
    }

@router.post("/logout")
def logout(current_user: User = Depends(require_authenticated_user), db: Session = Depends(get_db)):
    AuditService.log(
        db=db,
        action="USER_LOGOUT",
        resource_type="USER",
        resource_id=current_user.id,
        user_id=current_user.id
    )
    return {"status": "SUCCESS", "message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(require_authenticated_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role_name": current_user.role.name if current_user.role else "patient",
        "department": current_user.department,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at
    }
