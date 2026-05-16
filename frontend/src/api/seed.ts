import client from './client';
import type { SeedMeta } from '../types/simulation';

export interface UploadSeedResponse {
  sim_id: string;
  seed_graph_id: string;
  filename: string;
}

export async function uploadSeed(file: File): Promise<UploadSeedResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post<UploadSeedResponse>('/api/seed/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function listSeeds(): Promise<SeedMeta[]> {
  const res = await client.get<SeedMeta[]>('/api/seed/seeds');
  return res.data;
}
