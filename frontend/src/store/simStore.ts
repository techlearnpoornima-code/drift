import { create } from 'zustand';
import type { RoundResult, DriftStage, SeedMeta } from '../types/simulation';

export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

interface SimStore {
  simId: string;
  seedGraphId: string;
  setSeed: (simId: string, seedGraphId: string) => void;

  seeds: SeedMeta[];
  selectedSeedGraphId: string;
  selectedFilename: string;
  setSeeds: (seeds: SeedMeta[]) => void;
  selectSeed: (graphId: string, filename: string) => void;

  uploadStatus: UploadStatus;
  uploadFilename: string;
  uploadProgress: number;
  setUploading: (filename: string) => void;
  setUploadProgress: (progress: number) => void;
  setUploadDone: (simId: string, seedGraphId: string, filename: string) => void;
  setUploadError: () => void;
  resetUpload: () => void;

  isRunning: boolean;
  isTerminated: boolean;
  terminationReason: string;
  setRunning: (v: boolean) => void;
  setTerminated: (reason: string) => void;

  rounds: RoundResult[];
  latestRound: number;
  currentDriftStage: DriftStage | null;
  currentFidelity: number;
  addRounds: (newRounds: RoundResult[]) => void;

  reset: () => void;
}

export const useSimStore = create<SimStore>((set) => ({
  simId: '',
  seedGraphId: '',
  setSeed: (simId, seedGraphId) => set({ simId, seedGraphId }),

  seeds: [],
  selectedSeedGraphId: '',
  selectedFilename: '',
  setSeeds: (seeds) => set({ seeds }),
  selectSeed: (graphId, filename) => set({ selectedSeedGraphId: graphId, selectedFilename: filename, seedGraphId: graphId }),

  uploadStatus: 'idle',
  uploadFilename: '',
  uploadProgress: 0,
  setUploading: (filename) => set({ uploadStatus: 'uploading', uploadFilename: filename, uploadProgress: 0 }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setUploadDone: (simId, seedGraphId, filename) =>
    set({ uploadStatus: 'done', uploadProgress: 100, simId, seedGraphId, uploadFilename: filename }),
  setUploadError: () => set({ uploadStatus: 'error', uploadProgress: 0 }),
  resetUpload: () => set({ uploadStatus: 'idle', uploadFilename: '', uploadProgress: 0, simId: '', seedGraphId: '' }),

  isRunning: false,
  isTerminated: false,
  terminationReason: '',
  setRunning: (v) => set({ isRunning: v }),
  setTerminated: (reason) =>
    set({ isRunning: false, isTerminated: true, terminationReason: reason }),

  rounds: [],
  latestRound: 0,
  currentDriftStage: null,
  currentFidelity: 1,
  addRounds: (newRounds) =>
    set((state) => {
      const updated = [...state.rounds, ...newRounds];
      const last = newRounds[newRounds.length - 1];
      return {
        rounds: updated,
        latestRound: last?.round ?? state.latestRound,
        currentDriftStage: last?.drift_stage ?? state.currentDriftStage,
        currentFidelity: last?.fact_check_result?.fidelity_score ?? state.currentFidelity,
      };
    }),

  reset: () =>
    set({
      isRunning: false,
      isTerminated: false,
      terminationReason: '',
      rounds: [],
      latestRound: 0,
      currentDriftStage: null,
      currentFidelity: 1,
    }),
}));
