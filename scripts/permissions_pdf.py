#!/usr/bin/env python3
"""
Set granular permissions on PDF.
Usage: python permissions_pdf.py <input_pdf> <password> <can_print> <can_copy> <can_edit>
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

# Get download directory from environment or default
DOWNLOAD_DIR = os.environ.get(
    "DOWNLOAD_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "download"),
)


def set_permissions(input_path, password="", can_print=True, can_copy=True, can_edit=False):
    """Set granular permissions on PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        # Add all pages
        for page in reader.pages:
            writer.add_page(page)

        # Set permissions
        # pypdf permission bits:
        # 1 = print
        # 2 = modify
        # 4 = copy
        # 8 = annotations
        # 16 = forms
        # 32 = extract
        # 64 = assemble
        # 128 = print quality

        permissions = 0
        if can_print:
            permissions |= 1   # Print
            permissions |= 128 # High quality print
        if can_copy:
            permissions |= 4   # Copy
            permissions |= 32  # Extract text/graphics
        if can_edit:
            permissions |= 2   # Modify
            permissions |= 8   # Annotations
            permissions |= 16  # Forms
            permissions |= 64  # Assemble

        # Encrypt with permissions
        if password:
            writer.encrypt(
                user_password=password,
                owner_password=password if password else None,
                permissions_flag=permissions
            )
        else:
            # If no password, just set permissions (if supported)
            writer.add_metadata({
                "/Permissions": str(permissions)
            })

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_permissions_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write output
        with open(output_path, "wb") as f:
            writer.write(f)

        return {
            "success": True,
            "output": output_path,
            "permissions": {
                "canPrint": can_print,
                "canCopy": can_copy,
                "canEdit": can_edit,
            }
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    password = sys.argv[2] if len(sys.argv) > 2 else ""
    can_print = sys.argv[3].lower() != "false" if len(sys.argv) > 3 else True
    can_copy = sys.argv[4].lower() != "false" if len(sys.argv) > 4 else True
    can_edit = sys.argv[5].lower() == "true" if len(sys.argv) > 5 else False

    result = set_permissions(input_path, password, can_print, can_copy, can_edit)
    print(json.dumps(result))
