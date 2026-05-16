from __future__ import annotations

from pydantic import BaseModel, Field

from app.db import RoundEventRow, SimResultRow, get_session
from app.simulation.state import RoundResult


class SimulationResult(BaseModel):
    """Final metadata stored once a simulation run terminates."""
    target_model: str = ""
    seed_graph_id: str = ""
    termination_reason: str = ""
    campaign_strategies: list[str] = Field(default_factory=list)
    fc_flags: list[str] = Field(default_factory=list)


class EventStore:
    """SQLite-backed event store keyed by sim_id. Thread-safe via SQLAlchemy session-per-call."""

    def push(self, sim_id: str, event: RoundResult) -> None:
        with get_session() as session:
            session.add(
                RoundEventRow(
                    sim_id=sim_id,
                    round=event.round,
                    data=event.model_dump_json(),
                )
            )
            session.commit()

    def complete(self, sim_id: str, result: SimulationResult) -> None:
        with get_session() as session:
            row = session.get(SimResultRow, sim_id)
            if row:
                row.data = result.model_dump_json()
            else:
                session.add(SimResultRow(sim_id=sim_id, data=result.model_dump_json()))
            session.commit()

    def get_since(self, sim_id: str, after_round: int) -> list[RoundResult]:
        with get_session() as session:
            rows = (
                session.query(RoundEventRow)
                .filter(
                    RoundEventRow.sim_id == sim_id,
                    RoundEventRow.round > after_round,
                )
                .order_by(RoundEventRow.round)
                .all()
            )
            return [RoundResult.model_validate_json(r.data) for r in rows]

    def get_all(self, sim_id: str) -> list[RoundResult]:
        with get_session() as session:
            rows = (
                session.query(RoundEventRow)
                .filter(RoundEventRow.sim_id == sim_id)
                .order_by(RoundEventRow.round)
                .all()
            )
            return [RoundResult.model_validate_json(r.data) for r in rows]

    def get_result(self, sim_id: str) -> SimulationResult | None:
        with get_session() as session:
            row = session.get(SimResultRow, sim_id)
            if row is None:
                return None
            return SimulationResult.model_validate_json(row.data)

    def clear(self, sim_id: str) -> None:
        with get_session() as session:
            session.query(RoundEventRow).filter(RoundEventRow.sim_id == sim_id).delete()
            session.query(SimResultRow).filter(SimResultRow.sim_id == sim_id).delete()
            session.commit()


# module-level singleton shared across requests
event_store = EventStore()
