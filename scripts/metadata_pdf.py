#!/usr/bin/env python3
"""
Read and write PDF metadata.
Usage: python metadata_pdf.py <input_pdf> [title] [author] [subject] [keywords]
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

# Get download directory from environment or use default
DOWNLOAD_DIR = os.environ.get(
    "DOWNLOAD_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "download"),
)


def read_metadata(input_path):
    """Read PDF metadata."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)
        metadata = {}

        if reader.metadata:
            metadata = {
                "title": reader.metadata.get("/Title", ""),
                "author": reader.metadata.get("/Author", ""),
                "subject": reader.metadata.get("/Subject", ""),
                "keywords": reader.metadata.get("/Keywords", ""),
                "creator": reader.metadata.get("/Creator", ""),
                "producer": reader.metadata.get("/Producer", ""),
                "creationDate": str(reader.metadata.get("/CreationDate", "")),
                "modificationDate": str(reader.metadata.get("/ModDate", "")),
            }

        return {"success": True, "metadata": metadata}

    except Exception as e:
        return {"success": False, "error": str(e)}


def write_metadata(input_path, title="", author="", subject="", keywords=""):
    """Write PDF metadata."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        for page in reader.pages:
            writer.add_page(page)

        # Add metadata
        writer.add_metadata(
            {
                "/Title": title,
                "/Author": author,
                "/Subject": subject,
                "/Keywords": keywords,
                "/Creator": "PDFMagic",
                "/Producer": "PDFMagic",
            }
        )

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_metadata_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write output
        with open(output_path, "wb") as f:
            writer.write(f)

        return {"success": True, "output": output_path}

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]

    if len(sys.argv) == 2:
        # Read metadata only
        result = read_metadata(input_path)
    else:
        # Write metadata
        title = sys.argv[2] if len(sys.argv) > 2 else ""
        author = sys.argv[3] if len(sys.argv) > 3 else ""
        subject = sys.argv[4] if len(sys.argv) > 4 else ""
        keywords = sys.argv[5] if len(sys.argv) > 5 else ""
        result = write_metadata(input_path, title, author, subject, keywords)

    print(json.dumps(result))
