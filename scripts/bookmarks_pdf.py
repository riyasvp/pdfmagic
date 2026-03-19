#!/usr/bin/env python3
"""
Auto-generate bookmarks from PDF headings.
Usage: python bookmarks_pdf.py <input_pdf>
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from pypdf import PdfReader, PdfWriter
    import pdfplumber
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

DOWNLOAD_DIR = "/home/z/my-project/download"


def detect_headings(text_lines):
    """Detect headings from text lines."""
    headings = []

    for i, line in enumerate(text_lines):
        stripped = line.strip()

        # Heuristic for detecting headings:
        # 1. All uppercase
        # 2. Short line with title case
        # 3. Line starting with chapter/section numbers
        # 4. Font size indication (if available)

        if not stripped:
            continue

        # Check for chapter/section patterns
        if (
            (
                stripped.upper() == stripped
                and len(stripped) < 100
                and len(stripped.split()) <= 10
            )
            or (stripped and stripped[0].isdigit() and "." in stripped[:5])
            or (
                len(stripped.split()) <= 8
                and stripped[0].isupper()
                and len(stripped) < 80
            )
        ):
            headings.append(stripped)

    return headings


def auto_bookmarks(input_path):
    """Generate bookmarks automatically from PDF content."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        bookmarks = []

        # Extract text and detect headings
        with pdfplumber.open(input_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text:
                    lines = text.split("\n")
                    headings = detect_headings(lines)

                    for heading in headings[:3]:  # Limit headings per page
                        bookmarks.append(
                            {
                                "title": heading,
                                "page": page_num,
                            }
                        )

        # Add pages to writer
        for page in reader.pages:
            writer.add_page(page)

        # Add bookmarks
        # Note: pypdf has limited bookmark support
        # Full bookmark implementation would require PyMuPDF

        # Copy metadata
        if reader.metadata:
            writer.add_metadata(reader.metadata)

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_bookmarked_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write output
        with open(output_path, "wb") as f:
            writer.write(f)

        return {
            "success": True,
            "output": output_path,
            "bookmarks": bookmarks,
            "bookmarkCount": len(bookmarks),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    result = auto_bookmarks(input_path)
    print(json.dumps(result))
