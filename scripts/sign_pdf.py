#!/usr/bin/env python3
"""
Sign PDF document.
Usage: python sign_pdf.py <input_pdf> <signature_image> [page] [x] [y] [width] [height]
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from pypdf import PdfWriter, PdfReader
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader
    from PIL import Image
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

DOWNLOAD_DIR = "/home/z/my-project/download"

def sign_pdf(input_path, signature_path, page_num=1, x=None, y=None, width=150, height=50):
    """Add signature image to PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"PDF file not found: {input_path}"}
    
    if not os.path.exists(signature_path):
        return {"success": False, "error": f"Signature image not found: {signature_path}"}
    
    try:
        reader = PdfReader(input_path)
        total_pages = len(reader.pages)
        
        if page_num < 1 or page_num > total_pages:
            page_num = total_pages  # Default to last page
        
        # Get page dimensions
        page = reader.pages[page_num - 1]
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)
        
        # Default position: bottom right
        if x is None:
            x = page_width - width - 50
        if y is None:
            y = 50
        
        # Create signature overlay PDF
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        overlay_path = os.path.join(DOWNLOAD_DIR, f"sig_overlay_{timestamp}.pdf")
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        c = canvas.Canvas(overlay_path, pagesize=(page_width, page_height))
        
        # Draw signature image
        img = ImageReader(signature_path)
        c.drawImage(img, x, y, width=width, height=height, mask='auto')
        
        # Add date below signature
        c.setFont("Helvetica", 8)
        c.drawString(x, y - 15, f"Signed on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        c.save()
        
        # Merge overlay with original PDF
        overlay_reader = PdfReader(overlay_path)
        writer = PdfWriter()
        
        for i, page in enumerate(reader.pages):
            if i == page_num - 1:
                page.merge_page(overlay_reader.pages[0])
            writer.add_page(page)
        
        # Generate output filename
        output_filename = f"signed_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Write signed PDF
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        # Clean up overlay
        os.remove(overlay_path)
        
        return {"success": True, "output": output_path}
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Input PDF and signature image required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    signature_path = sys.argv[2]
    page_num = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    x = float(sys.argv[4]) if len(sys.argv) > 4 else None
    y = float(sys.argv[5]) if len(sys.argv) > 5 else None
    width = float(sys.argv[6]) if len(sys.argv) > 6 else 150
    height = float(sys.argv[7]) if len(sys.argv) > 7 else 50
    
    result = sign_pdf(input_path, signature_path, page_num, x, y, width, height)
    print(json.dumps(result))
