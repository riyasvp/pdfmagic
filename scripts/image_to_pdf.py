#!/usr/bin/env python3
"""
Convert images to PDF.
Usage: python image_to_pdf.py <image1> [image2] ...
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from PIL import Image
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Image as RLImage, PageBreak
    from reportlab.lib.units import inch
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

DOWNLOAD_DIR = "/home/z/my-project/download"

def convert_images_to_pdf(input_paths):
    """Convert multiple images to a single PDF."""
    if not input_paths:
        return {"success": False, "error": "No input files provided"}
    
    try:
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"images_to_pdf_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        # Create PDF
        doc = SimpleDocTemplate(output_path, pagesize=A4)
        story = []
        
        for img_path in input_paths:
            if not os.path.exists(img_path):
                continue
            
            try:
                # Open image to get dimensions
                with Image.open(img_path) as img:
                    img_width, img_height = img.size
                
                # Calculate scaling to fit page
                page_width = A4[0] - 2 * inch
                page_height = A4[1] - 2 * inch
                
                # Scale image proportionally
                scale_w = page_width / img_width
                scale_h = page_height / img_height
                scale = min(scale_w, scale_h, 1)  # Don't upscale
                
                final_width = img_width * scale
                final_height = img_height * scale
                
                # Add image to PDF
                rl_img = RLImage(img_path, width=final_width, height=final_height)
                story.append(rl_img)
                story.append(PageBreak())
            
            except Exception as e:
                print(f"Warning: Failed to process {img_path}: {e}", file=sys.stderr)
                continue
        
        # Remove last page break
        if story and story[-1] == PageBreak():
            story.pop()
        
        if not story:
            return {"success": False, "error": "No valid images to convert"}
        
        doc.build(story)
        
        return {"success": True, "output": output_path}
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "At least one image file required"}))
        sys.exit(1)
    
    input_paths = sys.argv[1:]
    result = convert_images_to_pdf(input_paths)
    print(json.dumps(result))
