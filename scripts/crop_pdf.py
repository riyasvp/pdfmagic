#!/usr/bin/env python3
"""
Crop PDF pages.
Usage: python crop_pdf.py <input_pdf> <left> <bottom> <right> <top>
       margins in points (1 inch = 72 points)
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from pypdf import PdfWriter, PdfReader
except ImportError:
    from PyPDF2 import PdfWriter, PdfReader

DOWNLOAD_DIR = "/home/z/my-project/download"

def crop_pdf(input_path, left=0, bottom=0, right=0, top=0):
    """Crop PDF pages with specified margins."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        for page in reader.pages:
            # Get original page dimensions
            orig_left = float(page.mediabox.left)
            orig_bottom = float(page.mediabox.bottom)
            orig_right = float(page.mediabox.right)
            orig_top = float(page.mediabox.top)
            
            # Calculate new dimensions
            new_left = orig_left + left
            new_bottom = orig_bottom + bottom
            new_right = orig_right - right
            new_top = orig_top - top
            
            # Apply crop
            page.cropbox.lower_left = (new_left, new_bottom)
            page.cropbox.upper_right = (new_right, new_top)
            
            writer.add_page(page)
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"cropped_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        # Write output
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        return {
            "success": True,
            "output": output_path,
            "pages_cropped": len(reader.pages)
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    left = float(sys.argv[2]) if len(sys.argv) > 2 else 0
    bottom = float(sys.argv[3]) if len(sys.argv) > 3 else 0
    right = float(sys.argv[4]) if len(sys.argv) > 4 else 0
    top = float(sys.argv[5]) if len(sys.argv) > 5 else 0
    
    result = crop_pdf(input_path, left, bottom, right, top)
    print(json.dumps(result))
