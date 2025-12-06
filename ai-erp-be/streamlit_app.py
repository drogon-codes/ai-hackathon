import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import requests
from typing import Optional

import config

# Page Config
st.set_page_config(page_title="ZeroRisk ERP Health Check", page_icon="🏥", layout="wide")

# Custom CSS
st.markdown("""
<style>
    .main-header { font-size: 2.5rem; font-weight: bold; color: #1f4e79; margin-bottom: 1rem; }
    .status-green { color: #28a745; font-weight: bold; }
    .status-amber { color: #ffc107; font-weight: bold; }
    .status-red { color: #dc3545; font-weight: bold; }
    .chat-message { padding: 1rem; border-radius: 10px; margin: 0.5rem 0; }
    .user-message { background-color: #e3f2fd; }
    .assistant-message { background-color: #f5f5f5; }
</style>
""", unsafe_allow_html=True)

API_BASE_URL = "http://localhost:8000"

def get_status_color(status: str) -> str:
    return {"Green": "#28a745", "Amber": "#ffc107", "Red": "#dc3545"}.get(status, "#6c757d")

def load_health_scores() -> pd.DataFrame:
    try:
        response = requests.get(f"{API_BASE_URL}/api/health-scores", timeout=5)
        if response.status_code == 200:
            return pd.DataFrame(response.json())
    except:
        pass
    try:
        return pd.read_parquet(config.HEALTH_SCORES_FILE)
    except:
        return pd.DataFrame()

def load_kpis(vs_code: str = None) -> pd.DataFrame:
    try:
        url = f"{API_BASE_URL}/api/kpis" + (f"?vs_code={vs_code}" if vs_code else "")
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return pd.DataFrame(response.json()["kpis"])
    except:
        pass
    try:
        df = pd.read_parquet(config.KPI_TARGETS_FILE)
        return df[df["vs_code"] == vs_code] if vs_code else df
    except:
        return pd.DataFrame()

def ask_copilot(question: str, vs_code: str = None) -> str:
    try:
        response = requests.post(f"{API_BASE_URL}/api/ask", json={"question": question, "vs_code": vs_code}, timeout=60)
        if response.status_code == 200:
            return response.json()["answer"]
    except Exception as e:
        return f"Error: {str(e)}"
    return "Unable to get response."

# Session State
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "selected_vs" not in st.session_state:
    st.session_state.selected_vs = None

# Sidebar
with st.sidebar:
    st.markdown("## 🏥 ERP Health Check")
    st.markdown("---")
    page = st.radio("Navigate:", ["📊 Dashboard", "🔍 Value Stream Analysis", "🤖 AI Copilot", "📋 KPI Explorer"])
    st.markdown("---")
    
    health_df = load_health_scores()
    if len(health_df) > 0:
        vs_options = ["All"] + sorted(health_df["vs_code"].unique().tolist())
        selected = st.selectbox("Filter Value Stream:", vs_options)
        st.session_state.selected_vs = None if selected == "All" else selected
    
    st.markdown("---")
    st.markdown("**Powered by Claude AI**")

# Main Content
st.markdown('<p class="main-header">🏥 ZeroRisk ERP Modernization Health Check</p>', unsafe_allow_html=True)
health_df = load_health_scores()

# Dashboard Page
if page == "📊 Dashboard":
    st.markdown("## Overall Health Dashboard")
    
    if len(health_df) == 0:
        st.warning("No health scores available. Run: python main.py setup")
    else:
        display_df = health_df if not st.session_state.selected_vs else health_df[health_df["vs_code"] == st.session_state.selected_vs]
        
        # Metrics
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Avg Process Health", f"{display_df['process_health'].mean():.1f}/100")
        col2.metric("Avg System Health", f"{display_df['system_health'].mean():.1f}/100")
        col3.metric("Avg Readiness", f"{display_df['readiness_score'].mean():.1f}/100")
        col4.metric("Value at Stake", f"${display_df['value_at_stake_usd'].sum():,.0f}")
        
        st.markdown("---")
        
        # Heatmap
        st.markdown("### 🌡️ Value Stream Health Heatmap")
        heatmap_data = display_df[["vs_code", "process_health", "system_health", "readiness_score"]].set_index("vs_code")
        fig = px.imshow(heatmap_data.T, labels=dict(x="Value Stream", y="Metric", color="Score"),
                        color_continuous_scale="RdYlGn", zmin=0, zmax=100)
        fig.update_layout(height=300)
        st.plotly_chart(fig, use_container_width=True)
        
        # Charts
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("### 🚦 RAG Status")
            rag_counts = display_df["rag_status"].value_counts()
            fig_rag = px.pie(values=rag_counts.values, names=rag_counts.index, 
                            color=rag_counts.index, color_discrete_map={"Green": "#28a745", "Amber": "#ffc107", "Red": "#dc3545"})
            st.plotly_chart(fig_rag, use_container_width=True)
        
        with col2:
            st.markdown("### 💰 Value at Stake")
            fig_value = px.bar(display_df.sort_values("value_at_stake_usd"), x="value_at_stake_usd", y="vs_code",
                              orientation="h", color="rag_status", color_discrete_map={"Green": "#28a745", "Amber": "#ffc107", "Red": "#dc3545"})
            st.plotly_chart(fig_value, use_container_width=True)
        
        # Table
        st.markdown("### 📊 Detailed Scores")
        st.dataframe(display_df, use_container_width=True)

