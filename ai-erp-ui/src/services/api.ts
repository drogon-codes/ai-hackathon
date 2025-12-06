// src/services/api.ts
import { HealthScore, ModelInfo, ModelsResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

export type { ModelInfo };

export interface ValueStream {
  code: string;
  name: string;
}

export interface ValueStreamsResponse {
  value_streams: ValueStream[];
}

export type RagStatus = 'Red' | 'Amber' | 'Green' | 'Yellow';

export interface ValueStreamMetrics {
  vs_code: string;
  process_health: number;
  system_health: number;
  readiness_score: number;
  value_at_stake_usd: number;
  rag_status: 'Red' | 'Yellow' | 'Green' | 'Amber' | string; // Updated to include 'Yellow'
  kpi_count: number;
  finding_count: number;
  painpoint_count: number;
}

// Fetch all value streams
export const fetchValueStreams = async (): Promise<ValueStream[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/value-streams/`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch value streams');
    }
    
    const data: ValueStreamsResponse = await response.json();
    return data.value_streams || []; // Extract the value_streams array
  } catch (error) {
    console.error('Error fetching value streams:', error);
    return [];
  }
};
// In src/services/api.ts
export const fetchHealthScores = async (vsCode: string | null): Promise<HealthScore[]> => {
  try {
    const url = vsCode 
      ? `${API_BASE_URL}/health-scores/${vsCode}`  // Changed from /?vs_code= to /{code}
      : `${API_BASE_URL}/health-scores/`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch health scores');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data]; // Handle both array and single object responses
  } catch (error) {
    console.error('Error fetching health scores:', error);
    throw error;
  }
};

// In api.ts
export interface KPI {
  vs_code: string;
  kpi_name: string;
  current_value: string;  // Changed to string to handle percentage values
  target_value: string;   // Changed to string to handle percentage values
  definition: string;
  target_direction: 'higher' | 'lower';
  current_numeric: number | null;
  target_numeric: number | null;
}

// Add this function to api.ts
// In api.ts
export const fetchKPIs = async (vsCode: string): Promise<KPI[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/kpis?vs_code=${vsCode}`);
    if (!response.ok) {
      throw new Error('Failed to fetch KPIs');
    }
    const data = await response.json();
    // Handle the nested kpis array in the response
    return Array.isArray(data.kpis) ? data.kpis : [];
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return []; // Return empty array on error
  }
};

// ============================================
// RAG API ENDPOINTS
// ============================================

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

export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  question: string;
  answer: string;
  timestamp: string;
}

export interface BatchQueryRequest {
  queries: string[];
  category?: string;
}

export interface BatchQueryResponse {
  queries_count: number;
  results: Array<{
    question: string;
    answer: string;
    sources?: any[];
    error?: boolean;
  }>;
  timestamp: string;
}

// Fetch available AI models
export const fetchAvailableModels = async (): Promise<ModelsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch available models');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching models:', error);
    // Return default fallback
    return {
      models: {
        'vector-search': {
          name: 'Vector Search Only',
          description: 'Fast similarity search without LLM',
          available: true,
          requires_api_key: false
        }
      },
      default: 'vector-search',
      recommended: 'vector-search'
    };
  }
};

// Query knowledge base with RAG
export const queryKnowledgeBase = async (request: QueryRequest): Promise<QueryResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to query knowledge base');
    }

    return await response.json();
  } catch (error) {
    console.error('Error querying knowledge base:', error);
    throw error;
  }
};

// Simple chat interface
export const sendChatMessage = async (
  question: string, 
  model: string = 'vector-search',
  useLLM: boolean = false
): Promise<ChatResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({ 
        question,
        model,
        use_llm: useLLM
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to send chat message');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

// Batch query
export const batchQuery = async (queries: string[], category?: string): Promise<BatchQueryResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/batch-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({ queries, category }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to execute batch query');
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing batch query:', error);
    throw error;
  }
};

// ============================================
// ANALYSIS API ENDPOINTS
// ============================================

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

// Start analysis job
export const startAnalysis = async (request: AnalysisRequest = {}): Promise<AnalysisStatus> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        input_directory: request.input_directory || './data/input',
        create_vector_store: request.create_vector_store ?? true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to start analysis');
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting analysis:', error);
    throw error;
  }
};

// Get analysis status
export const getAnalysisStatus = async (jobId: string): Promise<AnalysisStatus> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/status/${jobId}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to get analysis status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting analysis status:', error);
    throw error;
  }
};

// Get analysis results
export const getAnalysisResults = async (jobId: string): Promise<AnalysisResults> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/results/${jobId}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to get analysis results');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting analysis results:', error);
    throw error;
  }
};

// Delete analysis job
export const deleteAnalysisJob = async (jobId: string): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete job');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};

// ============================================
// REPORTS & VISUALIZATIONS API ENDPOINTS
// ============================================

export interface ReportFile {
  name: string;
  type: string;
  size: number;
  created: string;
  path: string;
}

export interface ReportsListResponse {
  reports: ReportFile[];
  count: number;
  message?: string;
}

// List all reports and visualizations
export const listReports = async (): Promise<ReportsListResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/reports`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to list reports');
    }

    return await response.json();
  } catch (error) {
    console.error('Error listing reports:', error);
    throw error;
  }
};

// Download visualization file
export const downloadVisualization = async (filename: string): Promise<Blob> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/visualizations/${filename}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to download file');
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading visualization:', error);
    throw error;
  }
};

// Get visualization URL
export const getVisualizationUrl = (filename: string): string => {
  return `${API_BASE_URL}/v1/visualizations/${filename}`;
};

// ============================================
// UPLOAD API ENDPOINTS
// ============================================

export interface UploadResponse {
  message: string;
  filename: string;
  size: number;
  path: string;
}

// Upload file for analysis
export const uploadFile = async (file: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/v1/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to upload file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// ============================================
// STATISTICS API ENDPOINTS
// ============================================

export interface SystemStatistics {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  running_jobs: number;
  vector_store?: {
    total_documents: number;
    total_chunks: number;
    embedding_model: string;
    collection_name: string;
    persist_directory: string;
    document_count: number;  // Changed from total_documents to document_count
  };
}

// Get system statistics
export const getStatistics = async (): Promise<SystemStatistics> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/statistics`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to get statistics');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw error;
  }
};

// ============================================
// HEALTH & CONFIG API ENDPOINTS
// ============================================

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  pipeline_initialized: boolean;
}

export interface ConfigResponse {
  model: any;
  vector_store: any;
  analysis: any;
  visualization: any;
}

// Health check
export const healthCheck = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await fetch(`http://localhost:8000/health`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
};

// Get configuration
export const getConfiguration = async (): Promise<ConfigResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/config`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to get configuration');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting configuration:', error);
    throw error;
  }
};