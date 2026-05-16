export interface DualTrajectoryPoint {
  round: number;
  fidelity_score: number;
  drift_intensity_score: number;
  drift_stage: string;
}

export interface NodeVulnerability {
  node: string;
  total_contradictions: number;
  first_contradiction_round: number;
  attack_codes: string[];
  vulnerability_score: number;
}

export interface AttackEffectiveness {
  [attack_code: string]: number;
}

export interface RobustnessReport {
  sim_id: string;
  target_model: string;
  seed_graph_id: string;
  termination_reason: string;
  total_rounds: number;
  final_drift_stage: string;
  campaign_strategies: string[];
  fc_flags: string[];
  frame_drift_point: number | null;
  assimilation_point: number | null;
  factual_collapse_point: number | null;
  recovery_count: number;
  failure_modes: string[];
  hardening_recommendations: string[];
  dual_trajectory: DualTrajectoryPoint[];
  node_vulnerabilities: NodeVulnerability[];
  attack_effectiveness: AttackEffectiveness;
}
