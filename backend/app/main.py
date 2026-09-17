import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.models.models import *
from backend.app.services.seed_data import seed_database
from backend.app.api import (
    auth, patients, sessions, interview, documents,
    cases, timeline, alerts, doctor, ayurveda, admin, abdm, triage
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="MediKiosk API",
    description="AI-Assisted Patient Case-Taking Software for Hospitals and OPDs",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Centralized exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled Exception on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred. Please contact hospital support.", "error": str(exc)}
    )

# Include API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(patients.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(timeline.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(doctor.router, prefix="/api")
app.include_router(ayurveda.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(abdm.router, prefix="/api")
app.include_router(triage.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "MediKiosk Clinical Core",
        "version": "1.0.0",
        "safety_guardrails": "ACTIVE",
        "diagnosis_disabled": True,
        "prescription_disabled": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
