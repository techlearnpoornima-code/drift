import type { DriftStage } from '../../types/simulation';

const STAGE_STYLES: Record<DriftStage, { label: string; color: string }> = {
  stable:              { label: 'Stable',              color: '#22c55e' },
  resisting:           { label: 'Resisting',           color: '#4ade80' },
  accommodating:       { label: 'Accommodating',       color: '#eab308' },
  assimilating:        { label: 'Assimilating',        color: '#f97316' },
  drifted:             { label: 'Drifted',             color: '#f43f5e' },
  captured:            { label: 'Captured',            color: '#ef4444' },
  evaluation_collapse: { label: 'Evaluation Collapse', color: '#94a3b8' },
};

export function DriftStageChip({ stage }: { stage: DriftStage }) {
  const { label, color } = STAGE_STYLES[stage] ?? { label: stage, color: '#6b7280' };
  return (
    <span
      style={{ border: `1px solid ${color}`, color }}
      className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
    >
      {label}
    </span>
  );
}
