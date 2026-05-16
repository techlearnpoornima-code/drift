import client from './client';
import type { RoundResult, CampaignConfig, SimulationResult } from '../types/simulation';

export interface RunSimRequest {
  sim_id: string;
  seed_graph_id: string;
  max_rounds?: number;
  target_model?: string;
  campaign: CampaignConfig;
}

export interface SimStatus {
  sim_id: string;
  status: 'pending' | 'running' | 'terminated';
  round: number;
  drift_stage?: string;
  fidelity_score?: number;
  termination_reason?: string;
}

export async function runSimulation(req: RunSimRequest): Promise<{ sim_id: string }> {
  const res = await client.post<{ sim_id: string }>('/api/sim/run', req);
  return res.data;
}

export async function getEvents(simId: string, afterRound = 0): Promise<RoundResult[]> {
  const res = await client.get<RoundResult[]>(`/api/sim/${simId}/events`, {
    params: { after_round: afterRound },
  });
  return res.data;
}

export async function getStatus(simId: string): Promise<SimStatus> {
  const res = await client.get<SimStatus>(`/api/sim/${simId}/status`);
  return res.data;
}

export async function getResult(simId: string): Promise<SimulationResult> {
  const res = await client.get<SimulationResult>(`/api/sim/${simId}/result`);
  return res.data;
}
