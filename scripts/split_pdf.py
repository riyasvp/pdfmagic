#!/usr/bin/env python3
"""
Split a PDF file into multiple files.
Usage: python split_pdf.py <input_file> <mode>
Modes: all, range, count
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

def split_pdf(input_path, mode="all"):
    """Split PDF into pages or by specified mode."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    try:
        reader = PdfReader(input_path)
        total_pages = len(reader.pages)
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        
        if mode == "all":
            # Extract each page as separate PDF
            output_files = []
            for i in range(total_pages):
                writer = PdfWriter()
                writer.add_page(reader.pages[i])
                
                output_filename = f"{base_name}_page_{i+1}_{timestamp}.pdf"
                output_path = os.path.join(DOWNLOAD_DIR, output_filename)
                
                with open(output_path, "wb") as output_file:
                    writer.write(output_file)
                
                output_files.append(output_path)
            
            # Create a zip file if multiple pages
            if len(output_files) > 1:
                import zipfile
                zip_filename = f"{base_name}_split_{timestamp}.zip"
                zip_path = os.path.join(DOWNLOAD_DIR, zip_filename)
                
                with zipfile.ZipFile(zip_path, 'w') as zipf:
                    for file_path in output_files:
                        zipf.write(file_path, os.path.basename(file_path))
                        os.remove(file_path)  # Clean up individual files
                
                return {"success": True, "output": zip_path}
            else:
                return {"success": True, "output": output_files[0] if output_files else ""}
        
        else:
            # Default: extract all pages
            return split_pdf(input_path, "all")
            
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input file required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else "all"
    
    result = split_pdf(input_path, mode)
    print(json.dumps(result))
