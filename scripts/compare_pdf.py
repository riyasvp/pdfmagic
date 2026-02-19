#!/usr/bin/env python3
"""
Compare two PDF documents and highlight differences.
Usage: python compare_pdf.py <pdf1> <pdf2>
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    import pdfplumber
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

DOWNLOAD_DIR = "/home/z/my-project/download"

def extract_text_by_page(pdf_path):
    """Extract text from each page of PDF."""
    pages_text = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            pages_text.append(text)
    return pages_text

def compare_pdfs(pdf1_path, pdf2_path):
    """Compare two PDFs and generate a comparison report."""
    if not os.path.exists(pdf1_path):
        return {"success": False, "error": f"File not found: {pdf1_path}"}
    if not os.path.exists(pdf2_path):
        return {"success": False, "error": f"File not found: {pdf2_path}"}
    
    try:
        # Extract text from both PDFs
        text1 = extract_text_by_page(pdf1_path)
        text2 = extract_text_by_page(pdf2_path)
        
        # Generate comparison report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"comparison_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        doc = SimpleDocTemplate(output_path, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30
        )
        story.append(Paragraph("PDF Comparison Report", title_style))
        story.append(Spacer(1, 20))
        
        # Summary
        story.append(Paragraph("<b>Summary</b>", styles['Heading2']))
        summary_data = [
            ["File 1", os.path.basename(pdf1_path)],
            ["Pages", str(len(text1))],
            ["File 2", os.path.basename(pdf2_path)],
            ["Pages", str(len(text2))],
        ]
        
        summary_table = Table(summary_data, colWidths=[100, 300])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#8B5CF6')),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 30))
        
        # Page-by-page comparison
        story.append(Paragraph("<b>Page-by-Page Differences</b>", styles['Heading2']))
        
        max_pages = max(len(text1), len(text2))
        
        for i in range(max_pages):
            page_num = i + 1
            story.append(Spacer(1, 15))
            story.append(Paragraph(f"<b>Page {page_num}</b>", styles['Heading3']))
            
            text1_page = text1[i] if i < len(text1) else "[Page does not exist]"
            text2_page = text2[i] if i < len(text2) else "[Page does not exist]"
            
            # Compare word count
            words1 = len(text1_page.split())
            words2 = len(text2_page.split())
            
            if text1_page == text2_page:
                story.append(Paragraph(f"<font color='green'>✓ Identical content ({words1} words)</font>", styles['Normal']))
            else:
                story.append(Paragraph(f"<font color='red'>✗ Different content</font>", styles['Normal']))
                story.append(Paragraph(f"File 1: {words1} words | File 2: {words2} words", styles['Normal']))
                
                # Show character difference
                diff = abs(len(text1_page) - len(text2_page))
                story.append(Paragraph(f"Character difference: {diff}", styles['Normal']))
        
        doc.build(story)
        
        # Calculate differences
        identical_pages = sum(1 for a, b in zip(text1, text2) if a == b)
        total_compared = min(len(text1), len(text2))
        
        return {
            "success": True,
            "output": output_path,
            "file1_pages": len(text1),
            "file2_pages": len(text2),
            "identical_pages": identical_pages,
            "total_compared": total_compared
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Two PDF files required for comparison"}))
        sys.exit(1)
    
    pdf1_path = sys.argv[1]
    pdf2_path = sys.argv[2]
    result = compare_pdfs(pdf1_path, pdf2_path)
    print(json.dumps(result))
