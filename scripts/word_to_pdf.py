#!/usr/bin/env python3
"""
Windows‑friendly Word → PDF converter.
- Primary: Microsoft Word COM (requires Office)
- Fallback: LibreOffice (`unoconv` or `soffice`) if Word is not available
Usage: python word_to_pdf.py <input_docx>
Outputs a JSON payload with `success`, `output` (PDF path) or `error`.
"""

import sys, os, json, datetime, subprocess, traceback
from pathlib import Path


# Get download directory from environment or use default
def _get_download_dir():
    return Path(
        os.environ.get(
            "DOWNLOAD_DIR",
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "download"),
        )
    )


# ----------------------------------------------------------------------
# Helper: produce a timestamped output filename inside the ./download folder
# ----------------------------------------------------------------------
def _output_path():
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    out_name = f"word_to_pdf_{ts}.pdf"
    return _get_download_dir() / out_name


# ----------------------------------------------------------------------
# Primary conversion – Microsoft Word COM
# ----------------------------------------------------------------------
def _convert_using_com(input_path: str) -> str:
    try:
        import win32com.client  # pywin32
    except Exception as e:
        raise RuntimeError("pywin32 is not installed or failed to load.") from e

    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    try:
        doc = word.Documents.Open(str(Path(input_path).absolute()))
        out_path = _output_path()
        # 17 = wdFormatPDF
        doc.SaveAs(str(out_path), FileFormat=17)
        doc.Close()
        return str(out_path)
    finally:
        word.Quit()


# ----------------------------------------------------------------------
# Fallback conversion – LibreOffice (`unoconv` or `soffice`)
# ----------------------------------------------------------------------
def _convert_using_libreoffice(input_path: str) -> str:
    out_dir = _get_download_dir()
    out_dir.mkdir(parents=True, exist_ok=True)

    # Try unoconv first
    try:
        subprocess.run(
            ["unoconv", "-f", "pdf", "-o", str(out_dir), str(input_path)],
            check=True,
            capture_output=True,
            timeout=120,
        )
        return str(out_dir / (Path(input_path).stem + ".pdf"))
    except Exception:
        # Direct LibreOffice call as fallback
        subprocess.run(
            [
                "soffice",
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                str(out_dir),
                str(input_path),
            ],
            check=True,
            capture_output=True,
            timeout=120,
        )
        return str(out_dir / (Path(input_path).stem + ".pdf"))


# ----------------------------------------------------------------------
# Orchestrator – decides which engine to use
# ----------------------------------------------------------------------
def word_to_pdf(input_path: str):
    if not Path(input_path).exists():
        return {"success": False, "error": f"File not found: {input_path}"}
    try:
        pdf_path = _convert_using_com(input_path)
    except Exception as com_err:
        try:
            pdf_path = _convert_using_libreoffice(input_path)
        except Exception as lo_err:
            return {
                "success": False,
                "error": "Both conversion methods failed",
                "details": {
                    "com_error": str(com_err),
                    "libreoffice_error": str(lo_err),
                    "trace": traceback.format_exc(),
                },
            }
    return {"success": True, "output": pdf_path}


# ----------------------------------------------------------------------
# CLI entry‑point (used by the API route)
# ----------------------------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input Word file required"}))
        sys.exit(1)
    result = word_to_pdf(sys.argv[1])
    print(json.dumps(result))
