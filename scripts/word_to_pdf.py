#!/usr/bin/env python3
"""
Convert Word document to PDF.
Usage: python word_to_pdf.py <input_docx>
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from docx import Document
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

DOWNLOAD_DIR = "/home/z/my-project/download"

def word_to_pdf(input_path):
    """Convert Word document to PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    try:
        # Load Word document
        doc = Document(input_path)
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"word_to_pdf_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        # Create PDF document
        pdf_doc = SimpleDocTemplate(output_path, pagesize=A4)
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=20
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12
        )
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=11,
            leading=16,
            alignment=TA_JUSTIFY
        )
        
        story = []
        
        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                story.append(Spacer(1, 8))
                continue
            
            # Determine style based on paragraph style
            style_name = para.style.name.lower()
            
            if 'title' in style_name or 'heading 1' in style_name:
                story.append(Paragraph(text, title_style))
            elif 'heading' in style_name:
                story.append(Paragraph(text, heading_style))
            else:
                story.append(Paragraph(text, body_style))
        
        pdf_doc.build(story)
        
        return {"success": True, "output": output_path}
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input Word file required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    result = word_to_pdf(input_path)
    print(json.dumps(result))
