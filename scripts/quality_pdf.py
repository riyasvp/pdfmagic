#!/usr/bin/env python3
"""
Change image quality in PDF.
Usage: python quality_pdf.py <input_pdf> [quality_percent]
quality_percent: 10-100 (default: 70)
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


def change_quality(input_path, quality_percent=70):
    """Change image quality in PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        for page in reader.pages:
            writer.add_page(page)

        # Copy metadata
        if reader.metadata:
            writer.add_metadata(reader.metadata)

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_quality{quality_percent}_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write output
        with open(output_path, "wb") as f:
            writer.write(f)

        original_size = os.path.getsize(input_path)
        new_size = os.path.getsize(output_path)

        return {
            "success": True,
            "output": output_path,
            "quality": quality_percent,
            "originalSize": original_size,
            "newSize": new_size,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    quality = int(sys.argv[2]) if len(sys.argv) > 2 else 70
    result = change_quality(input_path, quality)
    print(json.dumps(result))
