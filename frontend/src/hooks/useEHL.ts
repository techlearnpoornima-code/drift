import { useSimStore } from '../store/simStore';

export function useEHL(): number | string {
  const rounds = useSimStore((s) => s.rounds);
  for (const r of rounds) {
    if (r.fact_check_result.fidelity_score < 0.5) {
      return r.round;
    }
  }
  const total = rounds.length;
  return total > 0 ? `>${total}` : '—';
}
