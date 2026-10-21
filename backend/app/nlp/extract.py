"""
Document extraction module using pdfplumber.
Handles PDF, DOCX, and PPTX files.
"""

import pdfplumber
from docx import Document as DocxDocument
from pptx import Presentation
from typing import List, Dict, Any
import re
import io


def extract_from_pdf(file_content: bytes) -> List[Dict[str, Any]]:
    """
    Extract text from PDF file with page numbers.
    
    Args:
        file_content: PDF file as bytes
        
    Returns:
        List of dicts with 'text' and 'page_number' keys
    """
    pages = []
    
    with pdfplumber.open(io.BytesIO(file_content)) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if text:
                # Clean the text
                text = clean_text(text)
                if text.strip():
                    pages.append({
                        "text": text,
                        "page_number": page_num
                    })
    
    return pages


def extract_from_docx(file_content: bytes) -> List[Dict[str, Any]]:
    """
    Extract text from DOCX file.
    
    Args:
        file_content: DOCX file as bytes
        
    Returns:
        List of dicts with 'text' and 'page_number' keys
        (DOCX doesn't have pages, so page_number is always 1)
    """
    doc = DocxDocument(io.BytesIO(file_content))
    
    full_text = []
    for para in doc.paragraphs:
        if para.text.strip():
            full_text.append(para.text)
    
    text = "\n\n".join(full_text)
    text = clean_text(text)
    
    if text.strip():
        return [{
            "text": text,
            "page_number": 1
        }]
    
    return []


def extract_from_pptx(file_content: bytes) -> List[Dict[str, Any]]:
    """
    Extract text from PPTX file.
    
    Args:
        file_content: PPTX file as bytes
        
    Returns:
        List of dicts with 'text' and 'page_number' keys
        (Each slide is treated as a page)
    """
    prs = Presentation(io.BytesIO(file_content))
    pages = []
    
    for slide_num, slide in enumerate(prs.slides, start=1):
        slide_text = []
        for shape in slide.shapes:
            if hasattr(shape, "text") and shape.text.strip():
                slide_text.append(shape.text)
        
        if slide_text:
            text = "\n".join(slide_text)
            text = clean_text(text)
            if text.strip():
                pages.append({
                    "text": text,
                    "page_number": slide_num
                })
    
    return pages


def clean_text(text: str) -> str:
    """
    Clean extracted text by removing headers, footers, and page numbers.
    Does NOT lemmatize or remove stop words (embeddings handle raw text better).
    
    Args:
        text: Raw extracted text
        
    Returns:
        Cleaned text
    """
    # Remove common header/footer patterns
    text = re.sub(r'Page \d+ of \d+', '', text)
    text = re.sub(r'\d+\s*/\s*\d+', '', text)
    
    # Remove standalone page numbers
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    
    # Remove multiple blank lines
    text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
    
    # Normalize whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    
    return text.strip()


def extract_document(file_content: bytes, file_type: str) -> List[Dict[str, Any]]:
    """
    Extract text from document based on file type.
    
    Args:
        file_content: File content as bytes
        file_type: File extension (pdf, docx, pptx)
        
    Returns:
        List of page dicts with text and page_number
    """
    file_type = file_type.lower().strip('.')
    
    if file_type == 'pdf':
        return extract_from_pdf(file_content)
    elif file_type == 'docx':
        return extract_from_docx(file_content)
    elif file_type == 'pptx':
        return extract_from_pptx(file_content)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")
