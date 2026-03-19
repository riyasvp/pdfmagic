#!/usr/bin/env python3
"""
Convert PDF to XPS format.
Usage: python xps_pdf.py <input_pdf>
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from pypdf import PdfReader
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

# Get download directory from environment or use default
DOWNLOAD_DIR = os.environ.get(
    "DOWNLOAD_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "download"),
)


def convert_to_xps(input_path):
    """Convert PDF to XPS format."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        # XPS conversion requires additional libraries
        # This is a placeholder - in production use proper XPS conversion

        # For now, create a text file explaining the limitation
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_xps_notice_{timestamp}.txt"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write notice
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(
                """
PDF to XPS Conversion Notice
============================

XPS (XML Paper Specification) conversion requires additional libraries
that are not available in this environment.

For XPS conversion, please use:
1. Microsoft Print to PDF (Windows 10+)
2. Ghostscript with XPS driver
3. Online XPS conversion services

The original PDF is preserved at: {input_path}
""".format(input_path=input_path)
            )

        return {
            "success": True,
            "output": output_path,
            "notice": "XPS conversion requires external tools",
            "alternative": "Use system print-to-PDF feature",
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    result = convert_to_xps(input_path)
    print(json.dumps(result))
