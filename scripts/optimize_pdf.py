#!/usr/bin/env python3
"""
Optimize PDF for web viewing (linearization).
Usage: python optimize_pdf.py <input_pdf> [quality]
quality: low, medium, high (default: medium)
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

# Get download directory from environment or use default
DOWNLOAD_DIR = os.environ.get(
    "DOWNLOAD_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "download"),
)


def optimize_pdf(input_path, quality="medium"):
    """Optimize PDF for web viewing."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        # Set up optimization options based on quality
        if quality == "low":
            writer.compress_content_streams = True
        elif quality == "high":
            writer.compress_content_streams = True
        else:  # medium
            writer.compress_content_streams = True

        # Add pages
        for page in reader.pages:
            writer.add_page(page)

        # Copy metadata
        if reader.metadata:
            writer.add_metadata(reader.metadata)

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_optimized_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write output
        with open(output_path, "wb") as f:
            writer.write(f)

        # Get file sizes
        original_size = os.path.getsize(input_path)
        optimized_size = os.path.getsize(output_path)
        reduction = (
            ((original_size - optimized_size) / original_size) * 100
            if original_size > 0
            else 0
        )

        return {
            "success": True,
            "output": output_path,
            "originalSize": original_size,
            "optimizedSize": optimized_size,
            "reduction": reduction,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    quality = sys.argv[2] if len(sys.argv) > 2 else "medium"
    result = optimize_pdf(input_path, quality)
    print(json.dumps(result))
