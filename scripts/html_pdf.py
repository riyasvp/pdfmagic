#!/usr/bin/env python3
"""
Convert PDF to HTML format.
Usage: python html_pdf.py <input_pdf>
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    import pdfplumber
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

# Get download directory from environment or use default
DOWNLOAD_DIR = os.environ.get(
    "DOWNLOAD_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "download"),
)


def extract_html_from_pdf(pdf_path):
    """Convert PDF to HTML."""
    html_parts = []

    html_parts.append("""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Converted Document</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3 { color: #1a1a1a; margin-top: 1.5em; }
        h1 { border-bottom: 2px solid #4a90d9; padding-bottom: 0.5em; }
        h2 { border-bottom: 1px solid #ddd; padding-bottom: 0.3em; }
        .page { 
            border: 1px solid #ddd; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px;
            background: #fafafa;
        }
        .page-number {
            color: #888;
            font-size: 0.9em;
            text-align: right;
            margin-top: 20px;
        }
        pre {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <h1>Converted PDF Document</h1>
""")

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if text:
                # Escape HTML special characters
                escaped_text = (
                    text.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace('"', "&quot;")
                )

                # Convert newlines to <br>
                html_paragraphs = "<br>".join(escaped_text.split("\n"))

                html_parts.append(f"""
    <div class="page">
        <h2>Page {page_num}</h2>
        <div class="content">{html_paragraphs}</div>
        <div class="page-number">Page {page_num}</div>
    </div>
""")

    html_parts.append("""
</body>
</html>
""")

    return "".join(html_parts)


def convert_pdf_to_html(input_path):
    """Convert PDF to HTML."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        html = extract_html_from_pdf(input_path)

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_{timestamp}.html"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write HTML file
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html)

        return {"success": True, "output": output_path}

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    result = convert_pdf_to_html(input_path)
    print(json.dumps(result))
