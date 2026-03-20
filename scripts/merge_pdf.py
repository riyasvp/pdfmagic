#!/usr/bin/env python3
"""
Merge multiple PDF files into one.
Usage: python merge_pdf.py <input_file1> <input_file2> ... [input_fileN]
Output: JSON with result
"""

import sys
import os
import json
import signal
from datetime import datetime

# Cross-platform PDF library import
try:
    from pypdf import PdfWriter, PdfReader
except ImportError:
    try:
        from PyPDF2 import PdfWriter, PdfReader
    except ImportError:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": "No PDF library available. Install pypdf or PyPDF2.",
                }
            )
        )
        sys.exit(1)


# Timeout handler
def timeout_handler(signum, frame):
    print(json.dumps({"success": False, "error": "Operation timed out"}))
    sys.exit(1)


# Set timeout for long operations
if hasattr(signal, "SIGALRM"):
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(120)  # 2 minute timeout

# Get download directory from environment or use default
DOWNLOAD_DIR = os.environ.get(
    "DOWNLOAD_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "download"),
)


def merge_pdfs(input_paths):
    """Merge multiple PDF files into one."""
    writer = PdfWriter()

    for path in input_paths:
        if not os.path.exists(path):
            return {"success": False, "error": f"File not found: {path}"}

        try:
            reader = PdfReader(path)
            # Add each page to the writer
            for page in reader.pages:
                writer.add_page(page)
        except Exception as e:
            return {"success": False, "error": f"Failed to read {path}: {str(e)}"}

    # Generate output filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"merged_{timestamp}.pdf"
    output_path = os.path.join(DOWNLOAD_DIR, output_filename)

    # Ensure download directory exists
    try:
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    except OSError as e:
        return {
            "success": False,
            "error": f"Failed to create output directory: {str(e)}",
        }

    # Write merged PDF
    try:
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
    except Exception as e:
        return {"success": False, "error": f"Failed to write output file: {str(e)}"}

    return {"success": True, "output": output_path}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            json.dumps({"success": False, "error": "At least one input file required"})
        )
        sys.exit(1)

    input_paths = sys.argv[1:]
    result = merge_pdfs(input_paths)
    print(json.dumps(result))
