#!/usr/bin/env python3
"""
Unlock PDF with brute force (common passwords).
FOR EDUCATIONAL PURPOSES ONLY.
Usage: python unlock_brute_pdf.py <input_pdf>
Output: JSON with result
"""

import sys
import os
import json
from datetime import datetime

try:
    from pypdf import PdfReader
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Missing dependency: {str(e)}"}))
    sys.exit(1)

# Get download directory from environment or use default
DOWNLOAD_DIR = os.environ.get(
    "DOWNLOAD_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "download"),
)

# Common passwords to try
COMMON_PASSWORDS = [
    "",
    "password",
    "123456",
    "12345678",
    "1234",
    "qwerty",
    "12345",
    "letmein",
    "welcome",
    "monkey",
    "abc123",
    "password1",
    "admin",
    "user",
    "test",
    "guest",
    "master",
    "login",
    "pass",
    "passw0rd",
    "changeme",
    "secret",
    "123",
    "123456789",
    "1234567",
    "dragon",
    "baseball",
    "football",
    "iloveyou",
    "trustno1",
    "sunshine",
]


def unlock_pdf_brute(input_path):
    """Try to unlock PDF with common passwords."""
    if not os.path.exists(input_path):
        return {"success": False, "error": f"File not found: {input_path}"}

    try:
        reader = PdfReader(input_path)

        if not reader.is_encrypted:
            return {
                "success": True,
                "unlocked": True,
                "message": "PDF is not encrypted",
                "password": None,
            }

        # Try each password
        for password in COMMON_PASSWORDS:
            try:
                if reader.decrypt(password):
                    return {
                        "success": True,
                        "unlocked": True,
                        "password": password,
                        "passwordsTried": len(COMMON_PASSWORDS),
                    }
            except Exception:
                continue

        return {
            "success": False,
            "unlocked": False,
            "error": "Could not unlock with common passwords",
            "passwordsTried": len(COMMON_PASSWORDS),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Input PDF file required"}))
        sys.exit(1)

    input_path = sys.argv[1]
    print(json.dumps({"warning": "This tool is for educational purposes only"}))
    result = unlock_pdf_brute(input_path)
    print(json.dumps(result))
