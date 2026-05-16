#!/usr/bin/env python3
"""
Cross-model pilot runner for DRIFT.

Usage:
    uv run python scripts/run_pilot.py [OPTIONS]

Options:
    --base-url      Backend base URL (default: http://localhost:5001)
    --seed          Path to seed document (default: seeds/sample_neuroscience.txt)
    --models        Comma-separated model names (default: gpt-4o,gpt-4o-mini,gpt-3.5-turbo)
    --strategies    Comma-separated attack codes (default: SC-01,SOC-04,AC-08)
    --rounds        Max rounds per simulation (default: 10)
    --poll-interval Seconds between status polls (default: 10)

Example:
    uv run python scripts/run_pilot.py \\
        --models gpt-4o,gpt-4o-mini,gpt-3.5-turbo \\
        --strategies SC-01,SOC-04,AC-08,TS-09 \\
        --rounds 15
"""
from __future__ import annotations

import argparse
import sys
import time
import uuid
from pathlib import Path

import requests


def _upload_seed(base_url: str, seed_path: Path, sim_id: str) -> str:
    print(f"  Uploading {seed_path.name} ...")
    with seed_path.open("rb") as f:
        resp = requests.post(
            f"{base_url}/api/seed/upload",
            files={"file": (seed_path.name, f, "text/plain")},
            timeout=120,
        )
    if not resp.ok:
        print(f"\n  ERROR {resp.status_code} from /api/seed/upload:", file=sys.stderr)
        print(f"  {resp.text[:1000]}", file=sys.stderr)
    resp.raise_for_status()
    data = resp.json()
    graph_id = data.get("graph_id") or data.get("seed_graph_id")
    if not graph_id:
        raise RuntimeError(f"Unexpected upload response: {data}")
    print(f"  Seed graph: {graph_id}")
    return graph_id


def _start_simulation(
    base_url: str,
    sim_id: str,
    seed_graph_id: str,
    model: str,
    strategies: list[str],
    max_rounds: int,
) -> None:
    resp = requests.post(
        f"{base_url}/api/sim/run",
        json={
            "sim_id": sim_id,
            "seed_graph_id": seed_graph_id,
            "target_model": model,
            "max_rounds": max_rounds,
            "campaign": {"strategies": strategies, "mode": "fixed"},
        },
        timeout=30,
    )
    resp.raise_for_status()


def _fetch_report(base_url: str, sim_id: str) -> dict:
    resp = requests.get(f"{base_url}/api/report/{sim_id}", timeout=10)
    resp.raise_for_status()
    return resp.json()


def _print_table(reports: dict[str, dict]) -> None:
    col_w = max(len(k) for k in reports) + 2
    row_fmt = "{:<{w}} {:<22} {:<6} {:<18} {:<28} {}"

    print("\n" + "=" * 110)
    print("CROSS-MODEL PILOT RESULTS")
    print("=" * 110)
    print(row_fmt.format("sim_id", "model", "EHL", "drift_stage", "termination", "failure_modes", w=col_w))
    print("-" * 110)
    for sim_id, r in reports.items():
        print(
            row_fmt.format(
                sim_id,
                (r.get("target_model") or "")[:22],
                r.get("epistemic_half_life", "?"),
                r.get("final_drift_stage", "?"),
                r.get("termination_reason", "?"),
                ", ".join(r.get("failure_modes", [])) or "—",
                w=col_w,
            )
        )
    print("=" * 110)

    print("\nATTACK EFFECTIVENESS per model:")
    for sim_id, r in reports.items():
        eff = r.get("attack_effectiveness", {})
        if eff:
            parts = ", ".join(f"{k}={v:.0%}" for k, v in sorted(eff.items(), key=lambda x: -x[1]))
            print(f"  {sim_id}: {parts}")
        else:
            print(f"  {sim_id}: no attributed contradictions")

    print("\nTOP VULNERABLE NODES (first model with data):")
    for r in reports.values():
        nodes = r.get("node_vulnerability", [])
        if nodes:
            for n in nodes[:3]:
                score = n["vulnerability_score"]
                codes = ", ".join(n["attack_codes"]) or "unknown"
                print(f"  {score:.2f}  {n['node']}  [{codes}]")
            break
    print()


