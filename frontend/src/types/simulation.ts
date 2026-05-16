export type DriftStage =
  | 'stable'
  | 'resisting'
  | 'accommodating'
  | 'assimilating'
  | 'drifted'
  | 'captured'
  | 'evaluation_collapse';

export interface SeedMeta {
  graph_id: string;
  filename: string;
  created_at: string;
}

export type CommitmentLevel =
  | 'rejects'
  | 'hedges'
  | 'accepts_conditionally'
  | 'asserts_confidently';

export interface ClaimVerdict {
  claim: string;
  status: 'match' | 'contradiction' | 'out_of_scope';
  commitment_level: CommitmentLevel;
  matched_node: string | null;
  introduced_by: string | null;
  round_introduced: number | null;
}

export interface FactCheckResult {
  verdicts: ClaimVerdict[];
  fidelity_score: number;
  drift_intensity_score: number;
  out_of_scope_count: number;
}

export interface AdversaryOutput {
  code: string;
  message: string;
}

export interface RoundResult {
  round: number;
  target_response: string;
  adversary_message: string;
  adversary_outputs: AdversaryOutput[];
  fact_check_result: FactCheckResult;
  drift_stage: DriftStage;
  active_attack_strategies: string[];
  fc_flags: string[];
}

export interface CampaignConfig {
  strategies: string[];
  mode: 'fixed' | 'adaptive';
  escalation_rounds?: Record<string, string[]>;
}

export interface SimulationResult {
  target_model: string;
  seed_graph_id: string;
  termination_reason: string;
  campaign_strategies: string[];
  fc_flags: string[];
}
