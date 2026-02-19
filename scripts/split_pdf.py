#!/usr/bin/env python3
"""
Split a PDF file into multiple files.
Usage: python split_pdf.py <input_file> <mode> [params...]
Modes: all, ranges, extract, every, count
Output: JSON with result
"""

import sys
import os
import json
import re
from datetime import datetime

try:
    from pypdf import PdfWriter, PdfReader
except ImportError:
    from PyPDF2 import PdfWriter, PdfReader

DOWNLOAD_DIR = "/home/z/my-project/download"

def parse_page_ranges(range_str, total_pages):
    """Parse page range string like '1-3, 5-7, 10' into list of page numbers."""
    pages = []
    parts = range_str.split(',')
    
    for part in parts:
        part = part.strip()
        if '-' in part:
            # Range like "1-3"
            try:
                start, end = part.split('-')
                start = int(start.strip())
                end = int(end.strip())
                for p in range(start, end + 1):
                    if 1 <= p <= total_pages:
                        pages.append(p)
            except ValueError:
                continue
        else:
            # Single page like "5"
            try:
                p = int(part)
                if 1 <= p <= total_pages:
                    pages.append(p)
            except ValueError:
                continue
    
    return sorted(set(pages))

def parse_page_numbers(num_str, total_pages):
    """Parse page numbers like '1, 3, 5, 7' into list."""
    pages = []
    parts = num_str.split(',')
    
    for part in parts:
        part = part.strip()
        try:
            p = int(part)
            if 1 <= p <= total_pages:
                pages.append(p)
        except ValueError:
            continue
    
    return sorted(set(pages))

def split_pdf(input_path, mode="all", params=None):
    """Split PDF into pages or by specified mode."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}
    
    if params is None:
        params = {}
    
    try:
        reader = PdfReader(input_path)
        total_pages = len(reader.pages)
        
        if total_pages == 0:
            return {"success": False, "error": "PDF has no pages"}
        
        # Ensure download directory exists
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        
        output_files = []
        
        if mode == "all":
            # Extract each page as separate PDF
            for i in range(total_pages):
                writer = PdfWriter()
                writer.add_page(reader.pages[i])
                
                output_filename = f"{base_name}_page_{i+1}_{timestamp}.pdf"
                output_path = os.path.join(DOWNLOAD_DIR, output_filename)
                
                with open(output_path, "wb") as output_file:
                    writer.write(output_file)
                
                output_files.append(output_path)
        
        elif mode == "ranges":
            # Split by page ranges
            range_str = params.get("pageRanges", "")
            if not range_str:
                return {"success": False, "error": "No page ranges specified"}
            
            pages = parse_page_ranges(range_str, total_pages)
            if not pages:
                return {"success": False, "error": "Invalid page ranges"}
            
            for i, page_num in enumerate(pages):
                writer = PdfWriter()
                writer.add_page(reader.pages[page_num - 1])  # 0-indexed
                
                output_filename = f"{base_name}_page_{page_num}_{timestamp}.pdf"
                output_path = os.path.join(DOWNLOAD_DIR, output_filename)
                
                with open(output_path, "wb") as output_file:
                    writer.write(output_file)
                
                output_files.append(output_path)
        
        elif mode == "extract":
            # Extract specific pages into single PDF
            num_str = params.get("pageNumbers", "")
            if not num_str:
                return {"success": False, "error": "No page numbers specified"}
            
            pages = parse_page_numbers(num_str, total_pages)
            if not pages:
                return {"success": False, "error": "Invalid page numbers"}
            
            writer = PdfWriter()
            for page_num in pages:
                writer.add_page(reader.pages[page_num - 1])  # 0-indexed
            
            output_filename = f"{base_name}_extracted_{timestamp}.pdf"
            output_path = os.path.join(DOWNLOAD_DIR, output_filename)
            
            with open(output_path, "wb") as output_file:
                writer.write(output_file)
            
            output_files.append(output_path)
        
        elif mode == "every":
            # Split every X pages
            try:
                every = int(params.get("everyPages", "1"))
                if every < 1:
                    every = 1
            except ValueError:
                every = 1
            
            part_num = 1
            for start in range(0, total_pages, every):
                end = min(start + every, total_pages)
                
                writer = PdfWriter()
                for i in range(start, end):
                    writer.add_page(reader.pages[i])
                
                output_filename = f"{base_name}_part_{part_num}_{timestamp}.pdf"
                output_path = os.path.join(DOWNLOAD_DIR, output_filename)
                
                with open(output_path, "wb") as output_file:
                    writer.write(output_file)
                
                output_files.append(output_path)
                part_num += 1
        
        elif mode == "count":
            # Split into X equal files
            try:
                count = int(params.get("fileCount", "2"))
                if count < 2:
                    count = 2
                if count > total_pages:
                    count = total_pages
            except ValueError:
                count = 2
            
            pages_per_file = total_pages // count
            extra = total_pages % count
            
            start = 0
            for part_num in range(1, count + 1):
                # Distribute extra pages among first files
                end = start + pages_per_file + (1 if part_num <= extra else 0)
                
                writer = PdfWriter()
                for i in range(start, end):
                    writer.add_page(reader.pages[i])
                
                output_filename = f"{base_name}_part_{part_num}_{timestamp}.pdf"
                output_path = os.path.join(DOWNLOAD_DIR, output_filename)
                
                with open(output_path, "wb") as output_file:
                    writer.write(output_file)
                
                output_files.append(output_path)
                start = end
        
        else:
            # Default: extract all pages
            return split_pdf(input_path, "all", params)
        
        # Create a zip file if multiple files
        if len(output_files) > 1:
            import zipfile
            zip_filename = f"{base_name}_split_{timestamp}.zip"
            zip_path = os.path.join(DOWNLOAD_DIR, zip_filename)
            
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for file_path in output_files:
                    zipf.write(file_path, os.path.basename(file_path))
                    os.remove(file_path)  # Clean up individual files
            
            return {"success": True, "output": zip_path, "files_count": len(output_files)}
        else:
            return {"success": True, "output": output_files[0] if output_files else "", "files_count": 1}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input file required"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else "all"
    
    # Parse additional params from command line
    params = {}
    for i in range(3, len(sys.argv)):
        arg = sys.argv[i]
        if '=' in arg:
            key, value = arg.split('=', 1)
            params[key] = value
    
    result = split_pdf(input_path, mode, params)
    print(json.dumps(result))
