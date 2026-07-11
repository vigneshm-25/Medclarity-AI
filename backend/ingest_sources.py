import os
import sys
import logging
from pathlib import Path
import httpx
from pypdf import PdfReader

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("ingest_sources")

# Add the parent folder of 'app' to system path if needed
sys.path.append(str(Path(__file__).resolve().parent))

from app.config import settings
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter

SOURCES = {
    "WHO EML 2023": {
        "url": "https://iris.who.int/server/api/core/bitstreams/289a875c-cc89-4914-90ad-eb3c578ebaf6/content",
        "filename": "who_eml_2023.pdf"
    },
    "NLEM 2022": {
        "url": "https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2018/UploadConsumer/nlem2022.pdf",
        "filename": "nlem_2022.pdf"
    }
}

def download_source(name: str, url: str, dest_path: Path):
    """Downloads a source file from a URL to a destination path, with headers and retry logic."""
    logger.info(f"Starting download for {name} from {url}...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        # Use verify=False to prevent SSL handshake errors on government portals
        with httpx.Client(follow_redirects=True, verify=False, timeout=60.0) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            
            # Ensure folder exists
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            dest_path.write_bytes(response.content)
            logger.info(f"Successfully downloaded {name} to {dest_path} (Size: {len(response.content)} bytes)")
    except Exception as e:
        logger.error(f"Failed to download {name} from {url}: {e}")
        raise RuntimeError(f"Error downloading {name}: {str(e)}")

def parse_pdf(pdf_path: Path, source_name: str) -> list[Document]:
    """Parses a PDF file page-by-page and returns LangChain Documents with source and page metadata."""
    logger.info(f"Parsing PDF: {pdf_path} for source '{source_name}'...")
    
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found at {pdf_path}")
        
    try:
        reader = PdfReader(pdf_path)
        documents = []
        total_pages = len(reader.pages)
        logger.info(f"Found {total_pages} pages in {pdf_path.name}")
        
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                documents.append(Document(
                    page_content=text,
                    metadata={"source": source_name, "page": idx + 1}
                ))
                
        logger.info(f"Successfully extracted text from {len(documents)}/{total_pages} pages")
        return documents
    except Exception as e:
        logger.error(f"Error parsing PDF {pdf_path}: {e}")
        raise RuntimeError(f"Error parsing {source_name} PDF: {str(e)}")

def build_faiss_index() -> FAISS:
    """Downloads official PDFs, extracts texts, chunks content, and builds the FAISS vector database."""
    settings.create_directories()
    all_documents = []
    
    # 1. Download and Parse PDFs
    for name, info in SOURCES.items():
        pdf_path = settings.SOURCES_DIR / info["filename"]
        
        # Download if it doesn't exist
        if not pdf_path.exists() or pdf_path.stat().st_size == 0:
            download_source(name, info["url"], pdf_path)
        else:
            logger.info(f"File {info['filename']} already exists at {pdf_path}. Skipping download.")
            
        # Parse PDF
        docs = parse_pdf(pdf_path, name)
        all_documents.extend(docs)
        
    if not all_documents:
        raise ValueError("No text content could be extracted from any of the source PDFs.")
        
    # 2. Chunking Documents
    # Chunk size of 1600 characters is roughly 350-400 tokens, chunk overlap is ~75 tokens.
    logger.info("Chunking text passages...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1600, chunk_overlap=300)
    chunks = text_splitter.split_documents(all_documents)
    logger.info(f"Generated {len(chunks)} chunks from source documents")
    
    # 3. Embedding and Indexing
    logger.info("Initializing HuggingFace Embeddings model...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    logger.info("Building FAISS vector database...")
    vector_store = FAISS.from_documents(chunks, embeddings)
    
    logger.info(f"Saving FAISS index to {settings.VECTOR_STORE_DIR}...")
    vector_store.save_local(str(settings.VECTOR_STORE_DIR))
    logger.info("FAISS index successfully built and saved!")
    
    return vector_store

if __name__ == "__main__":
    try:
        logger.info("=== Starting MedClarity AI Source Ingestion & Index Rebuild ===")
        build_faiss_index()
        logger.info("=== Ingestion Completed Successfully ===")
    except Exception as exc:
        logger.error(f"Ingestion process failed: {exc}")
        sys.exit(1)
