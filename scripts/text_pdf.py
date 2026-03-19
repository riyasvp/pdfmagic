#!/usr/bin/env python3
"""
Convert PDF to plain text.
Usage: python text_pdf.py <input_pdf>
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    import pdfplumber
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

DOWNLOAD_DIR = "/home/z/my-project/download"


def extract_text_from_pdf(pdf_path):
    """Extract plain text from PDF."""
    text_content = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if text:
                text_content.append(f"=== Page {page_num} ===\n{text}")

    return "\n\n".join(text_content)


def convert_pdf_to_text(input_path):
    """Convert PDF to plain text."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        text = extract_text_from_pdf(input_path)

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_{timestamp}.txt"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write text file
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)

        return {"success": True, "output": output_path}

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    result = convert_pdf_to_text(input_path)
    print(json.dumps(result))
