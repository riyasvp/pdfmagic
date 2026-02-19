#!/usr/bin/env python3
"""
Convert HTML to PDF.
Usage: python html_to_pdf.py <input_html>
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from weasyprint import HTML, CSS
except ImportError:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        import html.parser
    except ImportError as e:
        print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
        sys.exit(1)

DOWNLOAD_DIR = "/home/z/my-project/download"

def html_to_pdf(input_path):
    """Convert HTML file to PDF."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    try:
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"html_to_pdf_{timestamp}.pdf"
        output_path = os.path.join(DOWNLOAD_DIR, output_filename)
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        # Try using WeasyPrint for better HTML rendering
        try:
            html = HTML(filename=input_path)
            html.write_pdf(output_path)
        except:
            # Fallback to basic HTML to text conversion with reportlab
            from reportlab.lib.pagesizes import A4
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet
            from html.parser import HTMLParser
            
            class HTMLTextExtractor(HTMLParser):
                def __init__(self):
                    super().__init__()
                    self.text = []
                    self.skip = False
                
                def handle_starttag(self, tag, attrs):
                    if tag in ['script', 'style']:
                        self.skip = True
                
                def handle_endtag(self, tag):
                    if tag in ['script', 'style']:
                        self.skip = False
                    if tag in ['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                        self.text.append('\n')
                
                def handle_data(self, data):
                    if not self.skip:
                        self.text.append(data)
            
            # Read HTML file
            with open(input_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            # Extract text
            parser = HTMLTextExtractor()
            parser.feed(html_content)
            text = ''.join(parser.text)
            
            # Create PDF
            doc = SimpleDocTemplate(output_path, pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            
            for line in text.split('\n'):
                line = line.strip()
                if line:
                    story.append(Paragraph(line, styles['Normal']))
                    story.append(Spacer(1, 6))
            
            doc.build(story)
        
        return {"success": True, "output": output_path}
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input HTML file required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    result = html_to_pdf(input_path)
    print(json.dumps(result))
