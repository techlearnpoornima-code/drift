import { useSimStore } from '../../store/simStore';
import { useReportStore } from '../../store/reportStore';
import { useGraphStore } from '../../store/graphStore';
import { runSimulation } from '../../api/simulation';

interface Props {
  strategies: string[];
  maxRounds: number;
}

export function SimControls({ strategies, maxRounds }: Props) {
  const { simId, seedGraphId, isRunning, isTerminated, setRunning, reset } = useSimStore();
  const resetReport = useReportStore((s) => s.reset);
  const resetGraph = useGraphStore((s) => s.reset);

  const canRun = !!seedGraphId && !isRunning;

  const handleRun = async () => {
    if (!canRun) return;
    reset();
    resetReport();
    resetGraph();
    setRunning(true);
    try {
      await runSimulation({
        sim_id: simId,
        seed_graph_id: seedGraphId,
        max_rounds: maxRounds,
        campaign: { strategies, mode: 'fixed' },
      });
    } catch {
      setRunning(false);
      alert('Failed to start simulation');
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Controls</p>
      <button
        onClick={handleRun}
        disabled={!canRun}
        className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
      >
        {isRunning ? 'Running…' : isTerminated ? 'Run Again' : 'Run Simulation'}
      </button>
      {!seedGraphId && (
        <p className="text-xs text-gray-500 text-center">Upload a seed document first</p>
      )}
      {isTerminated && (
        <p className="text-xs text-green-400 text-center">Simulation complete</p>
      )}
    </div>
  );
}
