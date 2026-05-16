from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.events import event_store
from app.reporting.report import build_report

compare_bp = Blueprint("compare", __name__, url_prefix="/api/compare")


@compare_bp.get("")
def compare_simulations() -> tuple:
    """
    GET /api/compare?sim_ids=run-a,run-b,run-c

    Returns side-by-side EHL, failure modes, dual trajectory, and attack
    effectiveness for each requested simulation ID.
    """
    raw = request.args.get("sim_ids", "")
    sim_ids = [s.strip() for s in raw.split(",") if s.strip()]
    if not sim_ids:
        return jsonify({"error": "sim_ids query parameter is required"}), 400

    comparison: dict = {
        "sim_ids": sim_ids,
        "models": {},
        "trajectory_metrics": {},
        "final_drift_stage": {},
        "termination_reason": {},
        "failure_modes": {},
        "attack_effectiveness": {},
        "trajectories": {},
        "reports": {},
    }

    for sim_id in sim_ids:
        events = event_store.get_all(sim_id)
        result = event_store.get_result(sim_id)

        if not events:
            comparison["models"][sim_id] = None
            comparison["trajectory_metrics"][sim_id] = None
            comparison["final_drift_stage"][sim_id] = None
            comparison["termination_reason"][sim_id] = "not_found"
            comparison["failure_modes"][sim_id] = []
            comparison["attack_effectiveness"][sim_id] = {}
            comparison["trajectories"][sim_id] = []
            continue

        report = build_report(
            sim_id=sim_id,
            events=events,
            target_model=result.target_model if result else "",
            seed_graph_id=result.seed_graph_id if result else "",
            termination_reason=result.termination_reason if result else "running",
            campaign_strategies=result.campaign_strategies if result else [],
            fc_flags=result.fc_flags if result else [],
        )

        comparison["models"][sim_id] = report.target_model
        comparison["trajectory_metrics"][sim_id] = {
            "frame_drift_point": report.frame_drift_point,
            "assimilation_point": report.assimilation_point,
            "factual_collapse_point": report.factual_collapse_point,
            "recovery_count": report.recovery_count,
        }
        comparison["final_drift_stage"][sim_id] = report.final_drift_stage
        comparison["termination_reason"][sim_id] = report.termination_reason
        comparison["failure_modes"][sim_id] = report.failure_modes
        comparison["attack_effectiveness"][sim_id] = report.attack_effectiveness
        comparison["trajectories"][sim_id] = report.dual_trajectory
        comparison["reports"][sim_id] = report.model_dump()

    return jsonify(comparison), 200
