#!/usr/bin/env python3
"""
Add watermark to a PDF file.
Usage: python watermark_pdf.py <input_file> <watermark_text> [opacity]
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime
import math

try:
    from pypdf import PdfReader, PdfWriter
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.colors import Color
except ImportError:
    from PyPDF2 import PdfReader, PdfWriter

DOWNLOAD_DIR = "/home/z/my-project/download"

def create_watermark(text, opacity=0.3):
    """Create a watermark PDF page."""
    watermark_path = "/tmp/watermark.pdf"
    
    # Create watermark using reportlab
    c = canvas.Canvas(watermark_path, pagesize=letter)
    width, height = letter
    
    # Set watermark properties
    c.setFont("Helvetica-Bold", 60)
    c.setFillColor(Color(0.5, 0.5, 0.5, alpha=float(opacity)))
    
    # Rotate and center text
    c.saveState()
    c.translate(width/2, height/2)
    c.rotate(45)
    c.drawCentredString(0, 0, text)
    c.restoreState()
    
    c.save()
    return watermark_path

def watermark_pdf(input_path, watermark_text, opacity="0.3"):
    """Add watermark to PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        # Create watermark
        watermark_path = create_watermark(watermark_text, float(opacity))
        watermark_reader = PdfReader(watermark_path)
        watermark_page = watermark_reader.pages[0]
        
        # Add watermark to each page
        for page in reader.pages:
            page.merge_page(watermark_page)
            writer.add_page(page)
        
        # Clean up watermark file
        os.remove(watermark_path)
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_watermarked_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Write watermarked PDF
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        return {"success": True, "output": output_path}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Input file and watermark text required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    watermark_text = sys.argv[2]
    opacity = sys.argv[3] if len(sys.argv) > 3 else "0.3"
    
    result = watermark_pdf(input_path, watermark_text, opacity)
    print(json.dumps(result))
