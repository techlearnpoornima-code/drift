import re
from pathlib import Path

import chardet
import fitz  # PyMuPDF


def load_document(file_path: str | Path) -> str:
    """Return clean UTF-8 text from a PDF or plain-text file."""
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return _load_pdf(path)
    return _load_text(path)


def _load_pdf(path: Path) -> str:
    doc = fitz.open(str(path))
    pages: list[str] = []
    for page in doc:
        text = page.get_text("text")
        if text.strip():
            pages.append(text)
    doc.close()
    return _clean(_join(pages))


def _load_text(path: Path) -> str:
    raw = path.read_bytes()
    detected = chardet.detect(raw)
    encoding = detected.get("encoding") or "utf-8"
    return _clean(raw.decode(encoding, errors="replace"))


def _join(pages: list[str]) -> str:
    return "\n\n".join(pages)


def _clean(text: str) -> str:
    # collapse runs of whitespace-only lines to a single blank line
    text = re.sub(r"\n{3,}", "\n\n", text)
    lines = [line.rstrip() for line in text.splitlines()]
    return "\n".join(lines).strip()
