#!/usr/bin/env python3
"""
Add page borders to PDF.
Usage: python border_pdf.py <input_pdf> <border_width> <border_color> <margin>
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from pypdf import PdfReader, PdfWriter
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import inch
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

DOWNLOAD_DIR = "/home/z/my-project/download"


def add_border_to_pdf(input_path, border_width=10, border_color="#000000", margin=20):
    """Add border/frame to PDF pages."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        # Parse border color
        if border_color.startswith("#"):
            r = int(border_color[1:3], 16) / 255
            g = int(border_color[3:5], 16) / 255
            b = int(border_color[5:7], 16) / 255
            border_color_rgb = (r, g, b)
        else:
            border_color_rgb = (0, 0, 0)

        for page_num, page in enumerate(reader.pages):
            # Get page dimensions
            media_box = page.mediabox
            page_width = float(media_box.width)
            page_height = float(media_box.height)

            # Create border page
            border_path = os.path.join(DOWNLOAD_DIR, f"border_temp_{page_num}.pdf")
            c = canvas.Canvas(border_path, pagesize=(page_width, page_height))

            # Draw border
            c.setStrokeColorRGB(*border_color_rgb)
            c.setLineWidth(border_width)
            c.rect(margin, margin, page_width - 2 * margin, page_height - 2 * margin)
            c.save()

            # Merge border with page
            border_reader = PdfReader(border_path)
            page.merge_page(border_reader.pages[0])
            writer.add_page(page)

            # Clean up temp file
            try:
                os.remove(border_path)
            except:
                pass

        # Copy metadata
        if reader.metadata:
            writer.add_metadata(reader.metadata)

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_bordered_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write output
        with open(output_path, "wb") as f:
            writer.write(f)

        return {
            "success": True,
            "output": output_path,
            "pagesProcessed": len(reader.pages),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    border_width = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    border_color = sys.argv[3] if len(sys.argv) > 3 else "#000000"
    margin = int(sys.argv[4]) if len(sys.argv) > 4 else 20

    result = add_border_to_pdf(input_path, border_width, border_color, margin)
    print(json.dumps(result))
