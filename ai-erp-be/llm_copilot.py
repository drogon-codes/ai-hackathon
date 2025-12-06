import pandas as pd
from typing import List, Dict, Optional
from openai import OpenAI

import config
from vector_store import VectorStore


class LLMCopilot:
    """AI Copilot powered by TCS GenAI Lab API."""
    
    def __init__(self):
        print(f"Initializing TCS GenAI Lab client...")
        print(f"  API Base URL: {config.API_BASE_URL}")
        print(f"  LLM Model: {config.LLM_MODEL_NAME}")
        
        self.client = OpenAI(
            api_key=config.API_KEY,
            base_url=f"{config.API_BASE_URL}/v1"
        )
        self.model = config.LLM_MODEL_NAME
        
        self.vector_store = None
        self.health_scores = None
        self.conversation_history = []
        
    def initialize(self):
        """Initialize the copilot with data."""
        print("Initializing LLM Copilot...")
        self.vector_store = VectorStore()
        try:
            self.vector_store.load_index()
        except:
            print("Building new vector index...")
            self.vector_store.run_indexing()
        
        try:
            self.health_scores = pd.read_parquet(config.HEALTH_SCORES_FILE)
        except:
            print("Warning: Health scores not found")
            self.health_scores = pd.DataFrame()
        
        print("Copilot initialized!")
        return self
    
    def get_health_context(self, vs_code: str = None) -> str:
        """Get health scores context for prompt."""
        if self.health_scores is None or len(self.health_scores) == 0:
            return "Health scores data not available."
        
        df = self.health_scores[self.health_scores["vs_code"] == vs_code] if vs_code else self.health_scores
        if len(df) == 0:
            return f"No health scores found for {vs_code}."
        
        context = "Current Health Scores:\\n"
        for _, row in df.iterrows():
            context += f"- {row['vs_code']}: Process Health: {row['process_health']:.1f}/100, System Health: {row['system_health']:.1f}/100, Readiness: {row['readiness_score']:.1f}/100, Status: {row['rag_status']}, Value at Stake: ${row['value_at_stake_usd']:,.0f}\\n"
        return context
    
    def build_system_prompt(self) -> str:
        """Build the system prompt for the LLM."""
        return """You are an expert Enterprise Architect Copilot specializing in SAP S/4HANA transformations and ERP health assessments. Help architects understand:
1. Health Check Findings: Explain Red/Amber/Green status
2. KPI Gaps: Analyze current vs target and business impact
3. Risk Assessment: Identify security, performance, compliance risks
4. Value Drivers: Quantify improvements and ROI
5. Recommendations: Provide actionable remediation steps

Always cite specific evidence (KPIs, findings, benchmarks). Be concise but thorough."""

    def retrieve_context(self, query: str, vs_code: str = None, k: int = 5) -> str:
        """Retrieve relevant context from vector store."""
        if self.vector_store is None:
            return "Vector store not initialized."
        results = self.vector_store.search(query, k=k, vs_filter=vs_code)
        if not results:
            return "No relevant context found."
        
        context = "Relevant Information:\\n\\n"
        for i, item in enumerate(results, 1):
            context += f"[Source {i} - {item['type'].upper()}]\\n{item['text'][:800]}\\n\\n"
        return context
    
    def ask(self, question: str, vs_code: str = None, include_history: bool = True) -> Dict:
        """Ask a question to the copilot."""
        rag_context = self.retrieve_context(question, vs_code)
        health_context = self.get_health_context(vs_code)
        
        user_prompt = f"{health_context}\\n\\n{rag_context}\\n\\nUser Question: {question}\\n\\nProvide a detailed, actionable response with specific evidence and recommendations."
        
        messages = [{"role": "system", "content": self.build_system_prompt()}]
        
        if include_history and self.conversation_history:
            messages.extend(self.conversation_history[-6:])
        
        messages.append({"role": "user", "content": user_prompt})
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=2000,
                temperature=0.7,
                messages=messages
            )
            answer = response.choices[0].message.content
            
            self.conversation_history.append({"role": "user", "content": question})
            self.conversation_history.append({"role": "assistant", "content": answer})
            
            return {
                "answer": answer, 
                "vs_code": vs_code, 
                "sources_used": len(self.vector_store.search(question, k=5)) if self.vector_store else 0, 
                "model": self.model
            }
        except Exception as e:
            error_msg = f"Error calling TCS GenAI Lab API: {str(e)}"
            print(f"LLM Error: {error_msg}")
            return {"answer": error_msg, "error": True}
    
    def get_executive_summary(self) -> str:
        """Generate executive summary."""
        question = "Provide an executive summary: 1) Overall readiness assessment 2) Top 3 value streams needing attention 3) Quick wins 4) Critical risks 5) Next steps"
        return self.ask(question).get("answer", "Unable to generate summary")
    
    def get_value_stream_analysis(self, vs_code: str) -> str:
        """Get detailed analysis for a value stream."""
        question = f"Analyze {vs_code}: 1) Health status 2) KPI gaps 3) Critical findings 4) Pain points 5) Recommendations 6) S/4HANA considerations"
        return self.ask(question, vs_code=vs_code).get("answer", "Unable to generate analysis")
    
    def clear_history(self):
        """Clear conversation history."""
        self.conversation_history = []
    
    def test_connection(self) -> Dict:
        """Test LLM connection with a simple query."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=50,
                messages=[{"role": "user", "content": "Say hello in one sentence."}]
            )
            return {
                "success": True,
                "api_base": config.API_BASE_URL,
                "model": self.model,
                "response": response.choices[0].message.content
            }
        except Exception as e:
            return {
                "success": False,
                "api_base": config.API_BASE_URL,
                "model": self.model,
                "error": str(e)
            }


# Backward compatibility alias
ClaudeCopilot = LLMCopilot


if __name__ == "__main__":
    copilot = LLMCopilot()
    
    # Test connection first
    print("\\nTesting TCS GenAI Lab connection...")
    test_result = copilot.test_connection()
    print(f"Connection test: {test_result}")
    
    if test_result["success"]:
        copilot.initialize()
        result = copilot.ask("What are the top risks in Order to Cash?", vs_code="O2C")
        print(result.get("answer", "No answer"))
    else:
        print(f"Failed to connect: {test_result.get('error')}")