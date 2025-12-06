# import pandas as pd
# import numpy as np
# import pickle
# from typing import List, Dict, Tuple
# from pathlib import Path

# from sentence_transformers import SentenceTransformer
# import faiss

# import config

# class VectorStore:
#     """Manages embeddings and vector search for RAG."""
    
#     def __init__(self):
#         print(f"Loading embedding model: {config.EMBEDDING_MODEL}")
#         self.model = SentenceTransformer(config.EMBEDDING_MODEL)
#         self.index = None
#         self.corpus = []
#         self.metadata = []
    
#     def build_corpus(self) -> List[Dict]:
#         """Build corpus from all data sources for RAG."""
#         corpus_items = []
        
#         # Add KPI definitions
#         try:
#             kpi_df = pd.read_parquet(config.KPI_TARGETS_FILE)
#             for _, row in kpi_df.iterrows():
#                 text = f"Value Stream: {row.get('value_stream', 'Unknown')} KPI: {row.get('kpi_name', 'Unknown')} Definition: {row.get('definition', '')} Current: {row.get('current_value', 'N/A')} Target: {row.get('target_value', 'N/A')}"
#                 corpus_items.append({"text": text.strip(), "type": "kpi", "vs_code": row.get("vs_code", ""), "id": f"kpi_{row.name}"})
#         except Exception as e:
#             print(f"Warning loading KPIs: {e}")
        
#         # Add findings
#         try:
#             findings_df = pd.read_parquet(config.FINDINGS_FILE)
#             for _, row in findings_df.iterrows():
#                 text = f"Finding: {row.get('title', 'Unknown')} Category: {row.get('category', 'General')} Severity: {row.get('severity', 'Medium')} Details: {row.get('detail', '')[:500]}"
#                 corpus_items.append({"text": text.strip(), "type": "finding", "vs_code": row.get("vs_code", ""), "severity": row.get("severity", ""), "id": row.get("finding_id", f"finding_{row.name}")})
#         except Exception as e:
#             print(f"Warning loading findings: {e}")
        
#         # Add pain points
#         try:
#             pp_df = pd.read_parquet(config.PAINPOINTS_FILE)
#             for _, row in pp_df.iterrows():
#                 text = f"Pain Point: {row.get('description', '')} Value Stream: {row.get('vs_code', 'Unknown')} Severity: {row.get('severity', 'Medium')}"
#                 corpus_items.append({"text": text.strip(), "type": "painpoint", "vs_code": row.get("vs_code", ""), "id": row.get("pp_id", f"pp_{row.name}")})
#         except Exception as e:
#             print(f"Warning loading painpoints: {e}")
        
#         # Add value stream descriptions
#         vs_descriptions = {
#             "O2C": "Order to Cash (O2C): From customer order to payment collection. Key KPIs: DSO, OTD, Perfect Order Rate.",
#             "P2P": "Procure to Pay (P2P): From purchase requisition to supplier payment. Key KPIs: PR to PO cycle time, 3-way match rate.",
#             "P2M": "Plan to Manufacture (P2M): From demand planning to finished goods. Key KPIs: OEE, forecast accuracy, scrap rate.",
#             "R2R": "Record to Report (R2R): From financial transactions to reporting. Key KPIs: Close cycle time, journal error rate.",
#             "H2R": "Hire to Retire (H2R): From recruitment to employee exit. Key KPIs: Time to hire, retention rate.",
#             "A2D": "Acquire to Decommission (A2D): From asset acquisition to disposal. Key KPIs: Asset utilization, CapEx variance.",
#             "R2S": "Request to Service (R2S): From service request to resolution. Key KPIs: FCR, SLA compliance.",
#             "I2M": "Idea to Market (I2M): From product innovation to market launch. Key KPIs: Time to market, prototype success rate.",
#             "DM": "Data Management: Master data governance and quality. Key focus: Business partner, material, customer data quality.",
#         }
        
#         for vs_code, desc in vs_descriptions.items():
#             corpus_items.append({"text": desc, "type": "value_stream", "vs_code": vs_code, "id": f"vs_{vs_code}"})
        
#         # Add pharma benchmarks
#         pharma_context = "Pharma Benchmarks: DSO target 45 days, OEE target 60-75%, Days to Close 5 days, On-Time Delivery 95-98%."
#         corpus_items.append({"text": pharma_context, "type": "benchmark", "vs_code": "ALL", "id": "pharma_benchmarks"})
        
#         return corpus_items
    
#     def create_embeddings(self, corpus_items: List[Dict]) -> np.ndarray:
#         """Create embeddings for all corpus items."""
#         texts = [item["text"] for item in corpus_items]
#         print(f"Creating embeddings for {len(texts)} documents...")
#         embeddings = self.model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
#         return embeddings.astype("float32")
    
#     def build_index(self):
#         """Build FAISS index from corpus."""
#         print("Building vector index...")
#         corpus_items = self.build_corpus()
#         self.corpus = [item["text"] for item in corpus_items]
#         self.metadata = corpus_items
#         embeddings = self.create_embeddings(corpus_items)
#         dim = embeddings.shape[1]
#         self.index = faiss.IndexFlatL2(dim)
#         self.index.add(embeddings)
#         print(f"Index built with {self.index.ntotal} vectors of dimension {dim}")
#         return self
    
