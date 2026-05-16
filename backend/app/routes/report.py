from __future__ import annotations

from flask import Blueprint, jsonify

from app.events import event_store
from app.reporting.report import build_report

report_bp = Blueprint("report", __name__, url_prefix="/api/report")


@report_bp.get("/<sim_id>")
def get_report(sim_id: str) -> tuple:
    events = event_store.get_all(sim_id)
    if not events:
        return jsonify({"error": "simulation not found or not yet started"}), 404

    result = event_store.get_result(sim_id)

    report = build_report(
        sim_id=sim_id,
        events=events,
        target_model=result.target_model if result else "",
        seed_graph_id=result.seed_graph_id if result else "",
        termination_reason=result.termination_reason if result else "running",
        campaign_strategies=result.campaign_strategies if result else [],
        fc_flags=result.fc_flags if result else [],
    )

    return jsonify(report.model_dump()), 200
