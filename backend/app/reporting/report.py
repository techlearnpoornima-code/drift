from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from app.reporting.heatmap import NodeVulnerability, compute_node_vulnerability
from app.reporting.metrics import (
    classify_failure_modes,
    compute_attack_effectiveness,
    compute_dual_trajectory,
    compute_recovery_count,
    compute_trajectory_metrics,
    generate_hardening_recommendations,
)
from app.simulation.state import RoundResult


class RobustnessReport(BaseModel):
    sim_id: str
    target_model: str
    seed_graph_id: str
    total_rounds: int
    termination_reason: str
    final_drift_stage: str
    fc_flags: list[str] = Field(default_factory=list)
    campaign_strategies: list[str] = Field(default_factory=list)

    # Trajectory-derived metrics (replace EHL)
    frame_drift_point: Optional[int] = None       # first round accommodating sustained 2+ consecutive
    assimilation_point: Optional[int] = None       # first round assimilating
    factual_collapse_point: Optional[int] = None   # first round captured
    recovery_count: int = 0                        # times model moved to more resistant stage

    # Dual-metric trajectory: one entry per round
    dual_trajectory: list[dict] = Field(default_factory=list)

    # Attribution: fraction of contradictions per attack code
    attack_effectiveness: dict[str, float] = Field(default_factory=dict)

    # Taxonomy auto-tags
    failure_modes: list[str] = Field(default_factory=list)

    # Actionable hardening suggestions
    hardening_recommendations: list[str] = Field(default_factory=list)

    # Per-ontology-node vulnerability scores
    node_vulnerability: list[NodeVulnerability] = Field(default_factory=list)


def build_report(
    sim_id: str,
    events: list[RoundResult],
    target_model: str,
    seed_graph_id: str,
    termination_reason: str,
    campaign_strategies: list[str],
    fc_flags: list[str],
) -> RobustnessReport:
    if not events:
        return RobustnessReport(
            sim_id=sim_id,
            target_model=target_model,
            seed_graph_id=seed_graph_id,
            total_rounds=0,
            termination_reason=termination_reason,
            final_drift_stage="stable",
            fc_flags=fc_flags,
            campaign_strategies=campaign_strategies,
        )

    dual = compute_dual_trajectory(events)
    effectiveness = compute_attack_effectiveness(events)
    failure_modes = classify_failure_modes(termination_reason, fc_flags, effectiveness)
    hardening = generate_hardening_recommendations(failure_modes)
    node_vuln = compute_node_vulnerability(events)
    recovery = compute_recovery_count(events)
    trajectory_metrics = compute_trajectory_metrics(events)

    return RobustnessReport(
        sim_id=sim_id,
        target_model=target_model,
        seed_graph_id=seed_graph_id,
        total_rounds=len(events),
        termination_reason=termination_reason,
        final_drift_stage=events[-1].drift_stage.value,
        fc_flags=fc_flags,
        campaign_strategies=campaign_strategies,
        frame_drift_point=trajectory_metrics["frame_drift_point"],
        assimilation_point=trajectory_metrics["assimilation_point"],
        factual_collapse_point=trajectory_metrics["factual_collapse_point"],
        recovery_count=recovery,
        dual_trajectory=dual,
        attack_effectiveness=effectiveness,
        failure_modes=failure_modes,
        hardening_recommendations=hardening,
        node_vulnerability=node_vuln,
    )
