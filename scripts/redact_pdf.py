#!/usr/bin/env python3
"""
Redact sensitive information from PDF.
Usage: python redact_pdf.py <input_pdf> <words_to_redact>
       words_to_redact: comma-separated words to redact
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime
import re

try:
    from pypdf import PdfWriter, PdfReader
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib.colors import black
    from reportlab.lib.utils import simpleSplit
    import pdfplumber
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

DOWNLOAD_DIR = "/home/z/my-project/download"

def redact_pdf(input_path, words_to_redact):
    """Redact specified words from PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    try:
        words = [w.strip() for w in words_to_redact.split(',') if w.strip()]
        
        if not words:
            return {"success": False, "error": "No words specified for redaction"}
        
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        redactions_made = 0
        
        with pdfplumber.open(input_path) as pdf:
            for page_num, (pdf_page, plumber_page) in enumerate(zip(reader.pages, pdf.pages)):
                # Get page dimensions
                page_width = float(pdf_page.mediabox.width)
                page_height = float(pdf_page.mediabox.height)
                
                # Create overlay for redactions
                overlay_path = os.path.join(DOWNLOAD_DIR, f"temp_redact_{page_num}.pdf")
                c = canvas.Canvas(overlay_path, pagesize=(page_width, page_height))
                
                # Find words and their positions
                words_found = plumber_page.extract_words()
                
                for word_info in words_found:
                    word_text = word_info['text']
                    x0 = word_info['x0']
                    y0 = page_height - word_info['bottom']  # Convert coordinates
                    x1 = word_info['x1']
                    y1 = page_height - word_info['top']
                    
                    # Check if word matches any redaction word (case-insensitive)
                    for redact_word in words:
                        if redact_word.lower() in word_text.lower():
                            # Draw black rectangle over the word
                            c.setFillColor(black)
                            c.rect(x0, y0, x1 - x0, y1 - y0, fill=1, stroke=0)
                            redactions_made += 1
                            break
                
                c.save()
                
                # Merge overlay with original page
                overlay_reader = PdfReader(overlay_path)
                pdf_page.merge_page(overlay_reader.pages[0])
                writer.add_page(pdf_page)
                
                # Clean up temp file
                os.remove(overlay_path)
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"redacted_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        # Write output
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        return {
            "success": True,
            "output": output_path,
            "redactions_made": redactions_made
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Input PDF and words to redact required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    words_to_redact = sys.argv[2]
    result = redact_pdf(input_path, words_to_redact)
    print(json.dumps(result))
