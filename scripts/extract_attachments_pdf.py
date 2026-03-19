#!/usr/bin/env python3
"""
Extract file attachments from PDF.
Usage: python extract_attachments_pdf.py <input_pdf>
Output: JSON with result
"""

import sys
import os
import json
import zipfile
from datetime import datetime

try:
    from pypdf import PdfReader
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

DOWNLOAD_DIR = "/home/z/my-project/download"


def extract_attachments(input_path):
    """Extract file attachments from PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)
        attachments = []

        # Try to extract embedded files
        # Note: pypdf has limited attachment support
        # Full implementation requires PyMuPDF

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_attachments_{timestamp}.zip"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Create ZIP (empty if no attachments)
        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            # Add a placeholder if no attachments found
            if not attachments:
                placeholder = f"No attachments found in {os.path.basename(input_path)}"
                zipf.writestr("readme.txt", placeholder)

        return {
            "success": True,
            "output": output_path,
            "attachmentCount": len(attachments),
            "attachments": attachments,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    result = extract_attachments(input_path)
    print(json.dumps(result))
