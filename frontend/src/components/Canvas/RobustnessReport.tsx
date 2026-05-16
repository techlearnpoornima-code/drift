import { useReportStore } from '../../store/reportStore';
import { Badge } from '../shared/Badge';
import { DriftStageChip } from '../shared/DriftStageChip';
import type { DriftStage } from '../../types/simulation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export function RobustnessReport() {
  const report = useReportStore((s) => s.report);
  const loading = useReportStore((s) => s.loading);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-xs text-gray-500 text-center">Generating report…</p>
      </div>
    );
  }

  if (!report) return null;

  const effectivenessData = Object.entries(report.attack_effectiveness).map(
    ([code, score]) => ({ code, score: +(score * 100).toFixed(1) })
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold text-white">Robustness Report</h3>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 rounded p-3">
          <p className="text-xs text-gray-400">Final Stage</p>
          <div className="mt-1">
            <DriftStageChip stage={report.final_drift_stage as DriftStage} />
          </div>
        </div>
        <div className="bg-gray-900 rounded p-3">
          <p className="text-xs text-gray-400">Total Rounds</p>
          <p className="text-lg font-mono font-bold text-white">{report.total_rounds}</p>
        </div>
        <div className="bg-gray-900 rounded p-3">
          <p className="text-xs text-gray-400">Frame Drift Point</p>
          <p className="text-lg font-mono font-bold text-yellow-300">
            {report.frame_drift_point != null ? `R${report.frame_drift_point}` : '—'}
          </p>
          <p className="text-xs text-gray-500">social convergence</p>
        </div>
        <div className="bg-gray-900 rounded p-3">
          <p className="text-xs text-gray-400">Assimilation Point</p>
          <p className="text-lg font-mono font-bold text-orange-400">
            {report.assimilation_point != null ? `R${report.assimilation_point}` : '—'}
          </p>
          <p className="text-xs text-gray-500">framing as premise</p>
        </div>
        <div className="bg-gray-900 rounded p-3">
          <p className="text-xs text-gray-400">Collapse Point</p>
          <p className="text-lg font-mono font-bold text-red-400">
            {report.factual_collapse_point != null ? `R${report.factual_collapse_point}` : '—'}
          </p>
          <p className="text-xs text-gray-500">factual capture</p>
        </div>
        <div className="bg-gray-900 rounded p-3">
          <p className="text-xs text-gray-400">Recovery Count</p>
          <p className="text-lg font-mono font-bold text-green-400">{report.recovery_count}</p>
          <p className="text-xs text-gray-500">stage recoveries</p>
        </div>
      </div>

      {/* Termination reason */}
      <div>
        <p className="text-xs text-gray-400 mb-1">Termination Reason</p>
        <p className="text-xs text-gray-300 bg-gray-900 rounded px-3 py-2">{report.termination_reason}</p>
      </div>

      {/* Failure modes */}
      {report.failure_modes.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Failure Modes</p>
          <div className="flex flex-wrap gap-1">
            {report.failure_modes.map((mode) => (
              <span key={mode} className="text-xs bg-red-900/40 border border-red-700/40 text-red-300 rounded px-2 py-0.5">
                {mode}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* FC flags */}
      {report.fc_flags.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Fact-Checker Flags</p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {report.fc_flags.map((flag, i) => (
              <p key={i} className="text-xs text-yellow-300 bg-yellow-900/20 rounded px-2 py-1">{flag}</p>
            ))}
          </div>
        </div>
      )}

      {/* Attack effectiveness */}
      {effectivenessData.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Attack Effectiveness</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={effectivenessData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} unit="%" />
              <YAxis type="category" dataKey="code" tick={{ fill: '#9ca3af', fontSize: 10 }} width={52} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
                formatter={(v) => [`${v}%`, 'Score']}
              />
              <Bar dataKey="score" fill="#6366f1" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Campaign strategies */}
      {report.campaign_strategies.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Campaign Strategies</p>
          <div className="flex flex-wrap gap-1">
            {report.campaign_strategies.map((code) => (
              <Badge key={code} code={code} />
            ))}
          </div>
        </div>
      )}

      {/* Hardening recommendations */}
      {report.hardening_recommendations.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Hardening Recommendations</p>
          <ul className="space-y-1">
            {report.hardening_recommendations.map((rec, i) => (
              <li key={i} className="text-xs text-gray-300 flex gap-2">
                <span className="text-green-400 shrink-0">›</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
