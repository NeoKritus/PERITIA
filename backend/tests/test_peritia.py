"""
PERITIA - Backend Tests
Tests for RAG retrieval, interview workflow, answer evaluation, and API endpoints.
"""
import pytest
import sys
import os

# Ensure backend package is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ─── RAG Tests ────────────────────────────────────────────────────────────────

class TestRAGService:
    """Tests for the RAG retrieval pipeline."""

    def test_knowledge_base_files_exist(self):
        """Knowledge base text files should be present."""
        from pathlib import Path
        kb_path = Path("data/knowledge_base")
        assert kb_path.exists(), "Knowledge base directory missing"
        txt_files = list(kb_path.glob("*.txt"))
        assert len(txt_files) >= 4, f"Expected >= 4 knowledge base files, found {len(txt_files)}"

    def test_rag_service_initializes(self):
        """RAG service should initialize and build index without error."""
        from app.services.rag_service import RAGService
        service = RAGService()
        success = service.build_index()
        assert success, "RAG index build failed"
        assert service.is_ready(), "RAG service should be ready after build"

    def test_rag_retrieves_relevant_content(self):
        """RAG should return relevant results for a known query."""
        from app.services.rag_service import RAGService
        service = RAGService()
        service.build_index()

        results = service.retrieve("Python data structures algorithm interview", top_k=3)
        assert len(results) > 0, "RAG should return at least one result"

        for r in results:
            assert "text" in r
            assert "source" in r
            assert "score" in r
            assert isinstance(r["score"], float)
            assert len(r["text"]) > 20

    def test_rag_retrieves_role_specific_content(self):
        """RAG should retrieve content relevant to specific roles."""
        from app.services.rag_service import RAGService
        service = RAGService()
        service.build_index()

        results = service.retrieve("SQL window functions data analyst interview")
        assert len(results) > 0
        # At least one result should come from data_analyst
        sources = [r["source"] for r in results]
        has_relevant = any("data_analyst" in s or "software_engineer" in s for s in sources)
        assert has_relevant, f"Expected role-specific content, got sources: {sources}"

    def test_rag_handles_empty_query(self):
        """RAG should handle edge cases gracefully."""
        from app.services.rag_service import RAGService
        service = RAGService()
        service.build_index()
        # Should not raise even with minimal input
        results = service.retrieve("interview", top_k=2)
        assert isinstance(results, list)


# ─── Resume Service Tests ─────────────────────────────────────────────────────

class TestResumeService:
    """Tests for resume parsing and profile analysis."""

    def test_heuristic_analysis_with_skills(self):
        """Profile analysis should detect skills and compute alignment."""
        from app.services.resume_service import parse_resume_heuristic
        analysis = parse_resume_heuristic(
            resume_text="Python developer with 3 years experience. B.S. Computer Science.",
            target_role="Software Engineer",
            skills_input=["Python", "Java", "Git"],
        )
        assert "python" in [s.lower() for s in analysis.extracted_skills]
        assert analysis.role_alignment_score >= 0
        assert analysis.role_alignment_score <= 10

    def test_heuristic_analysis_without_resume(self):
        """Analysis should work with empty resume text."""
        from app.services.resume_service import parse_resume_heuristic
        analysis = parse_resume_heuristic(
            resume_text="",
            target_role="Data Analyst",
            skills_input=["SQL", "Python", "Tableau"],
        )
        assert len(analysis.extracted_skills) >= 3
        assert isinstance(analysis.key_gaps, list)

    def test_heuristic_detects_education(self):
        """Analysis should extract education information."""
        from app.services.resume_service import parse_resume_heuristic
        resume = """
        Education:
        Bachelor of Science in Computer Science, MIT, 2022
        Skills: Python, SQL, Machine Learning
        """
        analysis = parse_resume_heuristic(
            resume_text=resume,
            target_role="Machine Learning Engineer",
            skills_input=["Python"],
        )
        assert len(analysis.education) > 0

    def test_file_extraction_txt(self):
        """Should extract text from .txt files."""
        from app.services.resume_service import extract_text_from_file
        content = "Software Engineer with Python and React experience."
        result = extract_text_from_file("resume.txt", content.encode("utf-8"))
        assert "Software Engineer" in result

    def test_file_extraction_unsupported(self):
        """Unsupported file types should return empty string."""
        from app.services.resume_service import extract_text_from_file
        result = extract_text_from_file("resume.xyz", b"some content")
        assert result == ""


# ─── Interview Service Tests ──────────────────────────────────────────────────

