import client from './client';
import type { RobustnessReport } from '../types/report';

export async function getReport(simId: string): Promise<RobustnessReport> {
  const res = await client.get<RobustnessReport>(`/api/report/${simId}`);
  return res.data;
}

export async function compareReports(simIds: string[]): Promise<Record<string, unknown>> {
  const res = await client.get('/api/compare', {
    params: { sim_ids: simIds.join(',') },
  });
  return res.data;
}
