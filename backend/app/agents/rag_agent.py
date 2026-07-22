import os
import sys
from pathlib import Path
from typing import Optional
from app.config import settings
from app.utils.memory import get_memory_usage_mb

# Module-level cached instances for lazy loading
_embeddings = None
_faiss_index = None

def is_embeddings_loaded() -> bool:
    """Returns True if the embeddings model has been loaded into memory."""
    return _embeddings is not None

def get_embeddings():
    """Lazy loads and caches the HuggingFace sentence-transformers embeddings model."""
    global _embeddings
    if _embeddings is None:
        print("[MEM-CHECK] Loading embeddings model (first request)...")
        print("[MEM-CHECK] Embeddings loaded: True (first RAG call)")
        from langchain_huggingface import HuggingFaceEmbeddings
        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    return _embeddings

def get_faiss_index():
    """Lazy loads and caches the FAISS vector index."""
    global _faiss_index
    if _faiss_index is None:
        embeddings = get_embeddings()
        vector_store_path = settings.VECTOR_STORE_DIR
        index_file = vector_store_path / "index.faiss"
        if index_file.exists():
            try:
                from langchain_community.vectorstores import FAISS
                _faiss_index = FAISS.load_local(
                    str(vector_store_path),
                    embeddings,
                    allow_dangerous_deserialization=True
                )
            except Exception as e:
                import logging
                logging.error(f"Error loading local FAISS index: {e}")
                _faiss_index = None

        if _faiss_index is None:
            try:
                backend_path = Path(__file__).resolve().parent.parent.parent
                if str(backend_path) not in sys.path:
                    sys.path.append(str(backend_path))
                from ingest_sources import build_faiss_index
                _faiss_index = build_faiss_index()
            except Exception as e:
                import logging
                logging.error(f"Error rebuilding FAISS vector database: {e}")
                raise RuntimeError(f"RAG Index rebuild failed: {str(e)}")
    return _faiss_index

# Sample trusted clinical guides to seed the RAG automatically so it works out of the box!
DEFAULT_SAFETY_GUIDELINES = """
=== PARACETAMOL / ACETAMINOPHEN DRUG GUIDE ===
- Purpose: Used for treating mild to moderate pain (headaches, body aches, muscle pains) and reducing fever.
- Maximum Dosage: Do not exceed 4000mg (4 grams) in any 24-hour period. Normal adult dose is 500mg to 1000mg every 4 to 6 hours.
- Key Warnings: High doses can cause severe liver damage. Avoid alcohol while taking Paracetamol as it increases liver toxicity. Do not take with other medicines containing paracetamol (e.g. cold/flu syrups).
- Severe Symptoms: Seek immediate medical attention if you experience yellowing of skin/eyes (jaundice), dark urine, persistent vomiting, or severe abdominal pain.

=== AMOXICILLIN DRUG GUIDE ===
- Purpose: A penicillin-type antibiotic used to treat bacterial infections (throat, sinus, lung, urinary tract, skin).
- Course Completion: Always complete the full prescribed course (e.g. 5 or 7 days) even if symptoms disappear. Stopping early allows bacteria to survive and become drug-resistant.
- Usage Instructions: Take with or without food. Drink plenty of water.
- Cautions: Do not take if you have a known penicillin allergy. Can cause mild diarrhea.
- Severe Symptoms: Stop taking and see a doctor immediately if you develop severe watery diarrhea with cramps, difficulty breathing, throat swelling, or skin rashes.

=== METFORMIN DRUG GUIDE ===
- Purpose: An oral diabetes medicine that helps control blood sugar levels for Type 2 Diabetes patients.
- Timing: Must be taken WITH meals (breakfast/dinner) to reduce stomach upset.
- Precautions: Stay well-hydrated. Avoid heavy alcohol intake as it increases the risk of a rare but fatal condition called lactic acidosis.
- Severe Symptoms: Contact a doctor immediately if you experience extreme fatigue, muscle pain, hyperventilation, difficulty breathing, slow/irregular heartbeat, or severe stomach pain.

=== IBUPROFEN DRUG GUIDE ===
- Purpose: A nonsteroidal anti-inflammatory drug (NSAID) used to reduce pain, fever, swelling, and inflammation.
- Timing: Take strictly AFTER food or with milk to prevent stomach pain, ulcers, or stomach bleeding.
- Cautions: Do not take on an empty stomach. Avoid if you have active stomach ulcers, severe kidney disease, or heart failure.
- Severe Symptoms: Stop use and seek emergency care if you experience black/tarry stools, coughing up blood, chest pain, or swelling in feet.

=== CETIRIZINE / LEVOCETIRIZINE DRUG GUIDE ===
- Purpose: An antihistamine used to treat allergy symptoms (runny nose, sneezing, itchy/watery eyes, skin rashes).
- Timing: Usually taken once daily in the evening.
- Cautions: May cause mild drowsiness in some users. Avoid driving or operating machinery if you feel sleepy. Avoid alcohol.
"""

class RAGAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.vector_store_path = settings.VECTOR_STORE_DIR

    @property
    def vector_store(self):
        return get_faiss_index()

    @property
    def embeddings(self):
        return get_embeddings()

    def seed_default_documents(self):
        """
        DEPRECATED: Seeding of drug_safety_guide.txt is deprecated.
        Official sources (WHO and NLEM PDFs) are now downloaded and indexed via ingest_sources.py.
        """
        pass

    def initialize_vector_store(self):
        """Loads existing FAISS index lazily via get_faiss_index()."""
        return get_faiss_index()

    def rebuild_vector_store(self):
        """Rebuilds the vector store from official PDFs by invoking build_faiss_index."""
        global _faiss_index
        try:
            backend_path = Path(__file__).resolve().parent.parent.parent
            if str(backend_path) not in sys.path:
                sys.path.append(str(backend_path))
                
            from ingest_sources import build_faiss_index
            _faiss_index = build_faiss_index()
            return _faiss_index
        except Exception as e:
            import logging
            logging.error(f"Error rebuilding FAISS vector database: {e}")
            raise RuntimeError(f"RAG Index rebuild failed: {str(e)}")

    def retrieve_context(self, query: str, k: int = 3) -> dict:
        """
        Queries the FAISS index to retrieve the top-k clinical references.
        Returns a dictionary containing:
          - "context": Formatted string of matching paragraphs for backward-compatibility.
          - "sources": List of sources with page numbers and content snippet.
          - "low_confidence": Boolean indicating if query relevance is low.
        """
        was_loaded_before = is_embeddings_loaded()
        vector_store = get_faiss_index()
        if not was_loaded_before and is_embeddings_loaded():
            print(f"[MEM-CHECK] Post-first RAG call memory: {get_memory_usage_mb():.1f} MB")
        
        if not query or not query.strip():
            return {
                "context": "No query terms provided.",
                "sources": [],
                "low_confidence": True
            }
            
        if not vector_store:
            return {
                "context": "No RAG context database available.",
                "sources": [],
                "low_confidence": True
            }
            
        try:
            # We use similarity_search_with_score to retrieve distance scores
            docs_and_scores = vector_store.similarity_search_with_score(query, k=k)
            context_blocks = []
            sources = []
            
            # FAISS returns L2 distance. A score closer to 0 indicates higher similarity.
            # L2 distance > 1.2 generally signifies low correlation with the clinical guidelines.
            low_confidence = False
            if not docs_and_scores:
                low_confidence = True
            else:
                top_score = docs_and_scores[0][1]
                if top_score > 1.2:
                    low_confidence = True
            
            for doc, score in docs_and_scores:
                source = doc.metadata.get("source", "Unknown Source")
                page = doc.metadata.get("page", "Unknown Page")
                context_blocks.append(f"[Source: {source}, Page: {page}]\n{doc.page_content}")
                sources.append({
                    "source": source,
                    "page": page,
                    "content": doc.page_content,
                    "score": float(score)
                })
                
            return {
                "context": "\n\n---\n\n".join(context_blocks),
                "sources": sources,
                "low_confidence": low_confidence
            }
        except Exception as e:
            import logging
            logging.error(f"Error during RAG retrieval: {e}")
            return {
                "context": f"Error during RAG retrieval: {str(e)}",
                "sources": [],
                "low_confidence": True
            }
