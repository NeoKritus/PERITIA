"""
PERITIA - Resume Extraction Service
Extracts structured information from uploaded resume files (PDF, DOCX, TXT).
Falls back gracefully to plain-text if file parsing fails.
"""
import logging
import re
from typing import Optional
from app.models.schemas import ProfileAnalysis

logger = logging.getLogger(__name__)


def _extract_pdf_text(file_bytes: bytes) -> str:
    """Extract text from PDF using PyMuPDF."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text
    except Exception as e:
        logger.warning(f"PDF extraction failed: {e}")
        return ""


def _extract_docx_text(file_bytes: bytes) -> str:
    """Extract text from DOCX using python-docx."""
    try:
        import io
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
    except Exception as e:
        logger.warning(f"DOCX extraction failed: {e}")
        return ""


def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    """
    Extract raw text from a resume file based on its extension.
    Supports PDF, DOCX, and TXT. Returns empty string on failure.
    """
    filename_lower = filename.lower()

    if filename_lower.endswith(".pdf"):
        text = _extract_pdf_text(file_bytes)
    elif filename_lower.endswith(".docx"):
        text = _extract_docx_text(file_bytes)
    elif filename_lower.endswith(".txt"):
        try:
            text = file_bytes.decode("utf-8", errors="replace")
        except Exception:
            text = ""
    else:
        logger.warning(f"Unsupported file type: {filename}")
        text = ""

    return text.strip()


def parse_resume_heuristic(resume_text: str, target_role: str, skills_input: list) -> ProfileAnalysis:
    """
    Heuristic extraction of structured resume information from plain text.
    Supplements user-provided skills with detected technical keywords.
    """
    text_lower = resume_text.lower()

    # Common technology keywords to detect
    TECH_KEYWORDS = [
        "python", "java", "javascript", "typescript", "react", "node.js", "nodejs",
        "vue", "angular", "html", "css", "sql", "postgresql", "mysql", "mongodb",
        "redis", "docker", "kubernetes", "aws", "azure", "gcp", "git", "linux",
        "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "spark",
        "kafka", "fastapi", "flask", "django", "spring", "express", "graphql",
        "rest", "microservices", "ci/cd", "jenkins", "github actions", "terraform",
        "r", "scala", "go", "golang", "rust", "c++", "c#", ".net", "php", "ruby",
        "elasticsearch", "tableau", "power bi", "looker", "airflow", "dbt",
        "machine learning", "deep learning", "nlp", "computer vision", "data science",
    ]

    detected_tech = [kw for kw in TECH_KEYWORDS if kw in text_lower]

    # Merge with user-provided skills (deduplicated, lowercase)
    all_skills_lower = {s.lower() for s in skills_input}
    for t in detected_tech:
        all_skills_lower.add(t)
    extracted_skills = sorted(all_skills_lower)

    # Detect education keywords
    EDUCATION_KEYWORDS = [
        "bachelor", "b.s.", "b.e.", "b.tech", "master", "m.s.", "m.e.", "m.tech",
        "phd", "ph.d.", "mba", "associate", "diploma", "university", "college",
        "computer science", "information technology", "engineering", "mathematics",
    ]
    education = []
    for line in resume_text.split("\n"):
        line_lower = line.lower()
        if any(kw in line_lower for kw in EDUCATION_KEYWORDS) and len(line.strip()) > 5:
            education.append(line.strip())

    education = list(dict.fromkeys(education))[:5]  # Deduplicate, max 5 entries

    # Detect project hints
    PROJECT_PATTERNS = [r"project[s]?\s*[:–\-]", r"built\s+", r"developed\s+", r"designed\s+"]
    projects = []
    for line in resume_text.split("\n"):
        if any(re.search(p, line.lower()) for p in PROJECT_PATTERNS) and len(line.strip()) > 20:
            projects.append(line.strip())
    projects = projects[:5]

    # Build experience summary
    word_count = len(resume_text.split())
    experience_summary = (
        f"Resume provided ({word_count} words). "
        f"Targeting {target_role}. "
        f"Detected {len(extracted_skills)} skills."
    )

    # Gap analysis: compare detected skills with role expectations
    ROLE_EXPECTATIONS = {
        "software engineer": ["python", "java", "data structures", "algorithms", "system design"],
        "data analyst": ["sql", "python", "excel", "tableau", "statistics"],
        "machine learning engineer": ["python", "tensorflow", "pytorch", "scikit-learn", "machine learning"],
        "web developer": ["javascript", "react", "html", "css", "node.js"],
    }

    role_key = target_role.lower()
    expected = []
    for key, skills_list in ROLE_EXPECTATIONS.items():
        if key in role_key or role_key in key:
            expected = skills_list
            break

    key_gaps = [
        skill for skill in expected
        if not any(skill.lower() in s.lower() for s in all_skills_lower)
    ]

    # Simple alignment score
    matched = len(expected) - len(key_gaps)
    role_alignment_score = (matched / len(expected) * 10) if expected else 7.0

    return ProfileAnalysis(
        extracted_skills=extracted_skills,
        education=education,
        experience_summary=experience_summary,
        projects=projects,
        technologies=detected_tech[:15],
        role_alignment_score=round(role_alignment_score, 1),
        key_gaps=key_gaps,
    )
