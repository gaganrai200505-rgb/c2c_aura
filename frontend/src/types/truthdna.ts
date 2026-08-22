// types/truthdna.ts — TruthDNA TypeScript interfaces matching backend Pydantic schema

export type SignalStatus = "Clean" | "Suspicious" | "Altered";

export interface ForensicSignal {
  dimension: string;
  status: SignalStatus;
  finding: string;
  source_url?: string | null;
  media_timestamp?: string | null;
}

export interface DigitalGenome {
  visual_phash?: string | null;
  semantic_vector?: number[] | null;
  acoustic_vector?: number[] | null;
}

export interface MediaDNAReport {
  digital_genome: DigitalGenome;
  lineage_match_found: boolean;
  forensic_evidence: ForensicSignal[];
  weighting_rationale: string;
  confidence_breakdown: Record<string, number>;
  explicit_uncertainties: string[];
  shareable_context_card: string;
}

export type AnalysisState =
  | { phase: "idle" }
  | { phase: "uploading" }
  | { phase: "analyzing" }
  | { phase: "complete"; report: MediaDNAReport }
  | { phase: "error"; message: string };
