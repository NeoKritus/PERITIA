"""
PERITIA - Interview Preparation and Practice API Routes
"""
import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional, List
import json

from app.models.schemas import (
    PrepareRequest, InterviewPreparation, AnswerEvaluationRequest,
    AnswerEvaluation, SessionProgress, UserProfile, ExperienceLevel,
)
from app.services.resume_service import extract_text_from_file, parse_resume_heuristic
from app.services.interview_service import get_interview_service
from app.services.storage_service import get_storage_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/prepare", response_model=InterviewPreparation)
async def prepare_interview(request: PrepareRequest):
    """
    Main agentic workflow endpoint.
    Analyzes profile, retrieves knowledge, and generates personalized preparation.
    """
    try:
        profile = UserProfile(
            name=request.name,
            target_role=request.target_role,
            experience_level=request.experience_level,
            skills=request.skills,
            resume_text=request.resume_text,
            job_description=request.job_description,
        )

        # Parse resume if provided
        analysis = parse_resume_heuristic(
            resume_text=request.resume_text or "",
            target_role=request.target_role,
            skills_input=request.skills,
        )

        # Create session
        storage = get_storage_service()
        session_id = storage.create_session(
            user_name=request.name,
            target_role=request.target_role,
            experience_level=request.experience_level,
        )

        # Run interview intelligence workflow
        service = get_interview_service()
        preparation = service.generate_preparation(profile, analysis, session_id)

        return preparation

    except RuntimeError as e:
        error_msg = str(e)
        if "IBM" in error_msg or "watsonx" in error_msg:
            raise HTTPException(status_code=503, detail=error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        logger.exception("Unexpected error in prepare_interview")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/prepare-with-resume", response_model=InterviewPreparation)
async def prepare_interview_with_resume(
    name: str = Form(...),
    target_role: str = Form(...),
    experience_level: str = Form(...),
    skills: str = Form("[]"),
    job_description: str = Form(""),
    resume_file: Optional[UploadFile] = File(None),
):
    """
    Preparation endpoint that accepts multipart form data with optional resume file upload.
    """
    try:
        skills_list: List[str] = json.loads(skills) if skills else []
    except json.JSONDecodeError:
        skills_list = [s.strip() for s in skills.split(",") if s.strip()]

    resume_text = ""
    if resume_file and resume_file.filename:
        allowed_types = {".pdf", ".docx", ".txt"}
        ext = "." + resume_file.filename.rsplit(".", 1)[-1].lower() if "." in resume_file.filename else ""
        if ext not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed_types)}"
            )

        file_bytes = await resume_file.read()
        if len(file_bytes) > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(status_code=400, detail="Resume file must be under 5MB")

        resume_text = extract_text_from_file(resume_file.filename, file_bytes)
        if not resume_text:
            logger.warning(f"Could not extract text from {resume_file.filename}")

    request = PrepareRequest(
        name=name,
        target_role=target_role,
        experience_level=ExperienceLevel(experience_level),
        skills=skills_list,
        resume_text=resume_text if resume_text else None,
        job_description=job_description if job_description else None,
    )

    return await prepare_interview(request)


@router.post("/evaluate", response_model=AnswerEvaluation)
async def evaluate_answer(request: AnswerEvaluationRequest):
    """
    Evaluate a candidate's answer to an interview question.
    Updates session progress.
    """
    if not request.user_answer or not request.user_answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty")

    if len(request.user_answer.strip()) < 10:
        raise HTTPException(status_code=400, detail="Answer is too short to evaluate")

    try:
        service = get_interview_service()
        evaluation = service.evaluate_answer(request)

        # Update session progress
        storage = get_storage_service()
        storage.update_session_evaluation(
            session_id=request.session_id,
            evaluation=evaluation,
            question_type=request.question_type,
        )

        return evaluation

    except RuntimeError as e:
        error_msg = str(e)
        if "IBM" in error_msg or "watsonx" in error_msg:
            raise HTTPException(status_code=503, detail=error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        logger.exception("Unexpected error in evaluate_answer")
        raise HTTPException(status_code=500, detail=f"Evaluation error: {str(e)}")


@router.get("/session/{session_id}", response_model=SessionProgress)
async def get_session_progress(session_id: str):
    """Retrieve current session progress and performance metrics."""
    storage = get_storage_service()
    progress = storage.get_session(session_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Session not found")
    return progress
