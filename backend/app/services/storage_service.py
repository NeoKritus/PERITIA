"""
PERITIA - Session / Progress Storage Service
Uses TinyDB for lightweight local JSON storage.
No production database infrastructure required.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.models.schemas import SessionProgress, AnswerEvaluation

logger = logging.getLogger(__name__)


class StorageService:
    """
    Lightweight session and progress storage using TinyDB.
    Falls back to in-memory dict if TinyDB is unavailable.
    """

    def __init__(self, db_path: str = "peritia_db.json"):
        self._memory_store: dict = {}  # fallback
        self._db = None
        self._sessions_table = None
        self._db_path = db_path
        self._init_db(db_path)

    def _init_db(self, db_path: str):
        try:
            from tinydb import TinyDB, Query
            self._db = TinyDB(db_path)
            self._sessions_table = self._db.table("sessions")
            self._Query = Query
            logger.info(f"TinyDB initialized at {db_path}")
        except ImportError:
            logger.warning("TinyDB not available; using in-memory storage")
        except Exception as e:
            logger.warning(f"TinyDB init failed ({e}); using in-memory storage")

    def create_session(self, user_name: str, target_role: str, experience_level: str) -> str:
        session_id = str(uuid.uuid4())
        progress = SessionProgress(
            session_id=session_id,
            user_name=user_name,
            target_role=target_role,
            experience_level=experience_level,
        )
        self._save_session(progress)
        return session_id

    def get_session(self, session_id: str) -> Optional[SessionProgress]:
        if self._sessions_table is not None:
            try:
                Q = self._Query
                rows = self._sessions_table.search(Q.session_id == session_id)
                if rows:
                    return SessionProgress(**rows[0])
            except Exception as e:
                logger.error(f"DB read error: {e}")

        # Fallback to memory
        data = self._memory_store.get(session_id)
        if data:
            return SessionProgress(**data)
        return None

    def update_session_evaluation(
        self, session_id: str, evaluation: AnswerEvaluation, question_type: str
    ) -> Optional[SessionProgress]:
        progress = self.get_session(session_id)
        if not progress:
            return None

        progress.questions_attempted += 1
        if evaluation.passed:
            progress.questions_passed += 1

        # Update type-specific scores (running average)
        n = progress.questions_attempted
        score = evaluation.overall_score

        if "technical" in question_type:
            prev = progress.technical_score
            progress.technical_score = round(((prev * (n - 1)) + score) / n, 1)
        elif "behavioral" in question_type:
            prev = progress.behavioral_score
            progress.behavioral_score = round(((prev * (n - 1)) + score) / n, 1)
        elif "hr" in question_type:
            prev = progress.hr_score
            progress.hr_score = round(((prev * (n - 1)) + score) / n, 1)

        # Overall score = average of non-zero type scores
        active_scores = [s for s in [
            progress.technical_score,
            progress.behavioral_score,
            progress.hr_score,
        ] if s > 0]
        progress.overall_score = round(sum(active_scores) / len(active_scores), 1) if active_scores else score

        # Store compact evaluation record
        progress.evaluations.append({
            "question_id": evaluation.question_id,
            "score": evaluation.overall_score,
            "passed": evaluation.passed,
            "type": question_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        self._save_session(progress)
        return progress

    def _save_session(self, progress: SessionProgress):
        data = progress.model_dump()

        if self._sessions_table is not None:
            try:
                Q = self._Query
                existing = self._sessions_table.search(Q.session_id == progress.session_id)
                if existing:
                    self._sessions_table.update(data, Q.session_id == progress.session_id)
                else:
                    self._sessions_table.insert(data)
                return
            except Exception as e:
                logger.error(f"DB write error: {e}")

        # Fallback to memory
        self._memory_store[progress.session_id] = data


# Singleton
_storage_service: StorageService | None = None


def get_storage_service() -> StorageService:
    global _storage_service
    if _storage_service is None:
        from app.core.config import get_settings
        settings = get_settings()
        _storage_service = StorageService(db_path=settings.DB_PATH)
    return _storage_service