def main() -> None:
    parser = argparse.ArgumentParser(description="DRIFT cross-model pilot runner")
    parser.add_argument("--base-url", default="http://localhost:5001")
    parser.add_argument("--seed", default="seeds/sample_neuroscience.txt")
    parser.add_argument("--models", default="gpt-4o,gpt-4o-mini,gpt-3.5-turbo")
    parser.add_argument("--strategies", default="SC-01,SOC-04,AC-08")
    parser.add_argument("--rounds", type=int, default=10)
    parser.add_argument("--poll-interval", type=int, default=10)
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    seed_path = Path(args.seed)
    models = [m.strip() for m in args.models.split(",") if m.strip()]
    strategies = [s.strip() for s in args.strategies.split(",") if s.strip()]

    if not seed_path.exists():
        print(f"ERROR: seed file not found: {seed_path}", file=sys.stderr)
        sys.exit(1)

    pilot_id = uuid.uuid4().hex[:8]
    print(f"\nDRIFT Cross-Model Pilot  [id={pilot_id}]")
    print(f"  Seed:       {seed_path}")
    print(f"  Models:     {', '.join(models)}")
    print(f"  Strategies: {', '.join(strategies)}")
    print(f"  Max rounds: {args.rounds}")
    print(f"  Backend:    {base_url}\n")

    # Check server is reachable before doing anything
    try:
        requests.get(f"{base_url}/api/sim/healthcheck", timeout=3)
    except requests.exceptions.ConnectionError:
        print(f"ERROR: cannot reach backend at {base_url}", file=sys.stderr)
        print("       Start it with:  uv run python run.py", file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.RequestException:
        pass  # 404 is fine — server is up

    # Step 1 — upload seed once; all models share the same graph
    seed_sim_id = f"pilot-{pilot_id}-seed"
    graph_id = _upload_seed(base_url, seed_path, seed_sim_id)
    print("  Waiting 5s for Zep graph to settle ...")
    time.sleep(5)

    # Step 2 — start one simulation per model
    sim_ids: list[str] = []
    for i, model in enumerate(models):
        sim_id = f"pilot-{pilot_id}-m{i}"
        print(f"  Starting {sim_id}  model={model} ...")
        _start_simulation(base_url, sim_id, graph_id, model, strategies, args.rounds)
        sim_ids.append(sim_id)
    print()

    # Step 3 — poll all until terminated
    print("Polling simulations ...")
    done: set[str] = set()
    while len(done) < len(sim_ids):
        for sim_id in sim_ids:
            if sim_id in done:
                continue
            data = requests.get(f"{base_url}/api/sim/{sim_id}/status", timeout=10).json()
            status = data.get("status", "")
            rnd = data.get("round", "?")
            fid = data.get("fidelity_score")
            fid_str = f"  fidelity={fid:.3f}" if fid is not None else ""
            print(f"  [{sim_id}] round={rnd} status={status}{fid_str}")
            if status == "terminated":
                done.add(sim_id)
        if len(done) < len(sim_ids):
            time.sleep(args.poll_interval)

    # Step 4 — fetch reports and print comparison table
    print("\nFetching reports ...")
    reports: dict[str, dict] = {sid: _fetch_report(base_url, sid) for sid in sim_ids}
    _print_table(reports)

    # Step 5 — print compare endpoint URL for reference
    sim_ids_param = ",".join(sim_ids)
    print(f"Compare endpoint:")
    print(f"  GET {base_url}/api/compare?sim_ids={sim_ids_param}\n")


if __name__ == "__main__":
    main()
