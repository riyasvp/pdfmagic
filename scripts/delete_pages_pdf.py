#!/usr/bin/env python3
"""
Add/delete pages from PDF.
Usage: python delete_pages_pdf.py <input_pdf> <pages_to_delete>
       pages_to_delete: comma-separated page numbers (e.g., "1,3,5-7")
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

def parse_page_ranges(range_str, total_pages):
    """Parse page range string into set of page numbers (1-indexed)."""
    pages_to_delete = set()
    
    for part in range_str.split(','):
        part = part.strip()
        if '-' in part:
            start, end = part.split('-')
            start = int(start.strip())
            end = int(end.strip())
            pages_to_delete.update(range(start, min(end + 1, total_pages + 1)))
        else:
            page = int(part)
            if 1 <= page <= total_pages:
                pages_to_delete.add(page)
    
    return pages_to_delete

def delete_pages(input_path, pages_to_delete_str):
    """Delete specified pages from PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    try:
        reader = PdfReader(input_path)
        total_pages = len(reader.pages)
        
        # Parse page ranges
        pages_to_delete = parse_page_ranges(pages_to_delete_str, total_pages)
        
        if not pages_to_delete:
            return {"success": False, "error": "No valid pages specified for deletion"}
        
        if len(pages_to_delete) >= total_pages:
            return {"success": False, "error": "Cannot delete all pages"}
        
        # Create new PDF without deleted pages
        writer = PdfWriter()
        
        for i in range(total_pages):
            if (i + 1) not in pages_to_delete:
                writer.add_page(reader.pages[i])
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"pages_deleted_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        # Write output
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        deleted_count = len(pages_to_delete)
        return {
            "success": True,
            "output": output_path,
            "message": f"Deleted {deleted_count} page(s). New PDF has {total_pages - deleted_count} page(s)."
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Input PDF and pages to delete required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    pages_to_delete = sys.argv[2]
    result = delete_pages(input_path, pages_to_delete)
    print(json.dumps(result))
