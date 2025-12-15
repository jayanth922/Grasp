"""
PDF Text Extraction Utilities for Nexus Tutor

Extracts text from PDFs for knowledge graph generation.
Uses PyMuPDF (fitz) for fast, reliable extraction.
"""

import fitz  # PyMuPDF
from typing import List, Dict, Optional
import io


def extract_text_from_pdf(pdf_bytes: bytes, max_pages: int = 50) -> Dict:
    """
    Extract text content from a PDF file.
    
    Args:
        pdf_bytes: Raw PDF file bytes
        max_pages: Maximum pages to process (default 50)
        
    Returns:
        Dict with:
            - text: Combined text from all pages
            - pages: List of page texts with page numbers
            - page_count: Total number of pages
            - error: Error message if extraction failed
    """
    try:
        # Open PDF from bytes
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        page_count = len(doc)
        pages_to_process = min(page_count, max_pages)
        
        pages = []
        all_text = []
        
        for page_num in range(pages_to_process):
            page = doc[page_num]
            text = page.get_text("text")
            
            if text.strip():
                pages.append({
                    "page": page_num + 1,
                    "text": text.strip()
                })
                all_text.append(text.strip())
        
        doc.close()
        
        combined_text = "\n\n".join(all_text)
        
        if not combined_text.strip():
            return {
                "text": "",
                "pages": [],
                "page_count": page_count,
                "error": "No extractable text found. This may be a scanned PDF."
            }
        
        return {
            "text": combined_text,
            "pages": pages,
            "page_count": page_count,
            "error": None
        }
        
    except Exception as e:
        return {
            "text": "",
            "pages": [],
            "page_count": 0,
            "error": f"Failed to extract PDF: {str(e)}"
        }


def chunk_text(text: str, max_chunk_size: int = 4000) -> List[str]:
    """
    Split text into chunks for LLM processing.
    
    Args:
        text: Full text to chunk
        max_chunk_size: Maximum characters per chunk
        
    Returns:
        List of text chunks
    """
    if len(text) <= max_chunk_size:
        return [text]
    
    chunks = []
    paragraphs = text.split("\n\n")
    current_chunk = ""
    
    for para in paragraphs:
        if len(current_chunk) + len(para) + 2 <= max_chunk_size:
            current_chunk += para + "\n\n"
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = para + "\n\n"
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks


def get_pdf_summary(text: str, max_length: int = 500) -> str:
    """
    Get a brief summary/preview of the PDF content.
    
    Args:
        text: Full PDF text
        max_length: Maximum summary length
        
    Returns:
        Truncated text preview
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length].rsplit(" ", 1)[0] + "..."
