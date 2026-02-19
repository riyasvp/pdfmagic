#!/usr/bin/env python3
"""
Rotate pages in a PDF file.
Usage: python rotate_pdf.py <input_file> <rotation_degrees>
Rotation: 90, 180, 270
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    from PyPDF2 import PdfReader, PdfWriter

DOWNLOAD_DIR = "/home/z/my-project/download"

def rotate_pdf(input_path, rotation="90"):
    """Rotate PDF pages."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    try:
        rotation = int(rotation)
        if rotation not in [90, 180, 270, -90, -180, -270]:
            return {"success": False, "error": "Rotation must be 90, 180, or 270 degrees"}
        
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        # Rotate each page
        for page in reader.pages:
            page.rotate(rotation)
            writer.add_page(page)
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_rotated_{rotation}_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Write rotated PDF
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        return {"success": True, "output": output_path}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Input file and rotation angle required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    rotation = sys.argv[2]
    
    result = rotate_pdf(input_path, rotation)
    print(json.dumps(result))
