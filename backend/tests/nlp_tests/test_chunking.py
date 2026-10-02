"""
Test script for text chunking.
Tests semantic chunking of extracted text.
"""

import sys
import os
import json
from pathlib import Path
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.nlp.extract import extract_document
from app.nlp.chunk import chunk_pages
from app.logging_system import log_chunking

# Test directory
TEST_DIR = Path(__file__).parent
SAMPLE_DIR = TEST_DIR / "sample_files"
LOG_DIR = TEST_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)


def test_chunking(file_type: str = "pdf"):
    """Test text chunking for a specific file type."""
    print("\n" + "="*60)
    print(f"Testing Chunking - {file_type.upper()}")
    print("="*60)
    
    file_path = SAMPLE_DIR / f"sample.{file_type}"
    if not file_path.exists():
        print(f"❌ Sample file not found: {file_path}")
        print(f"Please add a sample.{file_type} file to the sample_files/ folder")
        return None
    
    try:
        # Extract text first
        print(f"📄 Extracting text from: {file_path.name}")
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        pages = extract_document(file_content, file_type)
        
        if not pages:
            print("❌ No text extracted from document")
            return None
        
        print(f"✅ Extracted {len(pages)} pages")
        
        # Chunk the pages
        print(f"\n🔪 Chunking text...")
        chunks = chunk_pages(pages)
        
        print(f"✅ Chunking successful!")
        print(f"📊 Total chunks: {len(chunks)}")
        
        if chunks:
            # Calculate statistics
            total_chars = sum(len(chunk.get("text", "")) for chunk in chunks)
            avg_chunk_size = total_chars / len(chunks) if chunks else 0
            
            print(f"📝 Total characters: {total_chars}")
            print(f"📏 Average chunk size: {avg_chunk_size:.0f} chars")
            
            # Show preview of first few chunks
            print(f"\n📖 First 3 chunks preview:")
            for i, chunk in enumerate(chunks[:3]):
                preview = chunk.get("text", "")[:150]
                print(f"\n   Chunk {i+1} (Page {chunk.get('page_number')}, Index {chunk.get('chunk_index')}):")
                print(f"   {preview}...")
            
            # Log chunking
            log_chunking(
                document_id=f"test_{file_type}",
                chunk_count=len(chunks),
                chunks=chunks
            )
            
            # Save detailed log
            log_file = LOG_DIR / f"chunking_{file_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(log_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "file": file_path.name,
                    "file_type": file_type,
                    "page_count": len(pages),
                    "chunk_count": len(chunks),
                    "total_chars": total_chars,
                    "avg_chunk_size": avg_chunk_size,
                    "chunks": [
                        {
                            "chunk_index": c.get("chunk_index"),
                            "page_number": c.get("page_number"),
                            "text_length": len(c.get("text", "")),
                            "text_preview": c.get("text", "")[:300]
                        }
                        for c in chunks
                    ]
                }, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Detailed log saved to: {log_file}")
            
            # Show chunk distribution by page
            page_chunks = {}
            for chunk in chunks:
                page_num = chunk.get("page_number", 0)
                page_chunks[page_num] = page_chunks.get(page_num, 0) + 1
            
            print(f"\n📊 Chunks per page:")
            for page_num in sorted(page_chunks.keys()):
                print(f"   Page {page_num}: {page_chunks[page_num]} chunks")
            
        return chunks
        
    except Exception as e:
        print(f"❌ Chunking failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def test_all_file_types():
    """Test chunking for all file types."""
    results = {}
    
    for file_type in ["pdf", "docx", "txt"]:
        chunks = test_chunking(file_type)
        results[file_type] = chunks
    
    return results


def main():
    """Run all chunking tests."""
    print("\n" + "="*60)
    print("DocuChat NLP Pipeline - Chunking Tests")
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
    
    for file_type, chunks in results.items():
        if chunks is None:
            print(f"❌ {file_type.upper()}: Not tested (file not found)")
        elif len(chunks) == 0:
            print(f"⚠️  {file_type.upper()}: No chunks created")
        else:
            total_chars = sum(len(c.get("text", "")) for c in chunks)
            avg_size = total_chars / len(chunks) if chunks else 0
            print(f"✅ {file_type.upper()}: {len(chunks)} chunks, {total_chars} chars, avg {avg_size:.0f} chars/chunk")
    
    print("\n" + "="*60)
    print("Chunking tests completed!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
