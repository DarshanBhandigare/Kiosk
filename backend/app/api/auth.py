from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import User
from backend.app.schemas.schemas import Token, UserLogin, UserResponse
from backend.app.security.auth import verify_password, create_access_token, require_authenticated_user
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])

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
