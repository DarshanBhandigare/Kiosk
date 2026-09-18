from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import KioskSession, InterviewResponse
from backend.app.schemas.schemas import (
    InterviewAnswerRequest,
    AdaptiveNextQuestion
)
from backend.app.ai.factory import get_ai_provider
from backend.app.ai.mock_provider import MockAIProvider
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/interview", tags=["Interview"])

async def generate_unique_next_question(
    chief_complaint: str,
    answered_questions: list[dict],
    language: str
):
    answered_keys = {item.get("question_key") for item in answered_questions}
    answered_texts = {
        " ".join((item.get("question_text") or "").lower().split())
        for item in answered_questions
    }

    # These predictable intake questions should not wait for a remote model.
    if "duration" not in answered_keys or "severity" not in answered_keys:
        return await MockAIProvider().generate_adaptive_followup(
            chief_complaint=chief_complaint,
            answered_questions=answered_questions,
            language=language
        )

    next_q = await get_ai_provider().generate_adaptive_followup(
        chief_complaint=chief_complaint,
        answered_questions=answered_questions,
        language=language
    )
    next_key = next_q.get("question_key") if isinstance(next_q, dict) else None
    next_text = " ".join((next_q.get("question_text") or "").lower().split()) if isinstance(next_q, dict) else ""
    if next_key in answered_keys or (next_text and next_text in answered_texts):
        return await MockAIProvider().generate_adaptive_followup(
            chief_complaint=chief_complaint,
            answered_questions=answered_questions,
            language=language
        )
    return next_q

@router.post("/start", response_model=AdaptiveNextQuestion)
async def start_interview(session_id: str, chief_complaint: str, language: str = "en", db: Session = Depends(get_db)):
    session = db.query(KioskSession).filter(KioskSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    next_q = await generate_unique_next_question(
        chief_complaint=chief_complaint,
        answered_questions=[],
        language=language
    )

    return next_q

@router.post("/answer", response_model=AdaptiveNextQuestion)
async def submit_answer(answer_in: InterviewAnswerRequest, db: Session = Depends(get_db)):
    session = db.query(KioskSession).filter(KioskSession.id == answer_in.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check if this question was previously answered (correction flow)
    existing_resp = db.query(InterviewResponse).filter(
        InterviewResponse.session_id == session.id,
        InterviewResponse.question_key == answer_in.question_key
    ).first()

    if existing_resp:
        existing_resp.is_corrected = True
        existing_resp.previous_response = existing_resp.response_text
        existing_resp.response_text = answer_in.response_text
        existing_resp.input_mode = answer_in.input_mode
        db.commit()
    else:
        new_resp = InterviewResponse(
            session_id=session.id,
            question_key=answer_in.question_key,
            question_text=answer_in.question_text,
            response_text=answer_in.response_text,
            input_mode=answer_in.input_mode,
            language=answer_in.language
        )
        db.add(new_resp)
        db.commit()

    # Retrieve all answered questions for this session to prompt next adaptive follow-up
    all_responses = db.query(InterviewResponse).filter(
        InterviewResponse.session_id == session.id
    ).all()

    answered_payload = [
        {
            "question_key": r.question_key,
            "question_text": r.question_text,
            "response_text": r.response_text
        }
        for r in all_responses
    ]

    # The case is created after the interview, so carry the complaint from the kiosk.
    chief_complaint = answer_in.chief_complaint or "General health consultation"
    if session.case and session.case.chief_complaint:
        chief_complaint = session.case.chief_complaint

    next_q = await generate_unique_next_question(
        chief_complaint=chief_complaint,
        answered_questions=answered_payload,
        language=answer_in.language
    )

    AuditService.log(
        db=db,
        action="INTERVIEW_ANSWER_RECORDED",
        resource_type="SESSION",
        resource_id=session.id,
        details={"question_key": answer_in.question_key, "input_mode": answer_in.input_mode}
    )

    return next_q

@router.get("/{session_id}")
def get_session_interview_responses(session_id: str, db: Session = Depends(get_db)):
    responses = db.query(InterviewResponse).filter(
        InterviewResponse.session_id == session_id
    ).order_by(InterviewResponse.created_at.asc()).all()

    return [
        {
            "id": r.id,
            "question_key": r.question_key,
            "question_text": r.question_text,
            "response_text": r.response_text,
            "input_mode": r.input_mode,
            "language": r.language,
            "is_corrected": r.is_corrected,
            "created_at": r.created_at
        }
        for r in responses
    ]
