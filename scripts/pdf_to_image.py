#!/usr/bin/env python3
"""
Convert PDF to images.
Usage: python pdf_to_image.py <input_pdf> [format]
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from pdf2image import convert_from_path
    from PIL import Image
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

DOWNLOAD_DIR = "/home/z/my-project/download"

def convert_pdf_to_images(input_path, output_format="png"):
    """Convert PDF pages to images."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    try:
        # Convert PDF to images
        images = convert_from_path(input_path, dpi=200)
        
        if not images:
            return {"success": False, "error": "No pages found in PDF"}
        
        # Generate output folder
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_folder = os.path.join(DOWNLOAD_DIR, f"pdf_images_{timestamp}")
        os.makedirs(output_folder, exist_ok=True)
        
        output_files = []
        
        # Save each page as image
        for i, image in enumerate(images):
            output_filename = f"page_{i+1:03d}.{output_format}"
            output_path = os.path.join(output_folder, output_filename)
            image.save(output_path, output_format.upper())
            output_files.append(output_path)
        
        # If single page, return the single file
        if len(output_files) == 1:
            return {"success": True, "output": output_files[0]}
        
        # Create a zip file for multiple pages
        import zipfile
        zip_filename = f"pdf_images_{timestamp}.zip"
        zip_path = os.path.join(DOWNLOAD_DIR, zip_filename)
        
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for file_path in output_files:
                zipf.write(file_path, os.path.basename(file_path))
        
        return {"success": True, "output": zip_path}
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_format = sys.argv[2] if len(sys.argv) > 2 else "png"
    result = convert_pdf_to_images(input_path, output_format)
    print(json.dumps(result))
