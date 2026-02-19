#!/usr/bin/env python3
"""
Remove password protection from a PDF file.
Usage: python unlock_pdf.py <input_file> [password]
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

def unlock_pdf(input_path, password=""):
    """Remove password protection from PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    try:
        reader = PdfReader(input_path)
        
        # Check if PDF is encrypted
        if reader.is_encrypted:
            if not reader.decrypt(password):
                return {"success": False, "error": "Incorrect password or unable to decrypt"}
        
        writer = PdfWriter()
        
        # Copy all pages
        for page in reader.pages:
            writer.add_page(page)
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_unlocked_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Write unlocked PDF (without encryption)
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
    password = sys.argv[2] if len(sys.argv) > 2 else ""
    
    result = unlock_pdf(input_path, password)
    print(json.dumps(result))
