import { useSimStore } from '../store/simStore';
import { useReportStore } from '../store/reportStore';
import { DriftStageChip } from '../components/shared/DriftStageChip';
import type { DriftStage } from '../types/simulation';

export function History() {
  const rounds = useSimStore((s) => s.rounds);
  const simId = useSimStore((s) => s.simId);
  const report = useReportStore((s) => s.report);

  if (rounds.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-sm">No simulation has been run yet. Go to the Lab to start one.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-white font-semibold text-lg">Simulation History</h2>
        {simId && <p className="text-xs text-gray-500 font-mono mt-0.5">{simId}</p>}
      </div>

      {report && (
        <div className="bg-gray-800 rounded-lg p-4 grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400">Stage</p>
            <div className="mt-1">
              <DriftStageChip stage={report.final_drift_stage as DriftStage} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400">Rounds</p>
            <p className="text-lg font-mono font-bold text-white">{report.total_rounds}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Frame Drift</p>
            <p className="text-lg font-mono font-bold text-yellow-300">
              {report.frame_drift_point != null ? `R${report.frame_drift_point}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Assimilation</p>
            <p className="text-lg font-mono font-bold text-orange-400">
              {report.assimilation_point != null ? `R${report.assimilation_point}` : '—'}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Round Log</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-2 pr-4 text-gray-400 font-medium">Round</th>
                <th className="py-2 pr-4 text-gray-400 font-medium">Stage</th>
                <th className="py-2 pr-4 text-gray-400 font-medium">Fidelity</th>
                <th className="py-2 pr-4 text-gray-400 font-medium">Drift</th>
                <th className="py-2 text-gray-400 font-medium">Active Attacks</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r) => (
                <tr key={r.round} className="border-b border-gray-800 hover:bg-gray-800/40">
                  <td className="py-2 pr-4 font-mono text-gray-300">{r.round}</td>
                  <td className="py-2 pr-4">
                    <DriftStageChip stage={r.drift_stage as DriftStage} />
                  </td>
                  <td className="py-2 pr-4 font-mono text-green-400">
                    {(r.fact_check_result.fidelity_score * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 pr-4 font-mono text-orange-400">
                    {(r.fact_check_result.drift_intensity_score * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 text-gray-300">{r.active_attack_strategies.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
