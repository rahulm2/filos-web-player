export interface PlaybackPlan {
  recipe: {
    title: string;
    creator: string;
    creator_photo_url: string;
    recipe_photo_url: string;
    audio_url: string;
    total_duration_seconds: number;
    estimated_active_minutes: number;
    serves: string;
    tags: string[];
  };
  phases: Phase[];
  ingredients: Ingredient[];
  substitutions: Substitution[];
  equipment: string[];
}

export interface Phase {
  phase_number: number;
  phase_name: string;
  steps: Step[];
}

export interface Step {
  step_id: string;
  step_label: string;
  instruction?: string;
  pacing: "gated" | "auto";
  core_chunks: Chunk[];
  gate?: GateConfig;
}

export interface Chunk {
  chunk_id: string;
  start_time: number;
  end_time: number;
  transcript_preview?: string;
}

export interface GateConfig {
  cascade: CascadeEntry[];
}

export type CascadeEntry =
  | { type: "silence"; duration_seconds: number }
  | { type: "heartbeat"; chunk?: Chunk; fallback_message: string }
  | { type: "elastic"; chunk: Chunk; relevance_label?: string };

export interface Ingredient {
  name: string;
  quantity: string;
}

export interface Substitution {
  ingredient: string;
  substitute: string;
}

export type PacingState =
  | "LOADING"
  | "PLAYING"
  | "SEAM"
  | "WAITING"
  | "PHASE_GATE"
  | "PAUSED"
  | "COMPLETE";

export type PacingAction =
  | { type: "START" }
  | { type: "CHUNK_END" }
  | { type: "SEAM_ELAPSED" }
  | { type: "ADVANCE" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "GO_BACK" }
  | { type: "REPEAT" };
