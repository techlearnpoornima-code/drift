import { useGraphStore } from '../../store/graphStore';

export function FidelityHeatmap() {
  const nodes = useGraphStore((s) => s.nodes);

  if (nodes.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">Node Vulnerability</h3>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {[...nodes]
          .sort((a, b) => b.vulnerability_score - a.vulnerability_score)
          .map((n) => (
            <div key={n.node} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">{n.node}</p>
              </div>
              <div className="w-24 bg-gray-700 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${Math.min(n.vulnerability_score * 100, 100).toFixed(0)}%`,
                    background: n.vulnerability_score > 0.7 ? '#ef4444' : n.vulnerability_score > 0.4 ? '#f97316' : '#eab308',
                  }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right font-mono">
                {(n.vulnerability_score * 100).toFixed(0)}%
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
