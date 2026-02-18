#!/usr/bin/env python3
"""
Add page numbers to a PDF file.
Usage: python page_numbers_pdf.py <input_file> [position] [start_number]
Position: bottom-center, bottom-left, bottom-right, top-center, top-left, top-right
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from pypdf import PdfReader, PdfWriter
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.colors import black
except ImportError:
    from PyPDF2 import PdfReader, PdfWriter

DOWNLOAD_DIR = "/home/z/my-project/download"

def create_page_number(num, position, page_width, page_height):
    """Create a page number PDF."""
    temp_path = f"/tmp/page_num_{num}.pdf"
    
    c = canvas.Canvas(temp_path, pagesize=(page_width, page_height))
    c.setFont("Helvetica", 12)
    c.setFillColor(black)
    
    text = str(num)
    margin = 30
    
    # Position mapping
    positions = {
        "bottom-center": (page_width / 2, margin),
        "bottom-left": (margin, margin),
        "bottom-right": (page_width - margin - len(text) * 7, margin),
        "top-center": (page_width / 2, page_height - margin),
        "top-left": (margin, page_height - margin),
        "top-right": (page_width - margin - len(text) * 7, page_height - margin),
    }
    
    x, y = positions.get(position, (page_width / 2, margin))
    c.drawCentredString(x, y, text)
    c.save()
    
    return temp_path

def add_page_numbers(input_path, position="bottom-center", start_number="1"):
    """Add page numbers to PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    try:
        start_num = int(start_number)
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        total_pages = len(reader.pages)
        
        for i, page in enumerate(reader.pages):
            page_num = start_num + i
            page_width = float(page.mediabox.width)
            page_height = float(page.mediabox.height)
            
            # Create page number
            num_path = create_page_number(page_num, position, page_width, page_height)
            num_reader = PdfReader(num_path)
            
            # Merge page number onto page
            page.merge_page(num_reader.pages[0])
            writer.add_page(page)
            
            # Clean up
            os.remove(num_path)
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_numbered_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Write PDF with page numbers
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        return {"success": True, "output": output_path}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input file required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    position = sys.argv[2] if len(sys.argv) > 2 else "bottom-center"
    start_number = sys.argv[3] if len(sys.argv) > 3 else "1"
    
    result = add_page_numbers(input_path, position, start_number)
    print(json.dumps(result))
