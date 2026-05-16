const COLORS: Record<string, string> = {
  'SC-01': '#f59e0b', 'SC-02': '#f97316',
  'SOC-03': '#8b5cf6', 'SOC-04': '#ec4899',
  'LS-05': '#06b6d4', 'LS-06': '#84cc16',
  'AC-07': '#ef4444', 'AC-08': '#f43f5e',
  'TS-09': '#3b82f6',
};

export function Badge({ code }: { code: string }) {
  const bg = COLORS[code] ?? '#6b7280';
  return (
    <span
      style={{ background: bg }}
      className="inline-block px-2 py-0.5 rounded text-xs font-mono text-white"
    >
      {code}
    </span>
  );
}
