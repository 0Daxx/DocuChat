"""
DocuChat NLP Pipeline - Integrated Test Suite
==============================================
This script tests the full NLP pipeline: Extraction -> Chunking -> Embedding.
It dynamically discovers files, handles errors, and logs performance metrics.
"""

import sys
import os
import json
import time
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# ==============================================================================
# PHASE 0: ENVIRONMENT & CONFIGURATION SETUP
# ==============================================================================

def setup_environment():
    """
    WHAT: Configures paths and loads environment variables.
    WHY: Ensures the script can find app modules and secrets (Supabase/HF).
    HOW: Uses pathlib for OS-agnostic paths and python-dotenv for secrets.
    """
    # Determine project root (assuming script is in backend/tests/nlp_tests/)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    
    # Add project root to path to allow 'from app...' imports
    sys.path.insert(0, str(project_root))
    
    # Load .env file
    env_path = project_root / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)
    else:
        # Fallback for testing without Supabase
        os.environ.setdefault('SUPABASE_URL', 'https://dummy.supabase.co')
        os.environ.setdefault('SUPABASE_KEY', 'dummy-key')
        os.environ.setdefault('EMBEDDING_MODEL', 'all-MiniLM-L6-v2')

    return project_root, script_dir

# Initialize paths globally
PROJECT_ROOT, TEST_DIR = setup_environment()
SAMPLE_DIR = TEST_DIR / "sample_files"
LOG_DIR = TEST_DIR / "logs"
LOCAL_MODEL_CACHE = PROJECT_ROOT / "models" / "sentence_transformers"

# Ensure directories exist
LOG_DIR.mkdir(exist_ok=True)
LOCAL_MODEL_CACHE.mkdir(parents=True, exist_ok=True)
SUPPORTED_EXTENSIONS = {'.pdf', '.docx', '.txt'}

# ==============================================================================
# PHASE 1: DYNAMIC FILE DISCOVERY
# ==============================================================================

def discover_sample_files(directory: Path) -> List[Path]:
    """
    WHAT: Finds all supported academic documents in the sample folder.
    WHY: To test the pipeline against various file types and structures.
    HOW: Uses pathlib.glob to match extensions.
    """
    if not directory.exists():
        print(f"⚠️ Sample directory not found: {directory}")
        return []
    
    files = []
    for ext in SUPPORTED_EXTENSIONS:
        files.extend(directory.glob(f"*{ext}"))
    
    return sorted(files)

def get_file_type(file_path: Path) -> Optional[str]:
    """Returns the file type string (e.g., 'pdf') from the path."""
    ext = file_path.suffix.lower()
    return ext[1:] if ext in SUPPORTED_EXTENSIONS else None

# ==============================================================================
# PHASE 2: LOGGING UTILITIES
# ==============================================================================