#     def save_index(self):
#         """Save index and corpus to disk."""
#         faiss.write_index(self.index, str(config.VECTOR_INDEX_FILE))
#         print(f"Saved FAISS index to {config.VECTOR_INDEX_FILE}")
#         with open(config.CORPUS_FILE, "wb") as f:
#             pickle.dump({"corpus": self.corpus, "metadata": self.metadata}, f)
#         print(f"Saved corpus to {config.CORPUS_FILE}")
    
#     def load_index(self):
#         """Load index and corpus from disk."""
#         self.index = faiss.read_index(str(config.VECTOR_INDEX_FILE))
#         print(f"Loaded FAISS index with {self.index.ntotal} vectors")
#         with open(config.CORPUS_FILE, "rb") as f:
#             data = pickle.load(f)
#             self.corpus = data["corpus"]
#             self.metadata = data["metadata"]
#         print(f"Loaded corpus with {len(self.corpus)} documents")
#         return self
    
#     def search(self, query: str, k: int = 5, vs_filter: str = None) -> List[Dict]:
#         """Search for similar documents."""
#         query_embedding = self.model.encode([query], convert_to_numpy=True).astype("float32")
#         distances, indices = self.index.search(query_embedding, k * 2)
        
#         results = []
#         for dist, idx in zip(distances[0], indices[0]):
#             if idx < len(self.metadata):
#                 item = self.metadata[idx].copy()
#                 item["score"] = float(dist)
#                 if vs_filter and item.get("vs_code") not in [vs_filter, "ALL", "CROSS"]:
#                     continue
#                 results.append(item)
#                 if len(results) >= k:
#                     break
#         return results
    
#     def run_indexing(self):
#         """Run complete indexing pipeline."""
#         print("=" * 60)
#         print("ZeroRisk ERP Health Check - Vector Indexing")
#         print("=" * 60)
#         print("\\n1. Building corpus from all data sources...")
#         self.build_index()
#         print("\\n2. Saving index...")
#         self.save_index()
#         print("\\n" + "=" * 60)
#         print("Indexing Complete!")
#         print("=" * 60)
#         return self


# if __name__ == "__main__":
#     store = VectorStore()
#     store.run_indexing()

import pandas as pd
import numpy as np
import pickle
from typing import List, Dict, Tuple
from pathlib import Path
from openai import OpenAI

import faiss

import config


