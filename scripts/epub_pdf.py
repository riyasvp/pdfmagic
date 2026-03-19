#!/usr/bin/env python3
"""
Convert PDF to EPUB format.
Usage: python epub_pdf.py <input_pdf>
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

# Get download directory from environment or use default
DOWNLOAD_DIR = os.environ.get(
    "DOWNLOAD_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "download"),
)


def convert_to_epub(input_path):
    """Convert PDF to EPUB format."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        # EPUB is a complex format - create a simplified version
        # Full EPUB would require additional libraries like epubwrite

        # Extract text content
        content = []
        with pdfplumber.open(input_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text:
                    content.append(f"== Page {page_num} ==\n{text}\n")

        full_content = "\n".join(content)

        # Create EPUB-like output (simplified)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_epub_content_{timestamp}.txt"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write content
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"Title: {base_name}\n")
            f.write(f"Author: Unknown\n\n")
            f.write(full_content)

        return {
            "success": True,
            "output": output_path,
            "notice": "Full EPUB conversion requires additional processing",
            "pagesProcessed": len(content),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    result = convert_to_epub(input_path)
    print(json.dumps(result))
