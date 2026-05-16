from __future__ import annotations

import threading

from flask import Blueprint, jsonify, request

from app.config import Config
from app.events import event_store
from app.logs.logger import DriftLogger
from app.simulation.runner import run_simulation
from app.simulation.state import CampaignConfig, SimulationState

simulation_bp = Blueprint("simulation", __name__, url_prefix="/api/sim")


@simulation_bp.post("/run")
def start_simulation() -> tuple:
    body = request.get_json(silent=True) or {}

    sim_id = body.get("sim_id")
    seed_graph_id = body.get("seed_graph_id")
    if not sim_id or not seed_graph_id:
        return jsonify({"error": "sim_id and seed_graph_id are required"}), 400

    cfg = Config()
    max_rounds = int(body.get("max_rounds", cfg.DEFAULT_MAX_ROUNDS))
    target_model = body.get("target_model", cfg.LLM_MODEL_NAME)

    campaign_data = body.get("campaign", {})
    campaign = CampaignConfig(
        strategies=campaign_data.get("strategies", []),
        mode=campaign_data.get("mode", "fixed"),
        escalation_rounds={
            int(k): v
            for k, v in campaign_data.get("escalation_rounds", {}).items()
        },
    )

    state = SimulationState(
        sim_id=sim_id,
        seed_graph_id=seed_graph_id,
        max_rounds=max_rounds,
        target_model=target_model,
        campaign=campaign,
    )

    DriftLogger(cfg).log_simulation_start(sim_id, target_model)

    threading.Thread(
        target=run_simulation,
        args=(state, cfg),
        daemon=True,
        name=f"drift-sim-{sim_id}",
    ).start()

    return jsonify({"sim_id": sim_id, "status": "running"}), 202


@simulation_bp.get("/<sim_id>/events")
def get_events(sim_id: str) -> tuple:
    after_round = int(request.args.get("after_round", 0))
    events = event_store.get_since(sim_id, after_round)
    return jsonify([e.model_dump() for e in events]), 200


@simulation_bp.get("/<sim_id>/status")
def get_status(sim_id: str) -> tuple:
    result = event_store.get_result(sim_id)
    events = event_store.get_all(sim_id)

    if not events:
        return jsonify({"sim_id": sim_id, "status": "pending", "round": 0}), 200

    latest = events[-1]
    return jsonify({
        "sim_id": sim_id,
        "status": "terminated" if result is not None else "running",
        "round": latest.round,
        "drift_stage": latest.drift_stage.value,
        "fidelity_score": latest.fact_check_result.fidelity_score,
        "termination_reason": result.termination_reason if result else "",
    }), 200
