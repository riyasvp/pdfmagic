#!/usr/bin/env python3
"""
Repair corrupted PDF files.
Usage: python repair_pdf.py <input_pdf>
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


def repair_pdf(input_path):
    """Attempt to repair a corrupted PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        repaired_issues = []

        # Try to read each page
        for i, page in enumerate(reader.pages):
            try:
                writer.add_page(page)
            except Exception as e:
                repaired_issues.append(f"Page {i + 1}: {str(e)}")

        # Copy metadata if available
        if reader.metadata:
            writer.add_metadata(
                {
                    "/Title": reader.metadata.get("/Title", ""),
                    "/Author": reader.metadata.get("/Author", ""),
                    "/Subject": reader.metadata.get("/Subject", ""),
                    "/Keywords": reader.metadata.get("/Keywords", ""),
                }
            )

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_repaired_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write output
        with open(output_path, "wb") as f:
            writer.write(f)

        return {
            "success": True,
            "output": output_path,
            "pagesRecovered": len(writer.pages),
            "issuesRepaired": repaired_issues,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    result = repair_pdf(input_path)
    print(json.dumps(result))
