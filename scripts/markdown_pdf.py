#!/usr/bin/env python3
"""
Convert PDF to Markdown format.
Usage: python markdown_pdf.py <input_pdf>
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


def extract_markdown_from_pdf(pdf_path):
    """Extract text from PDF and convert to Markdown."""
    markdown_content = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if text:
                # Convert text to basic markdown
                lines = text.split("\n")
                for line in lines:
                    stripped = line.strip()
                    if stripped:
                        # Detect headers (all caps or short lines)
                        if len(stripped) < 100 and (
                            stripped.isupper()
                            or (
                                len(lines) > 0
                                and stripped[0].isupper()
                                and len(stripped.split()) < 10
                            )
                        ):
                            markdown_content.append(f"## {stripped}")
                        else:
                            markdown_content.append(stripped)

                markdown_content.append(f"\n--- Page {page_num} ---\n")

    return "\n\n".join(markdown_content)


def convert_pdf_to_markdown(input_path):
    """Convert PDF to Markdown."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        markdown = extract_markdown_from_pdf(input_path)

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_{timestamp}.md"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write markdown file
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(markdown)

        return {"success": True, "output": output_path}

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    result = convert_pdf_to_markdown(input_path)
    print(json.dumps(result))
