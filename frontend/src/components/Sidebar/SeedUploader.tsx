import { useRef, useEffect } from 'react';
import { uploadSeed } from '../../api/seed';
import { useSimStore } from '../../store/simStore';

const STAGE_LABELS: { until: number; label: string }[] = [
  { until: 15, label: 'Uploading file…' },
  { until: 30, label: 'Chunking document…' },
  { until: 55, label: 'Sending to knowledge graph…' },
  { until: 85, label: 'Waiting for graph extraction…' },
  { until: 95, label: 'Almost there…' },
];

function getLabel(pct: number): string {
  for (const s of STAGE_LABELS) {
    if (pct < s.until) return s.label;
  }
  return 'Finalising…';
}

export function SeedUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    uploadStatus, uploadFilename, uploadProgress,
    setUploading, setUploadDone, setUploadError, resetUpload,
  } = useSimStore();

  // Animate progress bar — interval writes to store so it survives unmount/remount
  useEffect(() => {
    if (uploadStatus !== 'uploading') return;
    const id = setInterval(() => {
      useSimStore.setState((s) => {
        if (s.uploadProgress >= 95) return s;
        const step = s.uploadProgress < 30 ? 3 : s.uploadProgress < 60 ? 1.5 : 0.6;
        return { uploadProgress: Math.min(s.uploadProgress + step, 95) };
      });
    }, 800);
    return () => clearInterval(id);
  }, [uploadStatus]);

  const handleFile = async (file: File) => {
    setUploading(file.name);
    try {
      const { sim_id, seed_graph_id } = await uploadSeed(file);
      setUploadDone(sim_id, seed_graph_id, file.name);
    } catch {
      setUploadError();
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Seed Document</p>

      {uploadStatus === 'uploading' ? (
        <div className="space-y-2 px-1">
          <p className="text-xs text-gray-300 truncate">{uploadFilename}</p>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-all duration-700"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-blue-400">{getLabel(uploadProgress)}</p>
          <p className="text-xs text-gray-500">Graph extraction takes 30–120 s</p>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => uploadStatus !== 'done' && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            uploadStatus === 'done'
              ? 'border-green-600 cursor-default'
              : 'border-gray-600 cursor-pointer hover:border-blue-500'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.md"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFile(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
          {uploadStatus === 'idle' && (
            <p className="text-sm text-gray-400">Drop .pdf / .txt / .md</p>
          )}
          {uploadStatus === 'done' && (
            <div className="space-y-1">
              <p className="text-sm text-green-400 truncate">✓ {uploadFilename}</p>
              <p className="text-xs text-gray-500">Graph ready</p>
              <button
                onClick={(e) => { e.stopPropagation(); resetUpload(); }}
                className="text-xs text-gray-500 underline hover:text-gray-300"
              >
                Upload different file
              </button>
            </div>
          )}
          {uploadStatus === 'error' && (
            <p className="text-sm text-red-400">Upload failed — try again</p>
          )}
        </div>
      )}
    </div>
  );
}
