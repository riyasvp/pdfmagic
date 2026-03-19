#!/usr/bin/env python3
"""
Crop PDF pages.
Usage: python crop_pdf.py <input_pdf> [margins]
       margins: Can be either:
         - "left,bottom,right,top" (e.g., "10,10,10,10")
         - OR individual args: left bottom right top
       Values are margins to subtract from each side in points (1 inch = 72 points)
       OR cropbox format: "left,bottom,right,top" as absolute coordinates
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime
from typing import Union, List, Tuple

try:
    from pypdf import PdfWriter, PdfReader
    from pypdf.generic import RectangleObject
except ImportError:
    from PyPDF2 import PdfWriter, PdfReader

    RectangleObject = None

# Get download directory from environment or use default
DOWNLOAD_DIR = os.environ.get(
    "DOWNLOAD_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "download"),
)


def parse_margins(args: list) -> Tuple[float, float, float, float]:
    """Parse margins from command line arguments."""
    if len(args) == 1:
        # Single argument could be "left,bottom,right,top"
        parts = args[0].split(",")
        if len(parts) == 4:
            return tuple(float(p) for p in parts)
        else:
            return (0, 0, 0, 0)
    elif len(args) >= 4:
        return (float(args[0]), float(args[1]), float(args[2]), float(args[3]))
    else:
        return (0, 0, 0, 0)


def crop_pdf(input_path, left=0, bottom=0, right=0, top=0):
    """Crop PDF pages with specified margins."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        for page in reader.pages:
            # Get original page dimensions
            orig_left = float(page.mediabox.left)
            orig_bottom = float(page.mediabox.bottom)
            orig_right = float(page.mediabox.right)
            orig_top = float(page.mediabox.top)

            # Check if values look like absolute coordinates (large numbers)
            # vs margins (smaller numbers)
            max_page_size = max(orig_right - orig_left, orig_top - orig_bottom)

            # If values are larger than half the page size, treat as absolute coords
            if abs(left) > max_page_size / 2:
                # Absolute coordinates mode
                new_left = left
                new_bottom = bottom
                new_right = right
                new_top = top
            else:
                # Margins mode - subtract from edges
                new_left = orig_left + left
                new_bottom = orig_bottom + bottom
                new_right = orig_right - right
                new_top = orig_top - top

            # Ensure valid crop box
            if new_right <= new_left or new_top <= new_bottom:
                return {"success": False, "error": "Invalid crop dimensions"}

            # Apply crop using proper pypdf API
            if RectangleObject is not None:
                page.cropbox = RectangleObject(
                    [new_left, new_bottom, new_right, new_top]
                )
            else:
                # Fallback for PyPDF2
                page.cropbox.lower_left = [new_left, new_bottom]
                page.cropbox.upper_right = [new_right, new_top]

            writer.add_page(page)

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"cropped_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write output
        with open(output_path, "wb") as output_file:
            writer.write(output_file)

        return {
            "success": True,
            "output": output_path,
            "pages_cropped": len(reader.pages),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]

    # Parse margins from remaining arguments
    if len(sys.argv) > 2:
        margin_args = sys.argv[2:]
        # Check if it's a comma-separated string
        if len(margin_args) == 1 and "," in margin_args[0]:
            parts = margin_args[0].split(",")
            left, bottom, right, top = (
                float(parts[0]),
                float(parts[1]),
                float(parts[2]),
                float(parts[3]),
            )
        else:
            left = float(margin_args[0]) if len(margin_args) > 0 else 0
            bottom = float(margin_args[1]) if len(margin_args) > 1 else 0
            right = float(margin_args[2]) if len(margin_args) > 2 else 0
            top = float(margin_args[3]) if len(margin_args) > 3 else 0
    else:
        left, bottom, right, top = 0, 0, 0, 0

    result = crop_pdf(input_path, left, bottom, right, top)
    print(json.dumps(result))
