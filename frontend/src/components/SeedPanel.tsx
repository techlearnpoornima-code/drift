import { useEffect, useRef, useState } from 'react';
import { listSeeds, uploadSeed } from '../api/seed';
import { useSimStore } from '../store/simStore';

const UPLOAD_PHASES = [
  { until: 0.08, label: 'Uploading document…' },
  { until: 0.18, label: 'Extracting text…' },
  { until: 0.50, label: 'Sending to knowledge graph…' },
  { until: 0.90, label: 'Processing episodes in Zep…' },
];

function phaseLabel(progress: number): string {
  for (const phase of UPLOAD_PHASES) {
    if (progress <= phase.until + 0.001) return phase.label;
  }
  return 'Finalising…';
}

export function SeedPanel() {
  const seeds = useSimStore((s) => s.seeds);
  const setSeeds = useSimStore((s) => s.setSeeds);
  const selectSeed = useSimStore((s) => s.selectSeed);
  const selectedSeedGraphId = useSimStore((s) => s.selectedSeedGraphId);
  const isRunning = useSimStore((s) => s.isRunning);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    listSeeds().then(setSeeds).catch(() => {});
  }, []);

  function startProgressAnimation() {
    setProgress(0);
    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        const next = p + (0.90 - p) * 0.025;
        return next > 0.895 ? 0.895 : next;
      });
    }, 500);
  }

  function stopProgressAnimation(success: boolean) {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    if (success) {
      setProgress(1);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 600);
    } else {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError('');
    startProgressAnimation();
    try {
      const res = await uploadSeed(file);
      const updated = await listSeeds();
      setSeeds(updated);
      selectSeed(res.seed_graph_id, res.filename);
      stopProgressAnimation(true);
    } catch {
      setUploadError('Upload failed — check server logs.');
      stopProgressAnimation(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
        Seed Documents
      </p>

      <div className="flex flex-col gap-1 max-h-44 overflow-y-auto pr-0.5">
        {seeds.length === 0 && (
          <p className="text-xs text-gray-600 italic">No seeds uploaded yet.</p>
        )}
        {seeds.map((s) => {
          const selected = s.graph_id === selectedSeedGraphId;
          return (
            <button
              key={s.graph_id}
              disabled={isRunning}
              onClick={() => selectSeed(s.graph_id, s.filename)}
              className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors
                ${selected
                  ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-transparent'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span className="text-gray-500 shrink-0">📄</span>
              <span className="truncate flex-1">{s.filename}</span>
              {selected && <span className="text-blue-400 shrink-0 text-[10px]">✓ selected</span>}
            </button>
          );
        })}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`mt-1 border border-dashed rounded-lg cursor-pointer flex flex-col items-center
          justify-center py-4 px-2 gap-1.5 transition-colors text-center select-none
          ${dragging ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 hover:border-gray-500'}
          ${uploading ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
      >
        {uploading ? (
          <div className="w-full px-2 space-y-2">
            <p className="text-xs text-blue-400 text-center">
              {progress < 1 ? phaseLabel(progress) : 'Done!'}
            </p>
            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress >= 1 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 text-right font-mono">
              {Math.round(progress * 100)}%
            </p>
          </div>
        ) : (
          <>
            <span className="text-base text-gray-500">⬆</span>
            <span className="text-xs text-gray-400">Drop PDF / TXT / MD</span>
            <span className="text-xs text-gray-600">or click to browse</span>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
      </div>

      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
    </div>
  );
}
