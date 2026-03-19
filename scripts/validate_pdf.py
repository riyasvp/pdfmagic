#!/usr/bin/env python3
"""
Validate PDF/A compliance.
Usage: python validate_pdf.py <input_pdf>
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

# Get download directory from environment or use default
DOWNLOAD_DIR = os.environ.get(
    "DOWNLOAD_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "download"),
)

try:
    from pypdf import PdfReader
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)


def validate_pdf(input_path):
    """Validate PDF and check for PDF/A compliance."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)

        # Basic validation
        validation = {
            "isValid": True,
            "pageCount": len(reader.pages),
            "isPdfA": False,
            "issues": [],
            "warnings": [],
            "metadata": {},
        }

        # Check PDF version
        if hasattr(reader, "pdf_header"):
            validation["pdfVersion"] = str(reader.pdf_header)

        # Check metadata
        if reader.metadata:
            validation["metadata"] = {
                "hasTitle": bool(reader.metadata.get("/Title")),
                "hasAuthor": bool(reader.metadata.get("/Author")),
                "hasSubject": bool(reader.metadata.get("/Subject")),
                "hasKeywords": bool(reader.metadata.get("/Keywords")),
            }

        # Check for PDF/A markers (basic check)
        try:
            with open(input_path, "rb") as f:
                content = f.read()
                if b"/Type /Catalog" in content and b"/Metadata" in content:
                    validation["isPdfA"] = True
        except:
            pass

        # Check for encryption
        if reader.is_encrypted:
            validation["isEncrypted"] = True
            validation["warnings"].append(
                "PDF is encrypted - limited validation possible"
            )

        # Check for form fields
        if reader.get_form_text_fields():
            validation["hasFormFields"] = True

        # Validate each page
        for i, page in enumerate(reader.pages):
            if not page.get("/MediaBox"):
                validation["issues"].append(f"Page {i + 1}: Missing MediaBox")

        # Overall validity
        if validation["issues"]:
            validation["isValid"] = False

        return {"success": True, "validation": validation}

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    result = validate_pdf(input_path)
    print(json.dumps(result))
