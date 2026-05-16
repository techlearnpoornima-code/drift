import { useState } from 'react';
import { runSimulation } from '../api/simulation';
import { useSimStore } from '../store/simStore';

const ATTACK_GROUPS = [
  {
    label: 'Semantic Corruption',
    attacks: [
      { code: 'SC-01', name: 'Concept Creep', desc: 'Gradual semantic boundary erosion' },
      { code: 'SC-02', name: 'Context Butcher', desc: 'Compositional reasoning disruption' },
    ],
  },
  {
    label: 'Social Coordination',
    attacks: [
      { code: 'SOC-03', name: 'Echo Chamber', desc: 'Multi-agent social pressure ×3' },
      { code: 'SOC-04', name: 'Gaslighting', desc: 'Context window trust exploitation' },
    ],
  },
  {
    label: 'Cognitive Overload',
    attacks: [
      { code: 'LS-05', name: 'Gish Gallop', desc: 'Claim flood via attention dilution ×2' },
      { code: 'AC-07', name: 'Authority Spoofing', desc: 'Credential / citation deference' },
      { code: 'AC-08', name: 'Incremental Commit', desc: 'Cumulative commitment failure' },
    ],
  },
  {
    label: 'Infrastructure',
    attacks: [
      { code: 'TS-09', name: 'Temporal Sleight', desc: 'Knowledge cutoff anxiety' },
      { code: 'LS-06', name: 'Persona Break', desc: 'Fact-checker persona fragility' },
    ],
  },
];

interface Props {
  onSimStarted: (simId: string) => void;
}

export function AdversaryPanel({ onSimStarted }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [maxRounds, setMaxRounds] = useState(5);
  const [error, setError] = useState('');

  const selectedSeedGraphId = useSimStore((s) => s.selectedSeedGraphId);
  const selectedFilename = useSimStore((s) => s.selectedFilename);
  const isRunning = useSimStore((s) => s.isRunning);
  const setRunning = useSimStore((s) => s.setRunning);
  const setSeed = useSimStore((s) => s.setSeed);
  const reset = useSimStore((s) => s.reset);

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  async function handleRun() {
    if (!selectedSeedGraphId) { setError('Select a seed document first.'); return; }
    setError('');
    reset();

    const newSimId = crypto.randomUUID();
    setSeed(newSimId, selectedSeedGraphId);
    setRunning(true);

    try {
      await runSimulation({
        sim_id: newSimId,
        seed_graph_id: selectedSeedGraphId,
        max_rounds: maxRounds,
        campaign: { strategies: Array.from(selected), mode: 'fixed' },
      });
      onSimStarted(newSimId);
    } catch {
      setRunning(false);
      setError('Failed to start — is the backend running?');
    }
  }

  const canRun = !!selectedSeedGraphId && !isRunning;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
        Attack Strategies
      </p>

      <div className="flex flex-col gap-3 overflow-y-auto">
        {ATTACK_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">{group.label}</p>
            <div className="flex flex-col gap-0.5">
              {group.attacks.map((a) => {
                const checked = selected.has(a.code);
                return (
                  <label
                    key={a.code}
                    className={`flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors
                      ${checked ? 'bg-gray-800 border border-gray-600' : 'border border-transparent hover:bg-gray-800/40'}
                      ${isRunning ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                  >
                    <input
                      type="checkbox"
                      disabled={isRunning}
                      checked={checked}
                      onChange={() => toggle(a.code)}
                      className="mt-0.5 accent-blue-500 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs text-gray-200">{a.name}</span>
                      <span className="ml-1.5 text-[10px] font-mono text-gray-600">{a.code}</span>
                      <p className="text-[10px] text-gray-600 leading-tight mt-0.5">{a.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
        <label className="text-xs text-gray-500 shrink-0">Max rounds</label>
        <input
          type="number"
          min={1}
          max={50}
          value={maxRounds}
          disabled={isRunning}
          onChange={(e) => setMaxRounds(Math.max(1, Math.min(50, Number(e.target.value))))}
          className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200
            focus:outline-none focus:border-blue-600 disabled:opacity-40"
        />
      </div>

      {!selectedSeedGraphId && (
        <p className="text-[11px] text-gray-600 italic">← Select a seed document above</p>
      )}
      {selectedSeedGraphId && (
        <p className="text-[11px] text-blue-400 truncate">Seed: {selectedFilename}</p>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        disabled={!canRun}
        onClick={handleRun}
        className={`w-full py-2.5 rounded font-semibold text-sm transition-colors
          ${canRun
            ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
      >
        {isRunning
          ? <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-300 animate-ping" />
              Running…
            </span>
          : '▶  Run Simulation'
        }
      </button>
    </div>
  );
}
