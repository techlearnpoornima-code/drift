import { useSimStore } from '../../store/simStore';
import { Badge } from '../shared/Badge';
import { DriftStageChip } from '../shared/DriftStageChip';
import type { DriftStage } from '../../types/simulation';

export function AgentFeed() {
  const rounds = useSimStore((s) => s.rounds);

  if (rounds.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">Agent Feed</h3>
        <p className="text-xs text-gray-500">Waiting for simulation to start…</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">Agent Feed</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        {[...rounds].reverse().map((r) => (
          <div key={r.round} className="border border-gray-700 rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">Round {r.round}</span>
              <div className="flex items-center gap-2">
                <DriftStageChip stage={r.drift_stage as DriftStage} />
                <span className="text-xs text-gray-400">
                  F: <span className="text-green-400 font-mono">{(r.fact_check_result.fidelity_score * 100).toFixed(0)}%</span>
                </span>
              </div>
            </div>
            {r.adversary_message && (
              <div className="bg-red-950/40 border border-red-900/40 rounded p-2">
                <p className="text-xs text-red-400 font-semibold mb-1">Adversary</p>
                <p className="text-xs text-gray-300 whitespace-pre-wrap">{r.adversary_message.slice(0, 400)}{r.adversary_message.length > 400 ? '…' : ''}</p>
              </div>
            )}
            <div className="bg-blue-950/40 border border-blue-900/40 rounded p-2">
              <p className="text-xs text-blue-400 font-semibold mb-1">Target</p>
              <p className="text-xs text-gray-300">{r.target_response.slice(0, 300)}{r.target_response.length > 300 ? '…' : ''}</p>
            </div>
            {r.active_attack_strategies.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {r.active_attack_strategies.map((code) => (
                  <Badge key={code} code={code} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
