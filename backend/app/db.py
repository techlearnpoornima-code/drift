from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, Index, Integer, Text, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

_SessionLocal: sessionmaker | None = None


class _Base(DeclarativeBase):
    pass


class RoundEventRow(_Base):
    __tablename__ = "round_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sim_id = Column(Text, nullable=False)
    round = Column(Integer, nullable=False)
    data = Column(Text, nullable=False)  # RoundResult JSON blob


class SimResultRow(_Base):
    __tablename__ = "sim_results"

    sim_id = Column(Text, primary_key=True)
    data = Column(Text, nullable=False)  # SimulationResult JSON blob


class SeedTextRow(_Base):
    __tablename__ = "seed_texts"

    graph_id = Column(Text, primary_key=True)
    text = Column(Text, nullable=False)  # raw seed document text


class SeedMetaRow(_Base):
    __tablename__ = "seed_meta"

    graph_id = Column(Text, primary_key=True)
    filename = Column(Text, nullable=False)
    created_at = Column(Text, nullable=False)  # ISO-8601 UTC


Index("idx_round_events_sim_round", RoundEventRow.sim_id, RoundEventRow.round)


def store_seed_text(graph_id: str, text_content: str) -> None:
    with get_session() as session:
        row = session.get(SeedTextRow, graph_id)
        if row:
            row.text = text_content
        else:
            session.add(SeedTextRow(graph_id=graph_id, text=text_content))
        session.commit()


def get_seed_text(graph_id: str) -> str:
    with get_session() as session:
        row = session.get(SeedTextRow, graph_id)
        return row.text if row else ""


def store_seed_meta(graph_id: str, filename: str) -> None:
    with get_session() as session:
        row = session.get(SeedMetaRow, graph_id)
        if not row:
            session.add(SeedMetaRow(
                graph_id=graph_id,
                filename=filename,
                created_at=datetime.now(timezone.utc).isoformat(),
            ))
            session.commit()


def list_seeds() -> list[dict]:
    with get_session() as session:
        rows = session.query(SeedMetaRow).order_by(SeedMetaRow.created_at.desc()).all()
        return [{"graph_id": r.graph_id, "filename": r.filename, "created_at": r.created_at} for r in rows]


def init_db(db_path: str) -> None:
    """Create engine, enable WAL mode for concurrent reads, create tables if absent."""
    global _SessionLocal
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    with engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL"))
        conn.commit()
    _Base.metadata.create_all(engine)
    _SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_session() -> Session:
    if _SessionLocal is None:
        raise RuntimeError("db.init_db() has not been called")
    return _SessionLocal()
