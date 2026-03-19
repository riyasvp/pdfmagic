#!/usr/bin/env python3
"""
Extract hyperlinks from PDF.
Usage: python extract_links_pdf.py <input_pdf>
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

DOWNLOAD_DIR = "/home/z/my-project/download"


def extract_links(input_path):
    """Extract hyperlinks from PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        links = []

        with pdfplumber.open(input_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                page_links = page.links or []

                for link in page_links:
                    if "uri" in link:
                        links.append(
                            {
                                "url": link["uri"],
                                "page": page_num,
                                "text": link.get("text", ""),
                            }
                        )

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_filename = f"{base_name}_links_{timestamp}.txt"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)

        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Write links to file
        with open(output_path, "w", encoding="utf-8") as f:
            for link in links:
                f.write(f"Page {link['page']}: {link['url']}\n")

        # Also create JSON output
        json_path = output_path.replace(".txt", ".json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(links, f, indent=2)

        return {
            "success": True,
            "output": output_path,
            "jsonOutput": json_path,
            "linkCount": len(links),
            "links": links[:50],  # Return first 50 in response
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    result = extract_links(input_path)
    print(json.dumps(result))
