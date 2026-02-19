#!/usr/bin/env python3
"""
Add password protection to a PDF file.
Usage: python protect_pdf.py <input_file> <password>
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

def protect_pdf(input_path, password):
    """Add password protection to PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    if not password:
        return {"success": False, "error": "Password is required"}
    
    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        # Copy all pages
        for page in reader.pages:
            writer.add_page(page)
        
        # Add encryption
        writer.encrypt(password)
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_protected_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Write protected PDF
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        return {"success": True, "output": output_path}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Input file and password required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    password = sys.argv[2]
    
    result = protect_pdf(input_path, password)
    print(json.dumps(result))
