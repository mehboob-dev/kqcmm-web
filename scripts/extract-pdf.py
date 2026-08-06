#!/usr/bin/env python3
"""
Extract paragraph text from a PDF into JSON lines.

Reads a PDF path from argv[1], extracts text per page, splits into blocks,
and prints a JSON array of paragraphs to stdout. Used by scripts/import-books.mjs.

Usage:
  python scripts/extract-pdf.py <path-to.pdf>
"""
import sys
import json

try:
    import fitz  # PyMuPDF
except ImportError as e:
    sys.stderr.write(f"PyMuPDF not installed: {e}\n")
    sys.exit(1)


def extract(path):
    doc = fitz.open(path)
    paras = []
    for page in doc:
        # 'blocks' gives text blocks (paragraph-ish); join their lines.
        for block in page.get_text("blocks"):
            txt = block[4].strip()
            if txt:
                # Normalize internal whitespace; keep real line breaks as
                # single spaces since PDF lines wrap mid-sentence.
                paras.append(" ".join(txt.split()))
    return paras


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write("usage: extract-pdf.py <path-to.pdf>\n")
        sys.exit(1)
    out = extract(sys.argv[1])
    # Write as UTF-8 to stdout — Windows console default (cp1252) cannot encode
    # arbitrary unicode from the PDFs (e.g. curly quotes, em-dashes).
    sys.stdout.buffer.write(json.dumps(out, ensure_ascii=False).encode("utf-8"))
