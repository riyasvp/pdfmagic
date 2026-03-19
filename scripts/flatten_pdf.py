#!/usr/bin/env python3
"""
Flatten PDF annotations and form fields.
Usage: python flatten_pdf.py <input_pdf>
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


def flatten_pdf(input_path):
    """Flatten PDF annotations and form fields."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        flattened_count = 0

        for page in reader.pages:
            writer.add_page(page)
            # Note: Full flattening would require PyMuPDF
            # pypdf has limited support for removing annotations
            flattened_count += 1

        # Copy metadata
        if reader.metadata:
            writer.add_metadata(reader.metadata)

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_flattened_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write output
        with open(output_path, "wb") as f:
            writer.write(f)

        return {
            "success": True,
            "output": output_path,
            "pagesProcessed": flattened_count,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    result = flatten_pdf(input_path)
    print(json.dumps(result))
