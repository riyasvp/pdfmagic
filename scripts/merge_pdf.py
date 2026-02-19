#!/usr/bin/env python3
"""
Merge multiple PDF files into one.
Usage: python merge_pdf.py <input_file1> <input_file2> ... [input_fileN]
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

def merge_pdfs(input_paths):
    """Merge multiple PDF files into one."""
    writer = PdfWriter()
    
    for path in input_paths:
        if not os.path.exists(path):
            return {"success": False, "error": f"File not found: {path}"}
        
        try:
            reader = PdfReader(path)
            for page in reader.pages:
                writer.add_page(page)
        except Exception as e:
            return {"success": False, "error": f"Failed to read {path}: {str(e)}"}
    
    # Generate output filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"merged_{timestamp}.pdf"
    output_path = os.path.join(DOWNLOAD_DIR, output_filename)
    
    # Ensure download directory exists
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    
    # Write merged PDF
    with open(output_path, "wb") as output_file:
        writer.write(output_file)
    
    return {"success": True, "output": output_path}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "At least one input file required"}))
        sys.exit(1)
    
    input_paths = sys.argv[1:]
    result = merge_pdfs(input_paths)
    print(json.dumps(result))
