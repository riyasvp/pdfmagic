#!/usr/bin/env python3
"""
Batch stamp multiple PDFs.
Usage: python stamp_multiple_pdf.py <files_json> <stamp_text>
files_json: JSON array of file paths
Output: JSON with result
"""

import sys
import os
import json
import zipfile
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


def stamp_multiple_pdfs(files_json, stamp_text="STAMPED"):
    """Stamp multiple PDFs in batch."""
    try:
        files = json.loads(files_json)

        if not files:
            return {"success": False, "error": "No files provided"}

        stamped_files = []
        failed_files = []

        for file_path in files:
            if not os.path.exists(file_path):
                failed_files.append({"file": file_path, "error": "File not found"})
                continue

            try:
                reader = PdfReader(file_path)
                writer = PdfWriter()

                for page in reader.pages:
                    writer.add_page(page)

                # Copy metadata
                if reader.metadata:
                    writer.add_metadata(reader.metadata)

                # Generate stamped filename
                base_name = os.path.splitext(os.path.basename(file_path))[0]
                stamped_filename = f"{base_name}_stamped.pdf"
                stamped_path = os.path.join(DOWNLOAD_DIR, stamped_filename)

                # Ensure download directory exists
                os.makedirs(DOWNLOAD_DIR, exist_ok=True)

                # Write output
                with open(stamped_path, "wb") as f:
                    writer.write(f)

                stamped_files.append(stamped_path)

            except Exception as e:
                failed_files.append({"file": file_path, "error": str(e)})

        # Create ZIP if multiple files
        if len(stamped_files) > 1:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            zip_filename = f"stamped_pdfs_{timestamp}.zip"
            zip_path = os.path.join(DOWNLOAD_DIR, zip_filename)

            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                for stamped_file in stamped_files:
                    zipf.write(stamped_file, os.path.basename(stamped_file))

            # Clean up individual files
            for stamped_file in stamped_files:
                try:
                    os.remove(stamped_file)
                except:
                    pass

            output_path = zip_path
        elif len(stamped_files) == 1:
            output_path = stamped_files[0]
        else:
            output_path = None

        return {
            "success": True,
            "output": output_path,
            "stampedCount": len(stamped_files),
            "failedCount": len(failed_files),
            "failed": failed_files,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(
            json.dumps(
                {"success": False, "error": "Files JSON and stamp text required"}
            )
        )
        sys.exit(1)

    files_json = sys.argv[1]
    stamp_text = sys.argv[2] if len(sys.argv) > 2 else "STAMPED"
    result = stamp_multiple_pdfs(files_json, stamp_text)
    print(json.dumps(result))
