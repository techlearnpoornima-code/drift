import { create } from 'zustand';
import type { NodeVulnerability } from '../types/report';

interface GraphStore {
  nodes: NodeVulnerability[];
  setNodes: (nodes: NodeVulnerability[]) => void;
  reset: () => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  setNodes: (nodes) => set({ nodes }),
  reset: () => set({ nodes: [] }),
}));
