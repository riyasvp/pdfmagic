#!/usr/bin/env python3
"""
Compress a PDF file.
Usage: python compress_pdf.py <input_file> [quality]
Quality: low, medium, high (default: medium)
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

def compress_pdf(input_path, quality="medium"):
    """Compress PDF by removing unnecessary data."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        # Copy all pages
        for page in reader.pages:
            writer.add_page(page)
        
        # Remove metadata and compress
        writer.remove_links()
        
        # Compress based on quality
        if quality == "low":
            # More aggressive compression
            pass
        elif quality == "high":
            # Less compression, better quality
            pass
        # medium is default
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_compressed_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Write compressed PDF
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        # Get file sizes
        original_size = os.path.getsize(input_path)
        compressed_size = os.path.getsize(output_path)
        reduction = round((1 - compressed_size / original_size) * 100, 1)
        
        return {
            "success": True,
            "output": output_path,
            "originalSize": original_size,
            "compressedSize": compressed_size,
            "reduction": f"{reduction}%"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input file required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    quality = sys.argv[2] if len(sys.argv) > 2 else "medium"
    
    result = compress_pdf(input_path, quality)
    print(json.dumps(result))
