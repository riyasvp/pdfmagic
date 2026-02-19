#!/usr/bin/env python3
"""
Organize PDF pages - reorder, rotate, delete.
Usage: python organize_pdf.py <input_pdf> <action>
       action: JSON string with operations
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

def organize_pdf(input_path, operations):
    """
    Organize PDF pages based on operations.
    operations: {
        "order": [1, 3, 2, 4],  # New page order (1-indexed)
        "rotate": {1: 90, 3: 180},  # Page rotations in degrees
        "delete": [5, 6]  # Pages to delete (1-indexed)
    }
    """
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    try:
        reader = PdfReader(input_path)
        total_pages = len(reader.pages)
        writer = PdfWriter()
        
        # Parse operations
        order = operations.get("order", list(range(1, total_pages + 1)))
        rotations = operations.get("rotate", {})
        delete_pages = set(operations.get("delete", []))
        
        # Filter out deleted pages from order
        order = [p for p in order if p not in delete_pages]
        
        # Process pages in new order
        processed_pages = set()
        
        for page_num in order:
            if page_num < 1 or page_num > total_pages:
                continue
            if page_num in processed_pages:
                continue
            
            page = reader.pages[page_num - 1]
            
            # Apply rotation if specified
            if str(page_num) in rotations or page_num in rotations:
                rotation = rotations.get(str(page_num), rotations.get(page_num, 0))
                page.rotate(rotation)
            
            writer.add_page(page)
            processed_pages.add(page_num)
        
        if len(writer.pages) == 0:
            return {"success": False, "error": "No pages remaining after operations"}
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"organized_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        # Write output
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        return {
            "success": True,
            "output": output_path,
            "original_pages": total_pages,
            "new_pages": len(writer.pages)
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Input PDF and operations JSON required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    try:
        operations = json.loads(sys.argv[2])
    except json.JSONDecodeError:
        print(json.dumps({"success": False, "error": "Invalid operations JSON"}))
        sys.exit(1)
    
    result = organize_pdf(input_path, operations)
    print(json.dumps(result))
