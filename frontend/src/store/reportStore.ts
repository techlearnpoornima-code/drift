import { create } from 'zustand';
import type { RobustnessReport } from '../types/report';

interface ReportStore {
  report: RobustnessReport | null;
  loading: boolean;
  setReport: (r: RobustnessReport) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  report: null,
  loading: false,
  setReport: (r) => set({ report: r, loading: false }),
  setLoading: (v) => set({ loading: v }),
  reset: () => set({ report: null, loading: false }),
}));
