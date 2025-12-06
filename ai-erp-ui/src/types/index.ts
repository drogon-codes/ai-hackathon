export interface HealthScore {
  vs_code: string;
  process_health: number;
  system_health: number;
  readiness_score: number;
  value_at_stake_usd: number;
  rag_status?: string;
  kpi_count?: number;
  finding_count?: number;
  painpoint_count?: number;
}

// Model Configuration Types
export interface ModelInfo {
  name: string;
  description: string;
  available: boolean;
  requires_api_key: boolean;
  configured_model?: string;
  url?: string;
}

export interface ModelsResponse {
  models: Record<string, ModelInfo>;
  default: string;
  recommended: string;
}

// Analysis Types
export interface AnalysisRequest {
  input_directory?: string;
  create_vector_store?: boolean;
}

export interface AnalysisStatus {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  started_at?: string;
  completed_at?: string;
}

export interface AnalysisResults {
  results: any;
  generated_files: string[];
  summary: any;
}

// Report Types
export interface ReportFile {
  name: string;
  type: string;
  size: number;
  created: string;
  path: string;
}

// RAG/Query Types
export interface QueryRequest {
  query: string;
  category?: string;
  top_k?: number;
  use_rag?: boolean;
}

export interface QueryResponse {
  query: string;
  answer: string;
  category?: string;
  sources: Array<{
    index: number;
    source: string;
    category: string;
    content_preview: string;
    metadata: Record<string, any>;
  }>;
  results_count: number;
  use_rag: boolean;
}

export interface ChatResponse {
  question: string;
  answer: string;
  timestamp: string;
  status: string;
  model_used?: string;
  sources_count?: number;
}

// Upload Types
export interface UploadResponse {
  message: string;
  filename: string;
  size: number;
  path: string;
}

// Statistics Types
export interface SystemStatistics {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  running_jobs: number;
  vector_store?: {
    collection_name: string;
    persist_directory: string;
    document_count: number;  // Changed from total_documents to document_count
  };
}

// Health Check Types
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  pipeline_initialized: boolean;
}