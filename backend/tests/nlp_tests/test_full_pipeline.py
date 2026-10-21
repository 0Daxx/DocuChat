"""
Test script for the complete NLP pipeline.
Tests the full pipeline: extraction -> chunking -> embedding.
"""

import sys
import os
import json
from pathlib import Path
from datetime import datetime
import time

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.nlp.extract import extract_document
from app.nlp.chunk import chunk_pages
from app.nlp.embed import embed_texts
from app.logging_system import log_extraction, log_chunking, log_embedding

# Test directory
TEST_DIR = Path(__file__).parent
SAMPLE_DIR = TEST_DIR / "sample_files"
LOG_DIR = TEST_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)


def test_full_pipeline(file_type: str = "pdf"):
    """Test the complete NLP pipeline for a specific file type."""
    print("\n" + "="*60)
    print(f"Testing Full Pipeline - {file_type.upper()}")
    print("="*60)
    
    file_path = SAMPLE_DIR / f"sample.{file_type}"
    if not file_path.exists():
        print(f"❌ Sample file not found: {file_path}")
        print(f"Please add a sample.{file_type} file to the sample_files/ folder")
        return None
    
    try:
        start_time = time.time()
        
        # Step 1: Extract text
        print(f"\n📄 Step 1: Extracting text from {file_path.name}")
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        extract_start = time.time()
        pages = extract_document(file_content, file_type)
        extract_time = time.time() - extract_start
        
        if not pages:
            print("❌ No text extracted from document")
            return None
        
        total_chars = sum(len(page.get("text", "")) for page in pages)
        print(f"✅ Extraction complete in {extract_time:.2f}s")
        print(f"   📊 Pages: {len(pages)}")
        print(f"   📝 Characters: {total_chars}")
        
        # Log extraction
        log_extraction(
            document_id=f"test_{file_type}",
            page_count=len(pages),
            total_chars=total_chars,
            pages=pages
        )
        
        # Step 2: Chunk text
        print(f"\n🔪 Step 2: Chunking text")
        chunk_start = time.time()
        chunks = chunk_pages(pages)
        chunk_time = time.time() - chunk_start
        
        if not chunks:
            print("❌ No chunks created")
            return None
        
        chunk_chars = sum(len(chunk.get("text", "")) for chunk in chunks)
        avg_chunk_size = chunk_chars / len(chunks) if chunks else 0
        print(f"✅ Chunking complete in {chunk_time:.2f}s")
        print(f"   📊 Chunks: {len(chunks)}")
        print(f"   📝 Characters: {chunk_chars}")
        print(f"   📏 Average chunk size: {avg_chunk_size:.0f} chars")
        
        # Log chunking
        log_chunking(
            document_id=f"test_{file_type}",
            chunk_count=len(chunks),
            chunks=chunks
        )
        
        # Step 3: Generate embeddings
        print(f"\n🔄 Step 3: Generating embeddings")
        embed_start = time.time()
        chunk_texts = [chunk["text"] for chunk in chunks]
        embeddings = embed_texts(chunk_texts)
        embed_time = time.time() - embed_start
        
        print(f"✅ Embedding complete in {embed_time:.2f}s")
        print(f"   📊 Embeddings: {len(embeddings)}")
        print(f"   📏 Dimension: {len(embeddings[0])}")
        
        # Log embedding
        from app.config import settings
        log_embedding(
            document_id=f"test_{file_type}",
            chunk_count=len(chunks),
            embedding_dim=len(embeddings[0]),
            model_name=settings.EMBEDDING_MODEL
        )
        
        total_time = time.time() - start_time
        
        # Summary
        print(f"\n📈 Pipeline Summary:")
        print(f"   ⏱️  Total time: {total_time:.2f}s")
        print(f"   ⏱️  Extraction: {extract_time:.2f}s ({extract_time/total_time*100:.1f}%)")
        print(f"   ⏱️  Chunking: {chunk_time:.2f}s ({chunk_time/total_time*100:.1f}%)")
        print(f"   ⏱️  Embedding: {embed_time:.2f}s ({embed_time/total_time*100:.1f}%)")
        
        # Save detailed log
        log_file = LOG_DIR / f"full_pipeline_{file_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump({
                "file": file_path.name,
                "file_type": file_type,
                "file_size": len(file_content),
                "timing": {
                    "total": total_time,
                    "extraction": extract_time,
                    "chunking": chunk_time,
                    "embedding": embed_time
                },
                "extraction": {
                    "page_count": len(pages),
                    "total_chars": total_chars
                },
                "chunking": {
                    "chunk_count": len(chunks),
                    "total_chars": chunk_chars,
                    "avg_chunk_size": avg_chunk_size
                },
                "embedding": {
                    "embedding_count": len(embeddings),
                    "embedding_dim": len(embeddings[0]),
                    "model_name": settings.EMBEDDING_MODEL
                },
                "chunks_preview": [
                    {
                        "chunk_index": chunk.get("chunk_index"),
                        "page_number": chunk.get("page_number"),
                        "text_length": len(chunk.get("text", "")),
                        "text_preview": chunk.get("text", "")[:200]
                    }
                    for chunk in chunks[:5]  # First 5 chunks
                ]
            }, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Detailed log saved to: {log_file}")
        
        return {
            "pages": pages,
            "chunks": chunks,
            "embeddings": embeddings,
            "timing": {
                "total": total_time,
                "extraction": extract_time,
                "chunking": chunk_time,
                "embedding": embed_time
            }
        }
        
    except Exception as e:
        print(f"❌ Pipeline failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def test_all_file_types():
    """Test the full pipeline for all file types."""
    results = {}
    
    for file_type in ["pdf", "docx", "txt"]:
        result = test_full_pipeline(file_type)
        results[file_type] = result
    
    return results


def main():
    """Run all pipeline tests."""
    print("\n" + "="*60)
    print("DocuChat NLP Pipeline - Full Pipeline Tests")
    print("="*60)
    print(f"Test directory: {TEST_DIR}")
    print(f"Sample files: {SAMPLE_DIR}")
    print(f"Log directory: {LOG_DIR}")
    
    # Check if sample files directory exists
    if not SAMPLE_DIR.exists():
        print(f"\n❌ Sample files directory not found: {SAMPLE_DIR}")
        print("Creating directory...")
        SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
        print("Please add sample files (sample.pdf, sample.docx, sample.txt) and run again.")
        return
    
    # Run tests
    results = test_all_file_types()
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    for file_type, result in results.items():
        if result is None:
            print(f"❌ {file_type.upper()}: Not tested (file not found or error)")
        else:
            timing = result["timing"]
            print(f"✅ {file_type.upper()}:")
            print(f"   📊 {len(result['pages'])} pages → {len(result['chunks'])} chunks → {len(result['embeddings'])} embeddings")
            print(f"   ⏱️  {timing['total']:.2f}s (extract: {timing['extraction']:.2f}s, chunk: {timing['chunking']:.2f}s, embed: {timing['embedding']:.2f}s)")
    
    print("\n" + "="*60)
    print("Full pipeline tests completed!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
