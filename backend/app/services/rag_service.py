"""
PERITIA - RAG (Retrieval-Augmented Generation) Service
Builds and queries a FAISS vector store from the local knowledge base.
"""
import os
import pickle
import logging
from pathlib import Path
from typing import List, Tuple
import numpy as np

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Lazy imports to avoid startup failures if packages are missing
_faiss = None
_SentenceTransformer = None


def _import_faiss():
    global _faiss
    if _faiss is None:
        import faiss
        _faiss = faiss
    return _faiss


def _import_sentence_transformer():
    global _SentenceTransformer
    if _SentenceTransformer is None:
        from sentence_transformers import SentenceTransformer
        _SentenceTransformer = SentenceTransformer
    return _SentenceTransformer


class RAGService:
    """
    Lightweight RAG pipeline using FAISS for vector similarity search
    and SentenceTransformers for embedding generation.
    """

    INDEX_FILE = "rag_index.faiss"
    CHUNKS_FILE = "rag_chunks.pkl"

    def __init__(self):
        self.settings = get_settings()
        self.index = None
        self.chunks: List[str] = []
        self.chunk_metadata: List[dict] = []
        self.encoder = None
        self._initialized = False

    def _get_encoder(self):
        if self.encoder is None:
            ST = _import_sentence_transformer()
            self.encoder = ST(self.settings.EMBEDDING_MODEL)
        return self.encoder

    def _load_knowledge_base(self) -> List[Tuple[str, str]]:
        """
        Load all .txt files from the knowledge base directory.
        Returns list of (content, source_filename) tuples.
        """
        kb_path = Path(self.settings.KNOWLEDGE_BASE_PATH)
        documents = []

        if not kb_path.exists():
            logger.warning(f"Knowledge base path not found: {kb_path}")
            return documents

        for txt_file in sorted(kb_path.glob("*.txt")):
            try:
                content = txt_file.read_text(encoding="utf-8")
                documents.append((content, txt_file.name))
                logger.info(f"Loaded knowledge base file: {txt_file.name}")
            except Exception as e:
                logger.error(f"Failed to read {txt_file}: {e}")

        return documents

    def _chunk_document(self, text: str, source: str) -> List[Tuple[str, dict]]:
        """
        Split document into overlapping chunks for better retrieval.
        Returns list of (chunk_text, metadata) tuples.
        """
        chunk_size = self.settings.CHUNK_SIZE
        overlap = 100
        chunks = []

        # Split by double newline first (paragraph-aware chunking)
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

        current_chunk = ""
        for paragraph in paragraphs:
            if len(current_chunk) + len(paragraph) < chunk_size:
                current_chunk += "\n\n" + paragraph if current_chunk else paragraph
            else:
                if current_chunk:
                    chunks.append((current_chunk, {"source": source}))
                # Start new chunk with overlap
                current_chunk = paragraph

        if current_chunk:
            chunks.append((current_chunk, {"source": source}))

        return chunks

    def build_index(self):
        """Build FAISS index from the knowledge base documents."""
        try:
            faiss = _import_faiss()
            encoder = self._get_encoder()
        except ImportError as e:
            logger.error(f"Required package not available for RAG: {e}")
            self._initialized = False
            return False

        documents = self._load_knowledge_base()
        if not documents:
            logger.warning("No documents found in knowledge base")
            self._initialized = False
            return False

        all_chunks = []
        all_metadata = []

        for content, source in documents:
            chunks = self._chunk_document(content, source)
            for chunk_text, meta in chunks:
                all_chunks.append(chunk_text)
                all_metadata.append(meta)

        if not all_chunks:
            logger.warning("No chunks generated from knowledge base")
            return False

        logger.info(f"Encoding {len(all_chunks)} chunks...")
        embeddings = encoder.encode(all_chunks, show_progress_bar=False)
        embeddings = np.array(embeddings, dtype="float32")

        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings)

        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner product = cosine similarity
        self.index.add(embeddings)
        self.chunks = all_chunks
        self.chunk_metadata = all_metadata
        self._initialized = True

        logger.info(f"RAG index built: {len(all_chunks)} chunks, dim={dimension}")
        return True

    def retrieve(self, query: str, top_k: int = None) -> List[dict]:
        """
        Retrieve the most relevant chunks for a given query.
        Returns list of {text, source, score} dicts.
        """
        if not self._initialized or self.index is None:
            logger.warning("RAG index not initialized, rebuilding...")
            if not self.build_index():
                return []

        top_k = top_k or self.settings.TOP_K_RETRIEVAL

        try:
            encoder = self._get_encoder()
            query_embedding = encoder.encode([query], show_progress_bar=False)
            query_embedding = np.array(query_embedding, dtype="float32")

            import faiss as _f
            _f.normalize_L2(query_embedding)

            scores, indices = self.index.search(query_embedding, top_k)

            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx >= 0 and idx < len(self.chunks):
                    results.append({
                        "text": self.chunks[idx],
                        "source": self.chunk_metadata[idx].get("source", "unknown"),
                        "score": float(score),
                    })

            return results

        except Exception as e:
            logger.error(f"RAG retrieval error: {e}")
            return []

    def is_ready(self) -> bool:
        return self._initialized and self.index is not None


# Singleton instance
_rag_service: RAGService | None = None


def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
        _rag_service.build_index()
    return _rag_service
