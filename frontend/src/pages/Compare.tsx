import { useReportStore } from '../store/reportStore';
import { DriftStageChip } from '../components/shared/DriftStageChip';
import { Badge } from '../components/shared/Badge';
import type { DriftStage } from '../types/simulation';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

export function Compare() {
  const report = useReportStore((s) => s.report);

  if (!report) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-sm">
          Run a simulation in the Lab first to see results here.
        </p>
      </div>
    );
  }

  const radarData = Object.entries(report.attack_effectiveness).map(([code, score]) => ({
    subject: code,
    score: +(score * 100).toFixed(1),
  }));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-white font-semibold text-lg">Model Robustness Analysis</h2>
        <p className="text-xs text-gray-500 mt-0.5 font-mono">{report.target_model}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 col-span-1">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Summary</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Final Stage</p>
              <div className="mt-1">
                <DriftStageChip stage={report.final_drift_stage as DriftStage} />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Frame Drift Point</p>
              <p className="text-2xl font-mono font-bold text-yellow-300">
                {report.frame_drift_point != null ? `R${report.frame_drift_point}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Assimilation Point</p>
              <p className="text-xl font-mono font-bold text-orange-400">
                {report.assimilation_point != null ? `R${report.assimilation_point}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Collapse Point</p>
              <p className="text-xl font-mono font-bold text-red-400">
                {report.factual_collapse_point != null ? `R${report.factual_collapse_point}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Recoveries</p>
              <p className="text-xl font-mono font-bold text-green-400">{report.recovery_count}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Termination</p>
              <p className="text-xs text-gray-300 mt-1">{report.termination_reason}</p>
            </div>
          </div>
        </div>

        {radarData.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 col-span-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Attack Effectiveness Radar
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 9 }} />
                <Radar
                  name="Effectiveness"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
                  formatter={(v) => [`${v}%`, 'Effectiveness']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {report.failure_modes.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Failure Modes
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.failure_modes.map((mode) => (
                <span
                  key={mode}
                  className="text-xs bg-red-900/40 border border-red-700/40 text-red-300 rounded px-2 py-1"
                >
                  {mode}
                </span>
              ))}
            </div>
          </div>
        )}

        {report.hardening_recommendations.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Hardening Recommendations
            </h3>
            <ul className="space-y-2">
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

      {report.campaign_strategies.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Campaign Strategies Used
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.campaign_strategies.map((code) => (
              <Badge key={code} code={code} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