# Value Stream Analysis Page
elif page == "🔍 Value Stream Analysis":
    st.markdown("## Value Stream Deep Dive")
    
    if len(health_df) == 0:
        st.warning("No data available.")
    else:
        vs_code = st.selectbox("Select Value Stream:", health_df["vs_code"].unique().tolist())
        
        if vs_code:
            vs_data = health_df[health_df["vs_code"] == vs_code].iloc[0]
            status = vs_data["rag_status"]
            
            st.markdown(f"### {vs_code} - Status: **:{status.lower()}[{status}]**")
            
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Process Health", f"{vs_data['process_health']:.1f}/100")
            col2.metric("System Health", f"{vs_data['system_health']:.1f}/100")
            col3.metric("Readiness Score", f"{vs_data['readiness_score']:.1f}/100")
            col4.metric("Value at Stake", f"${vs_data['value_at_stake_usd']:,.0f}")
            
            st.markdown("---")
            st.markdown("### 📈 KPIs")
            kpi_df = load_kpis(vs_code)
            if len(kpi_df) > 0:
                for _, row in kpi_df.iterrows():
                    with st.expander(f"📊 {row.get('kpi_name', 'Unknown')}"):
                        st.write(f"**Current:** {row.get('current_value', 'N/A')} | **Target:** {row.get('target_value', 'N/A')}")
                        st.write(f"**Definition:** {row.get('definition', 'N/A')}")
            
            st.markdown("---")
            if st.button("🤖 Generate AI Analysis"):
                with st.spinner("Analyzing..."):
                    st.markdown(ask_copilot(f"Analyze {vs_code} value stream in detail", vs_code))

# AI Copilot Page
elif page == "🤖 AI Copilot":
    st.markdown("## 🤖 Enterprise Architect AI Copilot")
    
    # Quick Actions
    st.markdown("### Quick Actions")
    col1, col2, col3 = st.columns(3)
    
    if col1.button("📋 Executive Summary"):
        with st.spinner("Generating..."):
            response = ask_copilot("Provide an executive summary of overall ERP health")
            st.session_state.chat_history.append({"role": "user", "content": "Executive Summary"})
            st.session_state.chat_history.append({"role": "assistant", "content": response})
    
    if col2.button("⚠️ Top Risks"):
        with st.spinner("Analyzing..."):
            response = ask_copilot("What are the top 5 risks across all value streams?")
            st.session_state.chat_history.append({"role": "user", "content": "Top Risks"})
            st.session_state.chat_history.append({"role": "assistant", "content": response})
    
    if col3.button("🎯 Quick Wins"):
        with st.spinner("Finding..."):
            response = ask_copilot("What are the quick wins and highest value opportunities?")
            st.session_state.chat_history.append({"role": "user", "content": "Quick Wins"})
            st.session_state.chat_history.append({"role": "assistant", "content": response})
    
    st.markdown("---")
    st.markdown("### 💬 Chat with Copilot")
    
    # Display history
    for msg in st.session_state.chat_history:
        role_icon = "🧑" if msg["role"] == "user" else "🤖"
        bg_class = "user-message" if msg["role"] == "user" else "assistant-message"
        st.markdown(f'<div class="chat-message {bg_class}">{role_icon} {msg["content"]}</div>', unsafe_allow_html=True)
    
    # Input
    with st.form("chat_form", clear_on_submit=True):
        user_input = st.text_area("Your question:", height=100, placeholder="Ask about KPIs, risks, recommendations...")
        col1, col2 = st.columns([1, 5])
        submit = col1.form_submit_button("Send")
        if col2.form_submit_button("Clear"):
            st.session_state.chat_history = []
            st.rerun()
    
    if submit and user_input:
        with st.spinner("Thinking..."):
            response = ask_copilot(user_input, st.session_state.selected_vs)
            st.session_state.chat_history.append({"role": "user", "content": user_input})
            st.session_state.chat_history.append({"role": "assistant", "content": response})
            st.rerun()

# KPI Explorer Page
elif page == "📋 KPI Explorer":
    st.markdown("## 📋 KPI Explorer")
    kpi_df = load_kpis()
    
    if len(kpi_df) == 0:
        st.warning("No KPIs available.")
    else:
        vs_filter = st.multiselect("Filter Value Streams:", kpi_df["vs_code"].unique().tolist(), 
                                   default=kpi_df["vs_code"].unique().tolist()[:3])
        
        filtered_df = kpi_df[kpi_df["vs_code"].isin(vs_filter)] if vs_filter else kpi_df
        st.markdown(f"### Showing {len(filtered_df)} KPIs")
        
        for vs in filtered_df["vs_code"].unique():
            vs_kpis = filtered_df[filtered_df["vs_code"] == vs]
            with st.expander(f"📊 {vs} ({len(vs_kpis)} KPIs)", expanded=True):
                for _, row in vs_kpis.iterrows():
                    col1, col2, col3 = st.columns([3, 2, 2])
                    col1.write(f"**{row.get('kpi_name', 'Unknown')}**")
                    col2.write(f"Current: {row.get('current_value', 'N/A')}")
                    col3.write(f"Target: {row.get('target_value', 'N/A')}")

# Footer
st.markdown("---")
st.markdown("<div style='text-align: center; color: gray;'>ZeroRisk ERP Health Check | Powered by Claude AI</div>", unsafe_allow_html=True)