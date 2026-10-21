"""
Test script for document text extraction.
Tests extraction from PDF, DOCX, and TXT files.
"""

import sys
import os
import json
from pathlib import Path
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.nlp.extract import extract_document
from app.logging_system import log_extraction

# Test directory
TEST_DIR = Path(__file__).parent
SAMPLE_DIR = TEST_DIR / "sample_files"
LOG_DIR = TEST_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)


def test_pdf_extraction():
    """Test PDF text extraction."""
    print("\n" + "="*60)
    print("Testing PDF Extraction")
    print("="*60)
    
    pdf_path = SAMPLE_DIR / "sample.pdf"
    if not pdf_path.exists():
        print(f"❌ Sample file not found: {pdf_path}")
        print("Please add a sample.pdf file to the sample_files/ folder")
        return None
    
    try:
        with open(pdf_path, 'rb') as f:
            file_content = f.read()
        
        print(f"📄 File: {pdf_path.name}")
        print(f"📏 Size: {len(file_content)} bytes")
        
        # Extract text
        pages = extract_document(file_content, 'pdf')
        
        print(f"✅ Extraction successful!")
        print(f"📊 Pages extracted: {len(pages)}")
        
        if pages:
            total_chars = sum(len(page.get("text", "")) for page in pages)
            print(f"📝 Total characters: {total_chars}")
            
            # Show preview of first page
            if pages[0].get("text"):
                preview = pages[0]["text"][:200]
                print(f"\n📖 First page preview:")
                print(f"   {preview}...")
            
            # Log extraction
            log_extraction(
                document_id="test_pdf",
                page_count=len(pages),
                total_chars=total_chars,
                pages=pages
            )
            
            # Save detailed log
            log_file = LOG_DIR / f"extraction_pdf_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(log_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "file": pdf_path.name,
                    "file_size": len(file_content),
                    "page_count": len(pages),
                    "total_chars": total_chars,
                    "pages": [
                        {
                            "page_number": p.get("page_number"),
                            "text_length": len(p.get("text", "")),
                            "text_preview": p.get("text", "")[:500]
                        }
                        for p in pages
                    ]
                }, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Detailed log saved to: {log_file}")
            
        return pages
        
    except Exception as e:
        print(f"❌ Extraction failed: {str(e)}")
        return None


def test_docx_extraction():
    """Test DOCX text extraction."""
    print("\n" + "="*60)
    print("Testing DOCX Extraction")
    print("="*60)
    
    docx_path = SAMPLE_DIR / "sample.docx"
    if not docx_path.exists():
        print(f"❌ Sample file not found: {docx_path}")
        print("Please add a sample.docx file to the sample_files/ folder")
        return None
    
    try:
        with open(docx_path, 'rb') as f:
            file_content = f.read()
        
        print(f"📄 File: {docx_path.name}")
        print(f"📏 Size: {len(file_content)} bytes")
        
        # Extract text
        pages = extract_document(file_content, 'docx')
        
        print(f"✅ Extraction successful!")
        print(f"📊 Pages extracted: {len(pages)}")
        
        if pages:
            total_chars = sum(len(page.get("text", "")) for page in pages)
            print(f"📝 Total characters: {total_chars}")
            
            # Show preview
            if pages[0].get("text"):
                preview = pages[0]["text"][:200]
                print(f"\n📖 Preview:")
                print(f"   {preview}...")
            
            # Log extraction
            log_extraction(
                document_id="test_docx",
                page_count=len(pages),
                total_chars=total_chars,
                pages=pages
            )
            
            # Save detailed log
            log_file = LOG_DIR / f"extraction_docx_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(log_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "file": docx_path.name,
                    "file_size": len(file_content),
                    "page_count": len(pages),
                    "total_chars": total_chars,
                    "pages": [
                        {
                            "page_number": p.get("page_number"),
                            "text_length": len(p.get("text", "")),
                            "text_preview": p.get("text", "")[:500]
                        }
                        for p in pages
                    ]
                }, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Detailed log saved to: {log_file}")
            
        return pages
        
    except Exception as e:
        print(f"❌ Extraction failed: {str(e)}")
        return None


def test_txt_extraction():
    """Test TXT text extraction."""
    print("\n" + "="*60)
    print("Testing TXT Extraction")
    print("="*60)
    
    txt_path = SAMPLE_DIR / "sample.txt"
    if not txt_path.exists():
        print(f"❌ Sample file not found: {txt_path}")
        print("Please add a sample.txt file to the sample_files/ folder")
        return None
    
    try:
        with open(txt_path, 'rb') as f:
            file_content = f.read()
        
        print(f"📄 File: {txt_path.name}")
        print(f"📏 Size: {len(file_content)} bytes")
        
        # Extract text
        pages = extract_document(file_content, 'txt')
        
        print(f"✅ Extraction successful!")
        print(f"📊 Pages extracted: {len(pages)}")
        
        if pages:
            total_chars = sum(len(page.get("text", "")) for page in pages)
            print(f"📝 Total characters: {total_chars}")
            
            # Show preview
            if pages[0].get("text"):
                preview = pages[0]["text"][:200]
                print(f"\n📖 Preview:")
                print(f"   {preview}...")
            
            # Log extraction
            log_extraction(
                document_id="test_txt",
                page_count=len(pages),
                total_chars=total_chars,
                pages=pages
            )
            
            # Save detailed log
            log_file = LOG_DIR / f"extraction_txt_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(log_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "file": txt_path.name,
                    "file_size": len(file_content),
                    "page_count": len(pages),
                    "total_chars": total_chars,
                    "pages": [
                        {
                            "page_number": p.get("page_number"),
                            "text_length": len(p.get("text", "")),
                            "text_preview": p.get("text", "")[:500]
                        }
                        for p in pages
                    ]
                }, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Detailed log saved to: {log_file}")
            
        return pages
        
    except Exception as e:
        print(f"❌ Extraction failed: {str(e)}")
        return None


def main():
    """Run all extraction tests."""
    print("\n" + "="*60)
    print("DocuChat NLP Pipeline - Extraction Tests")
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
    results = {
        "pdf": test_pdf_extraction(),
        "docx": test_docx_extraction(),
        "txt": test_txt_extraction()
    }
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    for file_type, pages in results.items():
        if pages is None:
            print(f"❌ {file_type.upper()}: Not tested (file not found)")
        elif len(pages) == 0:
            print(f"⚠️  {file_type.upper()}: No text extracted")
        else:
            total_chars = sum(len(p.get("text", "")) for p in pages)
            print(f"✅ {file_type.upper()}: {len(pages)} pages, {total_chars} chars")
    
    print("\n" + "="*60)
    print("Extraction tests completed!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
