"""
ZeroRisk ERP Modernization Health Check - Main Entry Point

Usage:
    python main.py setup    # Run full setup (ingest, score, index)
    python main.py ingest   # Run data ingestion only
    python main.py score    # Run scoring only
    python main.py index    # Run vector indexing only
    python main.py api      # Start FastAPI server
    python main.py ui       # Start Streamlit UI
    python main.py all      # Run setup, then start both servers
"""

import sys
import subprocess
import time

def run_ingestion():
    print("\\n" + "=" * 60)
    print("Step 1: Data Ingestion")
    print("=" * 60)
    from data_ingestion import DataIngestion
    DataIngestion().run_ingestion()

def run_scoring():
    print("\\n" + "=" * 60)
    print("Step 2: KPI Scoring")
    print("=" * 60)
    from kpi_scoring import KPIScoring
    KPIScoring().run_scoring()

def run_indexing():
    print("\\n" + "=" * 60)
    print("Step 3: Vector Indexing")
    print("=" * 60)
    from vector_store import VectorStore
    VectorStore().run_indexing()

def run_setup():
    print("\\n" + "=" * 60)
    print("ZeroRisk ERP Health Check - Full Setup")
    print("=" * 60)
    run_ingestion()
    run_scoring()
    run_indexing()
    print("\\n" + "=" * 60)
    print("Setup Complete! Run: python main.py api  or  python main.py ui")
    print("=" * 60)

def run_api_server():
    print("\\nStarting FastAPI server on http://localhost:8000")
    import uvicorn
    from api_server import app
    uvicorn.run(app, host="0.0.0.0", port=8000)

def run_streamlit_ui():
    print("\\nStarting Streamlit UI on http://localhost:8501")
    subprocess.run(["streamlit", "run", "streamlit_app.py", "--server.port=8501"])

def run_all():
    run_setup()
    print("\\nStarting Servers...")
    import threading
    threading.Thread(target=run_api_server, daemon=True).start()
    time.sleep(3)
    run_streamlit_ui()

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    cmd = sys.argv[1].lower()
    commands = {
        "setup": run_setup, "ingest": run_ingestion, "score": run_scoring,
        "index": run_indexing, "api": run_api_server, "ui": run_streamlit_ui, "all": run_all
    }
    
    if cmd in commands:
        commands[cmd]()
    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)

if __name__ == "__main__":
    main()