class VectorStore:
    """Manages embeddings and vector search using TCS GenAI Lab API."""
    
    def __init__(self):
        print(f"Initializing Vector Store with TCS GenAI Lab Embeddings...")
        print(f"  Embedding Model: {config.EMBEDDING_MODEL_NAME}")
        print(f"  Dimensions: {config.EMBEDDING_DIMENSIONS}")
        
        self.client = OpenAI(
            api_key=config.API_KEY,
            base_url=f"{config.API_BASE_URL}/v1"
        )
        self.embedding_model = config.EMBEDDING_MODEL_NAME
        self.embedding_dim = config.EMBEDDING_DIMENSIONS
        
        self.index = None
        self.corpus = []
        self.metadata = []
    
    def get_embeddings(self, texts: List[str], batch_size: int = 50) -> np.ndarray:
        """Get embeddings from TCS GenAI Lab API."""
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            print(f"  Embedding batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}...")
            
            try:
                response = self.client.embeddings.create(
                    model=self.embedding_model,
                    input=batch
                )
                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)
            except Exception as e:
                print(f"  Error getting embeddings: {e}")
                # Return zero vectors on error
                all_embeddings.extend([[0.0] * self.embedding_dim] * len(batch))
        
        return np.array(all_embeddings, dtype="float32")
    
    def build_corpus(self) -> List[Dict]:
        """Build corpus from all data sources for RAG."""
        corpus_items = []
        
        # Add KPI definitions
        try:
            kpi_df = pd.read_parquet(config.KPI_TARGETS_FILE)
            for _, row in kpi_df.iterrows():
                text = f"Value Stream: {row.get('value_stream', 'Unknown')} KPI: {row.get('kpi_name', 'Unknown')} Definition: {row.get('definition', '')} Current: {row.get('current_value', 'N/A')} Target: {row.get('target_value', 'N/A')}"
                corpus_items.append({"text": text.strip(), "type": "kpi", "vs_code": row.get("vs_code", ""), "id": f"kpi_{row.name}"})
        except Exception as e:
            print(f"Warning loading KPIs: {e}")
        
        # Add findings
        try:
            findings_df = pd.read_parquet(config.FINDINGS_FILE)
            for _, row in findings_df.iterrows():
                text = f"Finding: {row.get('title', 'Unknown')} Category: {row.get('category', 'General')} Severity: {row.get('severity', 'Medium')} Details: {row.get('detail', '')[:500]}"
                corpus_items.append({"text": text.strip(), "type": "finding", "vs_code": row.get("vs_code", ""), "severity": row.get("severity", ""), "id": row.get("finding_id", f"finding_{row.name}")})
        except Exception as e:
            print(f"Warning loading findings: {e}")
        
        # Add pain points
        try:
            pp_df = pd.read_parquet(config.PAINPOINTS_FILE)
            for _, row in pp_df.iterrows():
                text = f"Pain Point: {row.get('description', '')} Value Stream: {row.get('vs_code', 'Unknown')} Severity: {row.get('severity', 'Medium')}"
                corpus_items.append({"text": text.strip(), "type": "painpoint", "vs_code": row.get("vs_code", ""), "id": row.get("pp_id", f"pp_{row.name}")})
        except Exception as e:
            print(f"Warning loading painpoints: {e}")
        
        # Add value stream descriptions
        vs_descriptions = {
            "O2C": "Order to Cash (O2C): From customer order to payment collection. Key KPIs: DSO, OTD, Perfect Order Rate.",
            "P2P": "Procure to Pay (P2P): From purchase requisition to supplier payment. Key KPIs: PR to PO cycle time, 3-way match rate.",
            "P2M": "Plan to Manufacture (P2M): From demand planning to finished goods. Key KPIs: OEE, forecast accuracy, scrap rate.",
            "R2R": "Record to Report (R2R): From financial transactions to reporting. Key KPIs: Close cycle time, journal error rate.",
            "H2R": "Hire to Retire (H2R): From recruitment to employee exit. Key KPIs: Time to hire, retention rate.",
            "A2D": "Acquire to Decommission (A2D): From asset acquisition to disposal. Key KPIs: Asset utilization, CapEx variance.",
            "R2S": "Request to Service (R2S): From service request to resolution. Key KPIs: FCR, SLA compliance.",
            "I2M": "Idea to Market (I2M): From product innovation to market launch. Key KPIs: Time to market, prototype success rate.",
            "DM": "Data Management: Master data governance and quality. Key focus: Business partner, material, customer data quality.",
        }
        
        for vs_code, desc in vs_descriptions.items():
            corpus_items.append({"text": desc, "type": "value_stream", "vs_code": vs_code, "id": f"vs_{vs_code}"})
        
        # Add pharma benchmarks
        pharma_context = "Pharma Benchmarks: DSO target 45 days, OEE target 60-75%, Days to Close 5 days, On-Time Delivery 95-98%."
        corpus_items.append({"text": pharma_context, "type": "benchmark", "vs_code": "ALL", "id": "pharma_benchmarks"})
        
        return corpus_items
    
    def build_index(self):
        """Build FAISS index from corpus."""
        print("Building vector index...")
        corpus_items = self.build_corpus()
        
        if not corpus_items:
            print("Warning: No corpus items found, creating minimal index")
            corpus_items = [{"text": "No data available", "type": "info", "vs_code": "ALL", "id": "placeholder"}]
        
        self.corpus = [item["text"] for item in corpus_items]
        self.metadata = corpus_items
        
        print(f"Creating embeddings for {len(self.corpus)} documents...")
        embeddings = self.get_embeddings(self.corpus)
        
        dim = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dim)
        self.index.add(embeddings)
        print(f"Index built with {self.index.ntotal} vectors of dimension {dim}")
        return self
    
    def save_index(self):
        """Save index and corpus to disk."""
        faiss.write_index(self.index, str(config.VECTOR_INDEX_FILE))
        print(f"Saved FAISS index to {config.VECTOR_INDEX_FILE}")
        with open(config.CORPUS_FILE, "wb") as f:
            pickle.dump({"corpus": self.corpus, "metadata": self.metadata}, f)
        print(f"Saved corpus to {config.CORPUS_FILE}")
    
    def load_index(self):
        """Load index and corpus from disk."""
        self.index = faiss.read_index(str(config.VECTOR_INDEX_FILE))
        print(f"Loaded FAISS index with {self.index.ntotal} vectors")
        with open(config.CORPUS_FILE, "rb") as f:
            data = pickle.load(f)
            self.corpus = data["corpus"]
            self.metadata = data["metadata"]
        print(f"Loaded corpus with {len(self.corpus)} documents")
        return self
    
    def search(self, query: str, k: int = 5, vs_filter: str = None) -> List[Dict]:
        """Search for similar documents."""
        if self.index is None:
            return []
        
        query_embedding = self.get_embeddings([query])
        distances, indices = self.index.search(query_embedding, k * 2)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.metadata):
                item = self.metadata[idx].copy()
                item["score"] = float(dist)
                if vs_filter and item.get("vs_code") not in [vs_filter, "ALL", "CROSS"]:
                    continue
                results.append(item)
                if len(results) >= k:
                    break
        return results
    
    def run_indexing(self):
        """Run complete indexing pipeline."""
        print("=" * 60)
        print("ZeroRisk ERP Health Check - Vector Indexing")
        print("=" * 60)
        print("\\n1. Building corpus from all data sources...")
        self.build_index()
        print("\\n2. Saving index...")
        self.save_index()
        print("\\n" + "=" * 60)
        print("Indexing Complete!")
        print("=" * 60)
        return self


if __name__ == "__main__":
    store = VectorStore()
    store.run_indexing()