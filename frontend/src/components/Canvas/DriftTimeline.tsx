import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import { useSimStore } from '../../store/simStore';
import { useEHL } from '../../hooks/useEHL';
import { DriftStageChip } from '../shared/DriftStageChip';
import type { DriftStage } from '../../types/simulation';

export function DriftTimeline() {
  const rounds = useSimStore((s) => s.rounds);
  const currentStage = useSimStore((s) => s.currentDriftStage);
  const ehl = useEHL();

  const data = rounds.map((r) => ({
    round: r.round,
    fidelity: +(r.fact_check_result.fidelity_score * 100).toFixed(1),
    drift: +(r.fact_check_result.drift_intensity_score * 100).toFixed(1),
  }));

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Fidelity Timeline</h3>
        <div className="flex items-center gap-3">
          {currentStage && <DriftStageChip stage={currentStage as DriftStage} />}
          <span className="text-xs text-gray-400">
            EHL: <span className="text-white font-mono">{ehl}</span>
          </span>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-8">No rounds yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="round" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} unit="%" />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="fidelity" stroke="#22c55e" strokeWidth={2} dot={false} name="Fidelity %" />
            <Line type="monotone" dataKey="drift" stroke="#f97316" strokeWidth={2} dot={false} name="Drift Intensity %" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