def save_run_log(phase_name: str, data: Dict[str, Any]) -> Path:
    """
    WHAT: Persists test results to a JSON file.
    WHY: Allows for comparison between different runs or model choices.
    HOW: Serializes data, handling numpy types for JSON compatibility.
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_file = LOG_DIR / f"run_{phase_name}_{timestamp}.json"
    
    def convert_numpy(obj):
        if isinstance(obj, np.integer): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        return obj

    with open(log_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, default=convert_numpy)
    
    return log_file

# ==============================================================================
# PHASE 3: NLP PIPELINE COMPONENTS
# ==============================================================================

def run_extraction(file_path: Path, file_type: str) -> Dict[str, Any]:
    """
    WHAT: Extracts raw text from academic documents.
    WHY: The foundation of the QA system.
    HOW: Uses app.nlp.extract module.
    """
    from app.nlp.extract import extract_document
    
    try:
        start_time = time.time()
        with open(file_path, 'rb') as f:
            content = f.read()
        
        pages = extract_document(content, file_type)
        duration = time.time() - start_time
        
        total_chars = sum(len(p.get('text', '')) for p in pages)
        
        return {
            "status": "success",
            "pages": pages,
            "page_count": len(pages),
            "total_chars": total_chars,
            "duration": round(duration, 4)
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def run_chunking(pages: List[Dict]) -> Dict[str, Any]:
    """
    WHAT: Breaks text into semantic chunks.
    WHY: To fit LLM context windows and improve retrieval accuracy.
    HOW: Uses app.nlp.chunk module.
    """
    from app.nlp.chunk import chunk_pages
    
    try:
        start_time = time.time()
        chunks = chunk_pages(pages)
        duration = time.time() - start_time
        
        if not chunks:
            return {"status": "error", "error": "No chunks generated"}
            
        avg_size = np.mean([len(c['text']) for c in chunks])
        
        return {
            "status": "success",
            "chunks": chunks,
            "chunk_count": len(chunks),
            "avg_chunk_size": round(avg_size, 2),
            "duration": round(duration, 4)
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def run_embedding(chunks: List[Dict]) -> Dict[str, Any]:
    """
    WHAT: Converts text chunks into vector embeddings.
    WHY: Enables semantic search for the QA system.
    HOW: Uses the robust Model Manager to ensure valid local cache.
    """
    from app.nlp.model_manager import get_embedding_model
    from app.config import settings
    
    try:
        # Use the singleton manager
        model = get_embedding_model(
            model_name=settings.EMBEDDING_MODEL,
            cache_dir=Path(settings.MODEL_CACHE_DIR)
        )
        
        texts = [c['text'] for c in chunks]
        if not texts:
            return {"status": "error", "error": "No text to embed"}
            
        start_time = time.time()
        # show_progress_bar=False is better for logs/serverless
        embeddings = model.encode(texts, show_progress_bar=False)
        duration = time.time() - start_time
        
        emb_array = np.array(embeddings)
        norms = np.linalg.norm(emb_array, axis=1)
        
        return {
            "status": "success",
            "embeddings": embeddings,
            "vector_count": len(embeddings),
            "dimension": int(model.get_sentence_embedding_dimension()),
            "mean_norm": round(float(np.mean(norms)), 4),
            "duration": round(duration, 4)
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}
    
# ==============================================================================
# PHASE 4: MAIN ORCHESTRATOR
# ==============================================================================

def main():
    """
    WHAT: Runs the full pipeline test suite.
    WHY: To validate the entire system end-to-end.
    """
    print("\n" + "="*60)
    print("🚀 DocuChat NLP Pipeline - Full Test Suite")
    print("="*60)
    
    # 1. Discover Files
    files = discover_sample_files(SAMPLE_DIR)
    if not files:
        print("❌ No sample files found. Exiting.")
        return

    print(f"🔍 Discovered {len(files)} files in {SAMPLE_DIR}")
    
    all_results = []
    
    for file_path in files:
        file_type = get_file_type(file_path)
        if not file_type: continue
        
        print(f"\n{'='*60}")
        print(f"📄 Processing: {file_path.name} ({file_type.upper()})")
        print(f"{'='*60}")
        
        file_report = {"file": file_path.name, "type": file_type}
        
        # Step 1: Extraction
        print("   ⏳ Phase 1: Extraction...")
        ext_result = run_extraction(file_path, file_type)
        file_report["extraction"] = {
            "status": ext_result["status"],
            "duration": ext_result.get("duration"),
            "stats": {"pages": ext_result.get("page_count"), "chars": ext_result.get("total_chars")}
        }
        
        if ext_result["status"] != "success":
            print(f"   ❌ Extraction failed: {ext_result['error']}")
            all_results.append(file_report)
            continue
        print(f"   ✅ Extracted {ext_result['page_count']} pages in {ext_result['duration']:.2f}s")
        
        # Step 2: Chunking
        print("   ⏳ Phase 2: Chunking...")
        chunk_result = run_chunking(ext_result["pages"])
        file_report["chunking"] = {
            "status": chunk_result["status"],
            "duration": chunk_result.get("duration"),
            "stats": {"chunks": chunk_result.get("chunk_count"), "avg_size": chunk_result.get("avg_chunk_size")}
        }
        
        if chunk_result["status"] != "success":
            print(f"   ❌ Chunking failed: {chunk_result['error']}")
            all_results.append(file_report)
            continue
        print(f"   ✅ Created {chunk_result['chunk_count']} chunks in {chunk_result['duration']:.2f}s")
        
        # Step 3: Embedding
        print("   ⏳ Phase 3: Embedding...")
        emb_result = run_embedding(chunk_result["chunks"])
        file_report["embedding"] = {
            "status": emb_result["status"],
            "duration": emb_result.get("duration"),
            "stats": {"vectors": emb_result.get("vector_count"), "dim": emb_result.get("dimension")}
        }
        
        if emb_result["status"] != "success":
            print(f"   ❌ Embedding failed: {emb_result['error']}")
        else:
            # if emb_result["status"] == "success"
            print(f"   ✅ Generated {emb_result['vector_count']} vectors in {emb_result['duration']:.2f}s")
            
            # NEW: Index into Vector Store
            from app.nlp.vector_store import get_vector_store
            vs = get_vector_store()
            
            # Use filename stem as document ID
            doc_id = file_path.stem 
            
            vs.add_chunks(
                document_id=doc_id,
                chunks=chunk_result["chunks"],
                embeddings=emb_result["embeddings"].tolist() # Convert numpy to list for Chroma
            )
            print(f"   💾 Indexed into Vector Store (ID: {doc_id})")
            
        all_results.append(file_report)
    
# Final Summary & Logging
    print("\n" + "="*60)
    print("📊 FINAL SUMMARY")
    print("="*60)
    
    for res in all_results:
        # Safe access using .get() to prevent KeyError if a step failed
        ext_dur = res.get('extraction', {}).get('duration', 'N/A')
        chk_dur = res.get('chunking', {}).get('duration', 'N/A')
        emb_dur = res.get('embedding', {}).get('duration', 'N/A')
        
        # Determine overall status based on the last attempted step
        if res.get('embedding', {}).get('status') == 'success':
            status = "✅"
        elif res.get('chunking', {}).get('status') == 'success':
            status = "⚠️ (No Embedding)"
        else:
            status = "❌"
            
        print(f"{status} {res['file']:<30} | Ext: {ext_dur}s | Chk: {chk_dur}s | Emb: {emb_dur}s")
    
    # Save Master Log
    if all_results:
        log_path = save_run_log("master_pipeline", {"results": all_results})
        print(f"\n💾 Master log saved to: {log_path}")
    
    print("="*60 + "\n")

if __name__ == "__main__":
    main()