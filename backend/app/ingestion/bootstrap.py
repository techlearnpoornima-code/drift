from __future__ import annotations

import asyncio

from zep_cloud import EpisodeData
from zep_cloud.client import AsyncZep

from app.config import Config

_CHUNK_SIZE = 500
_CHUNK_OVERLAP = 50
_BATCH_SIZE = 3
_POLL_INTERVAL = 3   # seconds between episode-status checks
_POLL_TIMEOUT = 300  # max seconds to wait for all episodes to process


def _chunk_text(text: str, size: int, overlap: int) -> list[str]:
    chunks, start = [], 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start += size - overlap
    return chunks


async def bootstrap_seed_graph(sim_id: str, text: str, config: Config | None = None) -> str:
    """
    Push seed document text into a named Zep graph via add_batch(), then
    poll episode.processed until Zep has finished extracting entities and
    edges. Returns graph_id once the graph is ready.

    Named drift_seed_{sim_id}. Write-locked after this call — only the
    Fact-Checker reads it; no adversary session ever writes to it.
    """
    cfg = config or Config()
    client = AsyncZep(api_key=cfg.ZEP_API_KEY)

    graph_id = f"drift_seed_{sim_id}"

    await client.graph.create(
        graph_id=graph_id,
        name=graph_id,
        description=f"Seed ontology for simulation {sim_id}",
    )

    # Split text into overlapping chunks
    chunks = _chunk_text(text, _CHUNK_SIZE, _CHUNK_OVERLAP)
    print(f"[bootstrap] {len(chunks)} chunks — sending to Zep graph {graph_id}")

    # Send in batches, collect episode UUIDs
    episode_uuids: list[str] = []
    for i in range(0, len(chunks), _BATCH_SIZE):
        batch = chunks[i : i + _BATCH_SIZE]
        episodes = [EpisodeData(data=chunk, type="text") for chunk in batch]
        result = await client.graph.add_batch(graph_id=graph_id, episodes=episodes)
        if result and isinstance(result, list):
            for ep in result:
                uid = getattr(ep, "uuid_", None) or getattr(ep, "uuid", None)
                if uid:
                    episode_uuids.append(uid)
        await asyncio.sleep(1)  # avoid hammering the API between batches

    print(f"[bootstrap] {len(episode_uuids)} episodes queued — waiting for Zep processing")

    # Poll each episode's .processed flag
    pending = set(episode_uuids)
    elapsed = 0
    while pending and elapsed < _POLL_TIMEOUT:
        await asyncio.sleep(_POLL_INTERVAL)
        elapsed += _POLL_INTERVAL
        for uid in list(pending):
            try:
                ep = await client.graph.episode.get(uuid_=uid)
                if getattr(ep, "processed", False):
                    pending.discard(uid)
            except Exception:
                pass
        done = len(episode_uuids) - len(pending)
        print(f"[bootstrap] {done}/{len(episode_uuids)} episodes processed ({elapsed}s)")

    if pending:
        print(f"[bootstrap] WARNING: {len(pending)} episodes still unprocessed after {_POLL_TIMEOUT}s — proceeding anyway")
    else:
        print(f"[bootstrap] all episodes processed — graph {graph_id} is ready")

    return graph_id
