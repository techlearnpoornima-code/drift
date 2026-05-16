from __future__ import annotations

import asyncio
import uuid
from pathlib import Path

from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename

from app.config import Config
from app.db import list_seeds, store_seed_meta, store_seed_text
from app.ingestion.bootstrap import bootstrap_seed_graph
from app.ingestion.loader import load_document

ingestion_bp = Blueprint("ingestion", __name__, url_prefix="/api/seed")

_ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}


def _allowed(filename: str) -> bool:
    return Path(filename).suffix.lower() in _ALLOWED_EXTENSIONS


@ingestion_bp.post("/upload")
def upload_seed() -> tuple:
    if "file" not in request.files:
        return jsonify({"error": "no file in request"}), 400

    f = request.files["file"]
    if not f.filename or not _allowed(f.filename):
        return jsonify({"error": "unsupported file type"}), 400

    cfg = Config()
    sim_id = str(uuid.uuid4())
    upload_dir = Path(cfg.UPLOAD_FOLDER) / sim_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = secure_filename(f.filename)
    file_path = upload_dir / filename
    f.save(str(file_path))

    text = load_document(file_path)
    if not text.strip():
        return jsonify({"error": "document contained no extractable text"}), 422

    seed_graph_id = asyncio.run(bootstrap_seed_graph(sim_id, text, cfg))
    store_seed_text(seed_graph_id, text)
    store_seed_meta(seed_graph_id, filename)

    return jsonify({"sim_id": sim_id, "seed_graph_id": seed_graph_id, "filename": filename}), 201


@ingestion_bp.get("/seeds")
def get_seeds() -> tuple:
    return jsonify(list_seeds()), 200
