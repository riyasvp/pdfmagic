#!/usr/bin/env python3
"""
Extract specific pages from PDF.
Usage: python extract_pages_pdf.py <input_pdf> <pages_json>
pages_json format: "1,3,5-7" or "[1,3,5,6,7]"
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from pypdf import PdfReader, PdfWriter
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

DOWNLOAD_DIR = "/home/z/my-project/download"


def parse_page_string(page_str):
    """Parse page string like '1,3,5-7' into list of page numbers."""
    pages = []
    parts = page_str.replace("[", "").replace("]", "").split(",")
    for part in parts:
        part = part.strip()
        if "-" in part:
            start, end = part.split("-")
            pages.extend(range(int(start.strip()), int(end.strip()) + 1))
        elif part.isdigit():
            pages.append(int(part))
    return sorted(set(pages))


def extract_pages(input_path, page_string):
    """Extract specific pages from PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        total_pages = len(reader.pages)
        pages_to_extract = parse_page_string(page_string)

        # Validate page numbers
        valid_pages = [p for p in pages_to_extract if 1 <= p <= total_pages]

        if not valid_pages:
            return {"success": False, "error": "No valid pages specified"}

        # Add pages to writer
        for page_num in valid_pages:
            writer.add_page(reader.pages[page_num - 1])  # 0-indexed

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_extracted_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write output
        with open(output_path, "wb") as f:
            writer.write(f)

        return {
            "success": True,
            "output": output_path,
            "pagesExtracted": len(valid_pages),
            "totalPages": total_pages,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(
            json.dumps({"success": False, "error": "Input PDF file and pages required"})
        )
        sys.exit(1)

    input_path = sys.argv[1]
    page_string = sys.argv[2]
    result = extract_pages(input_path, page_string)
    print(json.dumps(result))
