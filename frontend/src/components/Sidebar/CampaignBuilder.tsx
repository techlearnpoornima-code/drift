import { useState } from 'react';
import { Badge } from '../shared/Badge';

const ALL_STRATEGIES = [
  { code: 'SC-01', label: 'Concept Creep' },
  { code: 'SC-02', label: 'Context Butcher' },
  { code: 'SOC-03', label: 'Echo Chamber' },
  { code: 'SOC-04', label: 'Gaslighting' },
  { code: 'LS-05', label: 'Gish Gallop' },
  { code: 'LS-06', label: 'Persona Break' },
  { code: 'AC-07', label: 'Authority Spoofing' },
  { code: 'AC-08', label: 'Incremental Commit' },
  { code: 'TS-09', label: 'Temporal Sleight' },
];

interface Props {
  onChange: (strategies: string[], maxRounds: number) => void;
}

export function CampaignBuilder({ onChange }: Props) {
  const [selected, setSelected] = useState<string[]>(['SC-01']);
  const [maxRounds, setMaxRounds] = useState(10);

  const toggle = (code: string) => {
    const next = selected.includes(code)
      ? selected.filter((s) => s !== code)
      : [...selected, code];
    setSelected(next);
    onChange(next, maxRounds);
  };

  const onRoundsChange = (v: number) => {
    setMaxRounds(v);
    onChange(selected, v);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Attack Campaign</p>
      <div className="flex flex-wrap gap-2">
        {ALL_STRATEGIES.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => toggle(code)}
            title={label}
            className={`px-2 py-1 rounded text-xs font-mono border transition-all ${
              selected.includes(code)
                ? 'opacity-100 border-white'
                : 'opacity-40 border-transparent'
            }`}
          >
            <Badge code={code} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400">Max rounds</label>
        <input
          type="number"
          min={1}
          max={50}
          value={maxRounds}
          onChange={(e) => onRoundsChange(Number(e.target.value))}
          className="w-16 bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
        />
      </div>
    </div>
  );
}
