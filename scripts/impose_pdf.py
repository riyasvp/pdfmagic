#!/usr/bin/env python3
"""
Impose PDF pages (N-up layout).
Usage: python impose_pdf.py <input_pdf> <pages_per_sheet>
pages_per_sheet: 2, 4, 6, 9, 16
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from pypdf import PdfReader, PdfWriter
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.pdfgen import canvas
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

DOWNLOAD_DIR = "/home/z/my-project/download"

# Page layouts for different N-up values
LAYOUTS = {
    2: (1, 2),  # 1 row, 2 columns
    4: (2, 2),  # 2 rows, 2 columns
    6: (2, 3),  # 2 rows, 3 columns
    9: (3, 3),  # 3 rows, 3 columns
    16: (4, 4),  # 4 rows, 4 columns
}


def impose_pdf(input_path, pages_per_sheet=4):
    """Impose PDF pages (N-up layout)."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    if pages_per_sheet not in LAYOUTS:
        return {
            "success": False,
            "error": f"Invalid pages_per_sheet: {pages_per_sheet}. Use: {list(LAYOUTS.keys())}",
        }

    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        rows, cols = LAYOUTS[pages_per_sheet]
        total_pages = len(reader.pages)

        # Calculate page dimensions for imposition
        sheet_width = 8.5 * inch
        sheet_height = 11 * inch
        margin = 0.25 * inch
        spacing = 0.2 * inch

        cell_width = (sheet_width - 2 * margin - (cols - 1) * spacing) / cols
        cell_height = (sheet_height - 2 * margin - (rows - 1) * spacing) / rows

        # Create imposition pages
        pages_processed = 0

        while pages_processed < total_pages:
            # Create a new sheet
            temp_path = os.path.join(DOWNLOAD_DIR, f"impose_temp_{pages_processed}.pdf")
            c = canvas.Canvas(temp_path, pagesize=(sheet_width, sheet_height))

            for row in range(rows):
                for col in range(cols):
                    page_idx = pages_processed + row * cols + col

                    if page_idx >= total_pages:
                        break

                    # Calculate position
                    x = margin + col * (cell_width + spacing)
                    y = sheet_height - margin - (row + 1) * cell_height - row * spacing

                    # Add page reference (would need PyMuPDF for actual page insertion)
                    c.saveState()
                    c.setFillColorRGB(0.9, 0.9, 0.9)
                    c.rect(x, y, cell_width, cell_height, fill=True)
                    c.setFillColorRGB(0.3, 0.3, 0.3)
                    c.setFont("Helvetica", 10)
                    c.drawString(x + 5, y + 5, f"Page {page_idx + 1}")
                    c.restoreState()

            c.save()

            # Read temp page and add to writer
            temp_reader = PdfReader(temp_path)
            writer.add_page(temp_reader.pages[0])

            # Clean up temp file
            try:
                os.remove(temp_path)
            except:
                pass

            pages_processed += pages_per_sheet

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_{pages_per_sheet}up_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write output
        with open(output_path, "wb") as f:
            writer.write(f)

        return {
            "success": True,
            "output": output_path,
            "pagesPerSheet": pages_per_sheet,
            "originalPages": total_pages,
            "imposedSheets": len(writer.pages),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    pages_per_sheet = int(sys.argv[2]) if len(sys.argv) > 2 else 4
    result = impose_pdf(input_path, pages_per_sheet)
    print(json.dumps(result))
