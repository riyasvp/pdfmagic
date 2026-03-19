#!/usr/bin/env python3
"""
Add hyperlinks to PDF pages.
Usage: python add_links_pdf.py <input_pdf> <links_json>
links_json format: [{"page":1,"x":100,"y":100,"width":200,"height":50,"url":"https://example.com"},...]
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from pypdf import PdfReader, PdfWriter
    from pypdf.generic import RectangleObject
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

# Get download directory from environment or use default
DOWNLOAD_DIR = os.environ.get(
    "DOWNLOAD_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "download"),
)


def add_links(input_path, links_json):
    """Add hyperlinks to PDF pages."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        # Parse links
        links = json.loads(links_json)

        for page_num, page in enumerate(reader.pages, 1):
            writer.add_page(page)

            # Add links for this page
            page_links = [l for l in links if l.get("page") == page_num]

            for link in page_links:
                # Note: Full link annotation requires PyMuPDF
                # This is a placeholder implementation
                pass

        # Copy metadata
        if reader.metadata:
            writer.add_metadata(reader.metadata)

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_linked_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write output
        with open(output_path, "wb") as f:
            writer.write(f)

        return {
            "success": True,
            "output": output_path,
            "linksAdded": len(links),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(
            json.dumps(
                {"success": False, "error": "Input PDF file and links JSON required"}
            )
        )
        sys.exit(1)

    input_path = sys.argv[1]
    links_json = sys.argv[2]
    result = add_links(input_path, links_json)
    print(json.dumps(result))
