# import os
# from pathlib import Path

# # ===== API Keys =====
# ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "sk-46mjarqYhjlDtDiJ8Uw3pw")

# # ===== File Paths =====
# BASE_DIR = Path(__file__).parent
# DATA_DIR = BASE_DIR / "data"
# RAW_DIR = DATA_DIR / "raw"
# CURATED_DIR = DATA_DIR / "curated"
# VECTOR_DIR = DATA_DIR / "vectors"

# # Create directories if not exist
# for d in [DATA_DIR, RAW_DIR, CURATED_DIR, VECTOR_DIR]:
#     d.mkdir(parents=True, exist_ok=True)

# # ===== Input Files =====
# ERP_HEALTHCHECK_FILE = RAW_DIR / "ERP-usage-exports-ECCS4-line-of-business-pain-points-prior-SAP-health-check-audit-reports.docx"
# CRYSTALLUS_KPI_FILE = RAW_DIR / "TCS-Crystallus-Process-Insights-KPIs-process-flows.xlsx"
# VALUE_STREAMS_FILE = RAW_DIR / "Business-Value-Streams.docx"
# S4HANA_SIMPLIFICATION_FILE = RAW_DIR / "S4HANA-2023-simplification-item-references.pdf"
# PHARMA_BENCHMARKS_FILE = RAW_DIR / "Sector-Pharma-benchmarks-and-transformation-value-drivers.docx"

# # ===== Output Files =====
# KPI_TARGETS_FILE = CURATED_DIR / "kpi_targets.parquet"
# FINDINGS_FILE = CURATED_DIR / "system_findings.parquet"
# PAINPOINTS_FILE = CURATED_DIR / "painpoints.parquet"
# HEALTH_SCORES_FILE = CURATED_DIR / "health_scores.parquet"
# VECTOR_INDEX_FILE = VECTOR_DIR / "faiss_index.bin"
# CORPUS_FILE = VECTOR_DIR / "corpus.pkl"

# # ===== Model Settings =====
# EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
# CLAUDE_MODEL = "deepseek-chat"
# # LLM_PROVIDER = "deepseek"
# # DEEPSEEK_MODEL = "deepseek-chat"

# # ===== Scoring Weights =====
# PROCESS_HEALTH_WEIGHT = 0.4
# SYSTEM_HEALTH_WEIGHT = 0.3
# READINESS_WEIGHT = 0.3

# # ===== Value Stream Mapping =====
# VALUE_STREAM_CODES = {
#     "Order to Cash (O2C)": "O2C",
#     "Procure to Pay (P2P)": "P2P",
#     "Plan to Manufacture (P2M)": "P2M",
#     "Record to Report (R2R)": "R2R",
#     "Hire to Retire (H2R)": "H2R",
#     "Acquire to Decommission (A2D)": "A2D",
#     "Request to Service (R2S)": "R2S",
#     "Idea to Market (I2M)": "I2M",
#     "Initiate (Project) to Close (I2C)": "I2C",
#     "Data Management": "DM",
#     "Others": "OTH"
# }

# # ===== Risk Categories =====
# RISK_CATEGORIES = ["Security", "Performance", "Data Quality", "Customization", "Compliance", "Integration", "Infrastructure"]

# # ===== Severity Levels =====
# SEVERITY_LEVELS = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}

import os
from pathlib import Path

# ===== TCS GenAI Lab API Configuration =====
def get_pipeline_config():
    return {
        "TIKTOKEN_CACHE_DIR": os.getenv("TIKTOKEN_CACHE_DIR", "./cache/token"),
        "VECTOR_DB_PATH": os.getenv("VECTOR_DB_PATH", "./data/vector_store"),
        "API_BASE_URL": os.getenv("API_BASE_URL", "https://genailab.tcs.in"),
        "API_MODEL_NAME": os.getenv("API_MODEL_NAME", "azure/genailab-maas-text-embedding-3-large"),
        "API_KEY": os.getenv("OPENAI_API_KEY", "sk-46mjarqYhjlDtDiJ8Uw3pw"), 
        "EMBEDDING_DIMENSIONS": int(os.getenv("EMBEDDING_DIMENSIONS", 3072)),
        "CHUNK_SIZE": 1024,
        "CHUNK_OVERLAP": 200
    }

# Load pipeline config
PIPELINE_CONFIG = get_pipeline_config()

# ===== LLM Configuration =====
API_BASE_URL = PIPELINE_CONFIG["API_BASE_URL"]
API_KEY = PIPELINE_CONFIG["API_KEY"]
EMBEDDING_MODEL_NAME = PIPELINE_CONFIG["API_MODEL_NAME"]
EMBEDDING_DIMENSIONS = PIPELINE_CONFIG["EMBEDDING_DIMENSIONS"]

# LLM Chat Model - Update this based on your available models
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "azure/genailab-maas-gpt-4o")  # or your chat model

# ===== File Paths =====
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
CURATED_DIR = DATA_DIR / "curated"
VECTOR_DIR = DATA_DIR / "vectors"
CACHE_DIR = BASE_DIR / "cache" / "token"

for d in [DATA_DIR, RAW_DIR, CURATED_DIR, VECTOR_DIR, CACHE_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Set tiktoken cache
os.environ["TIKTOKEN_CACHE_DIR"] = str(CACHE_DIR)

# ===== Input Files =====
ERP_HEALTHCHECK_FILE = RAW_DIR / "ERP usage exports (ECCS4), line-of-business pain points, prior SAP health check audit reports.docx"
CRYSTALLUS_KPI_FILE = RAW_DIR / "TCS Crystallus Process Insights (KPIs, process flows).xlsx"
VALUE_STREAMS_FILE = RAW_DIR / "Business Value Streams.docx"
S4HANA_SIMPLIFICATION_FILE = RAW_DIR / "S4HANA 2023 simplification item references.pdf"
PHARMA_BENCHMARKS_FILE = RAW_DIR / "Sector Pharma benchmarks and transformation value drivers.docx"

# ===== Output Files =====
KPI_TARGETS_FILE = CURATED_DIR / "kpi_targets.parquet"
FINDINGS_FILE = CURATED_DIR / "system_findings.parquet"
PAINPOINTS_FILE = CURATED_DIR / "painpoints.parquet"
HEALTH_SCORES_FILE = CURATED_DIR / "health_scores.parquet"
VECTOR_INDEX_FILE = VECTOR_DIR / "faiss_index.bin"
CORPUS_FILE = VECTOR_DIR / "corpus.pkl"

# ===== Chunking Config =====
CHUNK_SIZE = PIPELINE_CONFIG["CHUNK_SIZE"]
CHUNK_OVERLAP = PIPELINE_CONFIG["CHUNK_OVERLAP"]

# ===== Scoring Weights =====
PROCESS_HEALTH_WEIGHT = 0.4
SYSTEM_HEALTH_WEIGHT = 0.3
READINESS_WEIGHT = 0.3

# ===== Value Stream Mapping =====
VALUE_STREAM_CODES = {
    "Order to Cash (O2C)": "O2C",
    "Procure to Pay (P2P)": "P2P",
    "Plan to Manufacture (P2M)": "P2M",
    "Record to Report (R2R)": "R2R",
    "Hire to Retire (H2R)": "H2R",
    "Acquire to Decommission (A2D)": "A2D",
    "Request to Service (R2S)": "R2S",
    "Idea to Market (I2M)": "I2M",
    "Data Management": "DM",
}

RISK_CATEGORIES = ["Security", "Performance", "Data Quality", "Customization", "Compliance", "Integration", "Infrastructure"]
SEVERITY_LEVELS = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}