"""
PERITIA - Interview Intelligence Service
Agentic workflow: Profile Analysis → Knowledge Retrieval → Interview Planning
→ Question Generation → Answer Evaluation
"""
import json
import logging
import uuid
import re
from typing import List, Optional

from app.models.schemas import (
    UserProfile, ProfileAnalysis, InterviewPreparation, InterviewQuestion,
    InterviewType, AnswerEvaluationRequest, AnswerEvaluation, ExperienceLevel,
)
from app.services.rag_service import get_rag_service
from app.services.watsonx_service import get_watsonx_service

logger = logging.getLogger(__name__)


class InterviewIntelligenceService:
    """
    Agentic interview training workflow.
    Coordinates RAG retrieval, prompt engineering, and model generation.
    """

    SYSTEM_PROMPT = (
        "You are PERITIA, an expert technical and behavioral interview trainer. "
        "Your goal is to help candidates prepare thoroughly for job interviews. "
        "Provide accurate, professional, constructive, and actionable guidance. "
        "Base your responses strictly on the context provided and your expertise. "
        "Always respond in valid JSON when asked. Be specific, not generic."
    )

    def analyze_profile(
        self,
        profile: UserProfile,
        analysis: ProfileAnalysis,
    ) -> str:
        """
        Generate a profile analysis summary string for inclusion in prompts.
        """
        skills_str = ", ".join(profile.skills[:15]) if profile.skills else "not specified"
        gaps_str = ", ".join(analysis.key_gaps[:5]) if analysis.key_gaps else "none identified"

        summary = (
            f"Candidate: {profile.name}\n"
            f"Target Role: {profile.target_role}\n"
            f"Experience Level: {profile.experience_level}\n"
            f"Skills: {skills_str}\n"
            f"Key Gaps vs Role Expectations: {gaps_str}\n"
            f"Role Alignment Score: {analysis.role_alignment_score}/10\n"
        )

        if profile.resume_text:
            summary += f"Resume Summary: {analysis.experience_summary}\n"
        if profile.job_description:
            summary += f"Job Description Provided: Yes (first 300 chars): {profile.job_description[:300]}\n"

        return summary

    def _retrieve_context(self, query: str, top_k: int = 6) -> str:
        """
        Retrieve relevant knowledge base context for the query using RAG.
        Returns formatted context string.
        """
        rag = get_rag_service()
        results = rag.retrieve(query, top_k=top_k)

        if not results:
            return "No specific context retrieved. Use your expert knowledge."

        context_parts = []
        for i, r in enumerate(results, 1):
            source = r["source"].replace(".txt", "").replace("_", " ").title()
            context_parts.append(f"[Context {i} - {source}]\n{r['text']}")

        return "\n\n---\n\n".join(context_parts)

    def generate_preparation(
        self,
        profile: UserProfile,
        analysis: ProfileAnalysis,
        session_id: Optional[str] = None,
    ) -> InterviewPreparation:
        """
        Full agentic workflow to generate personalized interview preparation.
        """
        if session_id is None:
            session_id = str(uuid.uuid4())

        profile_summary = self.analyze_profile(profile, analysis)

        # Retrieve relevant knowledge for this role
        rag_query = (
            f"{profile.target_role} interview questions "
            f"{profile.experience_level} level "
            f"{' '.join(profile.skills[:5])}"
        )
        context = self._retrieve_context(rag_query, top_k=8)

        watsonx = get_watsonx_service()

        # Determine question counts based on experience level
        q_counts = self._get_question_counts(profile.experience_level)

        user_prompt = f"""
CANDIDATE PROFILE:
{profile_summary}

RETRIEVED KNOWLEDGE BASE CONTEXT:
{context}

Generate a comprehensive, personalized interview preparation plan for this candidate.

Return ONLY a valid JSON object with this exact structure:
{{
  "technical_questions": [
    {{
      "id": "tech_1",
      "question": "specific question text",
      "type": "technical",
      "difficulty": "medium",
      "topic": "topic area",
      "model_answer": "detailed model answer",
      "preparation_tips": ["tip1", "tip2"]
    }}
  ],
  "behavioral_questions": [
    {{
      "id": "beh_1",
      "question": "Tell me about...",
      "type": "behavioral",
      "difficulty": "medium",
      "topic": "teamwork",
      "model_answer": "STAR format model answer",
      "preparation_tips": ["tip1", "tip2"]
    }}
  ],
  "hr_questions": [
    {{
      "id": "hr_1",
      "question": "HR question text",
      "type": "hr",
      "difficulty": "easy",
      "topic": "culture fit",
      "model_answer": "professional model answer",
      "preparation_tips": ["tip1"]
    }}
  ],
  "role_specific_questions": [
    {{
      "id": "role_1",
      "question": "role-specific question",
      "type": "role_specific",
      "difficulty": "hard",
      "topic": "domain knowledge",
      "model_answer": "detailed answer",
      "preparation_tips": ["tip1", "tip2"]
    }}
  ],
  "preparation_tips": [
    "Specific actionable tip 1 for this candidate",
    "Specific actionable tip 2",
    "Specific actionable tip 3",
    "Specific actionable tip 4",
    "Specific actionable tip 5"
  ]
}}

Requirements:
- Generate exactly {q_counts['technical']} technical questions specific to {profile.target_role}
- Generate exactly {q_counts['behavioral']} behavioral questions
- Generate exactly {q_counts['hr']} HR questions
- Generate exactly {q_counts['role_specific']} role-specific questions
- Questions must match {profile.experience_level} experience level
- Tailor questions to skills: {', '.join(profile.skills[:8]) if profile.skills else 'not provided'}
- Model answers must be substantive and role-appropriate
- Return ONLY the JSON, no other text
"""

        response_text = watsonx.generate(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=3000,
            temperature=0.4,
        )

        return self._parse_preparation_response(
            response_text, session_id, profile, analysis
        )

    def _get_question_counts(self, experience_level: str) -> dict:
        """Determine appropriate number of questions per category."""
        counts = {
            "entry": {"technical": 4, "behavioral": 3, "hr": 3, "role_specific": 2},
            "junior": {"technical": 5, "behavioral": 3, "hr": 2, "role_specific": 3},
            "mid": {"technical": 6, "behavioral": 4, "hr": 2, "role_specific": 3},
            "senior": {"technical": 6, "behavioral": 4, "hr": 2, "role_specific": 4},
            "lead": {"technical": 5, "behavioral": 4, "hr": 2, "role_specific": 5},
        }
        return counts.get(experience_level, counts["mid"])

    def _parse_preparation_response(
        self,
        response_text: str,
        session_id: str,
        profile: UserProfile,
        analysis: ProfileAnalysis,
    ) -> InterviewPreparation:
        """Parse and validate the model's JSON response into structured objects."""
        # Extract JSON from response (model may wrap it in markdown)
        json_text = self._extract_json(response_text)

        try:
            data = json.loads(json_text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}\nResponse: {response_text[:500]}")
            # Return a minimal fallback
            return self._fallback_preparation(session_id, profile, analysis)

        def make_questions(items: list, default_type: str) -> List[InterviewQuestion]:
            questions = []
            for i, item in enumerate(items or []):
                try:
                    q = InterviewQuestion(
                        id=item.get("id", f"{default_type}_{i+1}"),
                        question=item.get("question", ""),
                        type=item.get("type", default_type),
                        difficulty=item.get("difficulty", "medium"),
                        topic=item.get("topic", "general"),
                        model_answer=item.get("model_answer"),
                        preparation_tips=item.get("preparation_tips", []),
                    )
                    if q.question:
                        questions.append(q)
                except Exception as ex:
                    logger.warning(f"Skipping malformed question item: {ex}")
            return questions

        tech_qs = make_questions(data.get("technical_questions", []), "technical")
        beh_qs = make_questions(data.get("behavioral_questions", []), "behavioral")
        hr_qs = make_questions(data.get("hr_questions", []), "hr")
        role_qs = make_questions(data.get("role_specific_questions", []), "role_specific")
        tips = data.get("preparation_tips", [])

        total = len(tech_qs) + len(beh_qs) + len(hr_qs) + len(role_qs)

        return InterviewPreparation(
            session_id=session_id,
            profile=profile,
            analysis=analysis,
            technical_questions=tech_qs,
            behavioral_questions=beh_qs,
            hr_questions=hr_qs,
            role_specific_questions=role_qs,
            preparation_tips=tips,
            total_questions=total,
        )

    def evaluate_answer(self, request: AnswerEvaluationRequest) -> AnswerEvaluation:
        """
        Evaluate a candidate's interview answer using the watsonx.ai model.
        Returns structured feedback with scores, strengths, and improvements.
        """
        # Get relevant context for evaluation
        context = self._retrieve_context(
            f"{request.question_type} interview answer evaluation {request.question}",
            top_k=4,
        )

        watsonx = get_watsonx_service()

        user_prompt = f"""
INTERVIEW QUESTION:
{request.question}

QUESTION TYPE: {request.question_type}

CANDIDATE'S ANSWER:
{request.user_answer}

REFERENCE CONTEXT:
{context}

{f"EXPECTED CONTEXT: {request.expected_context}" if request.expected_context else ""}

Evaluate this interview answer as a professional interview coach.

Return ONLY a valid JSON object:
{{
  "overall_score": 7.5,
  "overall_assessment": "2-3 sentence professional assessment of the answer",
  "strengths": [
    "specific strength 1",
    "specific strength 2"
  ],
  "areas_for_improvement": [
    "specific area 1",
    "specific area 2"
  ],
  "missing_points": [
    "important concept not mentioned",
    "another missing point"
  ],
  "suggested_response": "A model response that would score 9-10/10 for this question",
  "concise_advice": "One paragraph of direct, actionable advice to improve this specific answer",
  "passed": true
}}

Scoring rubric:
- 9-10: Exceptional, comprehensive, structured, with concrete examples
- 7-8: Good, covers main points, minor gaps  
- 5-6: Adequate, missing some important aspects
- 3-4: Incomplete, significant gaps
- 1-2: Insufficient, missing core concepts
- passed: true if score >= 6

Be specific and constructive. Reference the actual content of the answer.
Return ONLY the JSON, no other text.
"""

        response_text = watsonx.generate(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=2000,
            temperature=0.2,
        )

        return self._parse_evaluation_response(response_text, request.question_id)

    def _parse_evaluation_response(
        self, response_text: str, question_id: str
    ) -> AnswerEvaluation:
        """Parse and validate the evaluation response."""
        json_text = self._extract_json(response_text)

        try:
            data = json.loads(json_text)
            score = float(data.get("overall_score", 5.0))
            score = max(0.0, min(10.0, score))  # Clamp to [0, 10]

            return AnswerEvaluation(
                question_id=question_id,
                overall_score=score,
                overall_assessment=data.get("overall_assessment", "Assessment not available."),
                strengths=data.get("strengths", []),
                areas_for_improvement=data.get("areas_for_improvement", []),
                missing_points=data.get("missing_points", []),
                suggested_response=data.get("suggested_response", ""),
                concise_advice=data.get("concise_advice", ""),
                passed=data.get("passed", score >= 6.0),
            )
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.error(f"Evaluation parse error: {e}\nResponse: {response_text[:500]}")
            return AnswerEvaluation(
                question_id=question_id,
                overall_score=5.0,
                overall_assessment="Evaluation could not be parsed. Please try again.",
                strengths=["Answer was received and processed."],
                areas_for_improvement=["Re-submit for a more detailed evaluation."],
                missing_points=[],
                suggested_response="",
                concise_advice="The evaluation system encountered an error. Please retry.",
                passed=False,
            )

    def _extract_json(self, text: str) -> str:
        """Extract JSON object from text that may contain markdown or other content."""
        # Try to find JSON block between ```json ... ``` or ``` ... ```
        code_block_pattern = r"```(?:json)?\s*(\{.*?\})\s*```"
        match = re.search(code_block_pattern, text, re.DOTALL)
        if match:
            return match.group(1)

        # Try to find raw JSON object
        brace_match = re.search(r"\{.*\}", text, re.DOTALL)
        if brace_match:
            return brace_match.group(0)

        return text

    def _fallback_preparation(
        self, session_id: str, profile: UserProfile, analysis: ProfileAnalysis
    ) -> InterviewPreparation:
        """Return a minimal preparation object when model response parsing fails."""
        fallback_questions = [
            InterviewQuestion(
                id="fallback_1",
                question=f"Tell me about your experience with {profile.target_role} related technologies.",
                type=InterviewType.TECHNICAL,
                difficulty="medium",
                topic="general experience",
                model_answer="Discuss your most relevant technical projects and skills.",
                preparation_tips=["Use specific examples", "Quantify your impact"],
            ),
            InterviewQuestion(
                id="fallback_2",
                question="Tell me about yourself and your career goals.",
                type=InterviewType.HR,
                difficulty="easy",
                topic="introduction",
                model_answer="Provide a 2-minute structured overview of your background and goals.",
                preparation_tips=["Keep it professional and concise", "Align with the role"],
            ),
        ]
        return InterviewPreparation(
            session_id=session_id,
            profile=profile,
            analysis=analysis,
            technical_questions=[fallback_questions[0]],
            hr_questions=[fallback_questions[1]],
            preparation_tips=["Prepare STAR stories", "Research the company"],
            total_questions=2,
        )


# Singleton
_interview_service: InterviewIntelligenceService | None = None


def get_interview_service() -> InterviewIntelligenceService:
    global _interview_service
    if _interview_service is None:
        _interview_service = InterviewIntelligenceService()
    return _interview_service