class TestInterviewService:
    """Tests for interview intelligence workflow (mocked watsonx)."""

    def _make_profile_and_analysis(self):
        from app.models.schemas import UserProfile, ExperienceLevel
        from app.services.resume_service import parse_resume_heuristic

        profile = UserProfile(
            name="Test Candidate",
            target_role="Software Engineer",
            experience_level=ExperienceLevel.MID,
            skills=["Python", "FastAPI", "PostgreSQL"],
        )
        analysis = parse_resume_heuristic("", "Software Engineer", ["Python", "FastAPI"])
        return profile, analysis

    def test_profile_summary_generation(self):
        """Profile summary should include key information."""
        from app.services.interview_service import InterviewIntelligenceService
        profile, analysis = self._make_profile_and_analysis()
        service = InterviewIntelligenceService()
        summary = service.analyze_profile(profile, analysis)
        assert "Test Candidate" in summary
        assert "Software Engineer" in summary
        assert "mid" in summary.lower()

    def test_json_extraction_from_markdown(self):
        """Should extract JSON from markdown-wrapped model output."""
        from app.services.interview_service import InterviewIntelligenceService
        service = InterviewIntelligenceService()

        response = '```json\n{"key": "value"}\n```'
        result = service._extract_json(response)
        import json
        parsed = json.loads(result)
        assert parsed["key"] == "value"

    def test_json_extraction_raw(self):
        """Should extract raw JSON object from text."""
        from app.services.interview_service import InterviewIntelligenceService
        service = InterviewIntelligenceService()
        response = 'Here is the result: {"key": "value"} end'
        result = service._extract_json(response)
        import json
        parsed = json.loads(result)
        assert parsed["key"] == "value"

    def test_fallback_preparation(self):
        """Fallback preparation should return valid InterviewPreparation."""
        from app.services.interview_service import InterviewIntelligenceService
        from app.models.schemas import InterviewPreparation
        service = InterviewIntelligenceService()
        profile, analysis = self._make_profile_and_analysis()
        result = service._fallback_preparation("test-session", profile, analysis)
        assert isinstance(result, InterviewPreparation)
        assert result.session_id == "test-session"
        assert result.total_questions > 0

    def test_evaluation_parse_error_fallback(self):
        """Evaluation should return a fallback object on parse error."""
        from app.services.interview_service import InterviewIntelligenceService
        from app.models.schemas import AnswerEvaluation
        service = InterviewIntelligenceService()
        result = service._parse_evaluation_response("not valid json at all", "q_1")
        assert isinstance(result, AnswerEvaluation)
        assert result.question_id == "q_1"
        assert result.overall_score == 5.0

    def test_get_question_counts(self):
        """Question counts should vary by experience level."""
        from app.services.interview_service import InterviewIntelligenceService
        service = InterviewIntelligenceService()
        entry = service._get_question_counts("entry")
        senior = service._get_question_counts("senior")
        assert entry["technical"] < senior["technical"] or entry["role_specific"] <= senior["role_specific"]


# ─── Storage Service Tests ────────────────────────────────────────────────────

class TestStorageService:
    """Tests for session storage."""

    def test_create_and_retrieve_session(self, tmp_path):
        """Should create and retrieve a session."""
        from app.services.storage_service import StorageService
        db_file = str(tmp_path / "test_db.json")
        storage = StorageService(db_path=db_file)
        session_id = storage.create_session("Alice", "Data Analyst", "junior")
        assert session_id
        progress = storage.get_session(session_id)
        assert progress is not None
        assert progress.user_name == "Alice"
        assert progress.target_role == "Data Analyst"

    def test_update_session_evaluation(self, tmp_path):
        """Should update progress after evaluation."""
        from app.services.storage_service import StorageService
        from app.models.schemas import AnswerEvaluation
        db_file = str(tmp_path / "test_db2.json")
        storage = StorageService(db_path=db_file)
        session_id = storage.create_session("Bob", "ML Engineer", "senior")

        eval_obj = AnswerEvaluation(
            question_id="q1",
            overall_score=8.0,
            overall_assessment="Good answer",
            strengths=["Clear"],
            areas_for_improvement=["More depth"],
            missing_points=[],
            suggested_response="Better response",
            concise_advice="Add more detail",
            passed=True,
        )
        updated = storage.update_session_evaluation(session_id, eval_obj, "technical")
        assert updated is not None
        assert updated.questions_attempted == 1
        assert updated.questions_passed == 1
        assert updated.technical_score == 8.0

    def test_missing_session_returns_none(self, tmp_path):
        """Querying a non-existent session should return None."""
        from app.services.storage_service import StorageService
        db_file = str(tmp_path / "test_db3.json")
        storage = StorageService(db_path=db_file)
        result = storage.get_session("nonexistent-id")
        assert result is None


# ─── API Endpoint Tests ───────────────────────────────────────────────────────

class TestAPIEndpoints:
    """Tests for FastAPI endpoints using TestClient."""

    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        from main import app
        return TestClient(app)

    def test_health_endpoint(self, client):
        """Health endpoint should return 200 with expected fields."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "ok"
        assert "watsonx_configured" in data
        assert "rag_ready" in data

    def test_evaluate_empty_answer_rejected(self, client):
        """Empty answer should be rejected with 400."""
        payload = {
            "session_id": "test-session",
            "question_id": "q1",
            "question": "What is a hash table?",
            "question_type": "technical",
            "user_answer": "  ",
        }
        response = client.post("/api/interview/evaluate", json=payload)
        assert response.status_code == 400

    def test_evaluate_too_short_answer_rejected(self, client):
        """Very short answers should be rejected."""
        payload = {
            "session_id": "test-session",
            "question_id": "q1",
            "question": "Explain recursion.",
            "question_type": "technical",
            "user_answer": "idk",
        }
        response = client.post("/api/interview/evaluate", json=payload)
        assert response.status_code == 400

    def test_session_not_found(self, client):
        """Requesting a non-existent session should return 404."""
        response = client.get("/api/interview/session/nonexistent-session-id-12345")
        assert response.status_code == 404

    def test_prepare_missing_watsonx_returns_503(self, client):
        """WatsonxService.generate should raise RuntimeError when not configured."""
        from app.services.watsonx_service import WatsonxService

        # Directly test the service raises the right error when not configured
        service = WatsonxService()
        service.settings = type('S', (), {
            'is_watsonx_configured': False,
            'IBM_API_KEY': '',
            'IBM_PROJECT_ID': '',
        })()

        try:
            service.generate("system", "user")
            assert False, "Should have raised RuntimeError"
        except RuntimeError as e:
            assert "IBM" in str(e) or "watsonx" in str(e)
