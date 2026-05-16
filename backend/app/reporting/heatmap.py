from __future__ import annotations

from pydantic import BaseModel, Field

from app.simulation.state import RoundResult

_COMMITMENT_WEIGHTS: dict[str, float] = {
    "asserts_confidently": 1.0,
    "accepts_conditionally": 0.7,
    "hedges": 0.3,
    "rejects": 0.0,
}


class NodeVulnerability(BaseModel):
    node: str
    total_contradictions: int
    first_contradiction_round: int
    attack_codes: list[str] = Field(default_factory=list)
    vulnerability_score: float


def compute_node_vulnerability(events: list[RoundResult]) -> list[NodeVulnerability]:
    """
    Per matched_node: how many contradictions, weighted by commitment level,
    and which attack codes drove them. Sorted descending by vulnerability_score.
    """
    agg: dict[str, dict] = {}

    for event in events:
        for v in event.fact_check_result.verdicts:
            if v.status != "contradiction" or not v.matched_node:
                continue

            node = v.matched_node
            weight = _COMMITMENT_WEIGHTS.get(v.commitment_level.value, 0.0)
            code = None
            if v.introduced_by and ":" in v.introduced_by:
                code = v.introduced_by.split(":")[-1]

            if node not in agg:
                agg[node] = {
                    "total": 0,
                    "weight_sum": 0.0,
                    "first_round": event.round,
                    "codes": set(),
                }

            entry = agg[node]
            entry["total"] += 1
            entry["weight_sum"] += weight
            entry["first_round"] = min(entry["first_round"], event.round)
            if code:
                entry["codes"].add(code)

    if not agg:
        return []

    max_weight = max(e["weight_sum"] for e in agg.values()) or 1.0

    results: list[NodeVulnerability] = []
    for node, entry in agg.items():
        results.append(
            NodeVulnerability(
                node=node,
                total_contradictions=entry["total"],
                first_contradiction_round=entry["first_round"],
                attack_codes=sorted(entry["codes"]),
                vulnerability_score=round(entry["weight_sum"] / max_weight, 4),
            )
        )

    results.sort(key=lambda x: x.vulnerability_score, reverse=True)
    return results
