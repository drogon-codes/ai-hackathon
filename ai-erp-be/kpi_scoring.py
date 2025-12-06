import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from pathlib import Path

import config

class KPIScoring:
    """Computes health scores based on KPI gaps, findings, and benchmarks."""
    
    def __init__(self):
        self.kpi_df = None
        self.findings_df = None
        self.painpoints_df = None
        self.health_scores_df = None
    
    def load_data(self):
        """Load curated data from parquet files."""
        try:
            self.kpi_df = pd.read_parquet(config.KPI_TARGETS_FILE)
        except:
            print("Warning: Could not load KPI data")
            self.kpi_df = pd.DataFrame()
        
        try:
            self.findings_df = pd.read_parquet(config.FINDINGS_FILE)
        except:
            print("Warning: Could not load findings data")
            self.findings_df = pd.DataFrame()
        
        try:
            self.painpoints_df = pd.read_parquet(config.PAINPOINTS_FILE)
        except:
            print("Warning: Could not load painpoints data")
            self.painpoints_df = pd.DataFrame()
    
    def compute_kpi_gap_score(self, current: float, target: float, direction: str = "higher") -> float:
        """Compute gap score (0-100) based on current vs target."""
        if current is None or target is None or target == 0:
            return 50.0
        
        if direction == "lower":
            if current <= target:
                return 100.0
            gap_ratio = (current - target) / target
        else:
            if current >= target:
                return 100.0
            gap_ratio = (target - current) / target
        
        gap_ratio = min(gap_ratio, 1.0)
        score = 100 - (gap_ratio * 60)
        return max(0, score)
    
    def compute_process_health_by_vs(self) -> pd.DataFrame:
        """Compute process health score per value stream."""
        if self.kpi_df is None or len(self.kpi_df) == 0:
            return pd.DataFrame()
        
        results = []
        for vs_code in self.kpi_df["vs_code"].unique():
            vs_kpis = self.kpi_df[self.kpi_df["vs_code"] == vs_code]
            scores = []
            for _, row in vs_kpis.iterrows():
                score = self.compute_kpi_gap_score(
                    row.get("current_numeric"),
                    row.get("target_numeric"),
                    row.get("target_direction", "higher")
                )
                scores.append(score)
            
            avg_score = np.mean(scores) if scores else 50.0
            critical_kpis = sum(1 for s in scores if s < 60)
            
            results.append({
                "vs_code": vs_code,
                "process_health": round(avg_score, 1),
                "kpi_count": len(scores),
                "critical_kpi_count": critical_kpis
            })
        
        return pd.DataFrame(results)
    
    def compute_system_health_by_vs(self) -> pd.DataFrame:
        """Compute system health score based on findings severity."""
        if self.findings_df is None or len(self.findings_df) == 0:
            default_vs = ["O2C", "P2P", "P2M", "R2R", "H2R", "A2D", "R2S", "I2M", "DM", "CROSS"]
            return pd.DataFrame({
                "vs_code": default_vs,
                "system_health": [75.0] * len(default_vs),
                "finding_count": [0] * len(default_vs),
                "critical_finding_count": [0] * len(default_vs)
            })
        
        results = []
        for vs_code in self.findings_df["vs_code"].unique():
            vs_findings = self.findings_df[self.findings_df["vs_code"] == vs_code]
            critical = len(vs_findings[vs_findings["severity"] == "Critical"])
            high = len(vs_findings[vs_findings["severity"] == "High"])
            medium = len(vs_findings[vs_findings["severity"] == "Medium"])
            low = len(vs_findings[vs_findings["severity"] == "Low"])
            
            score = 100
            score -= min(40, critical * 10)
            score -= min(30, high * 5)
            score -= min(20, medium * 2)
            score -= min(10, low * 1)
            
            results.append({
                "vs_code": vs_code,
                "system_health": max(0, round(score, 1)),
                "finding_count": len(vs_findings),
                "critical_finding_count": critical
            })
        
        return pd.DataFrame(results)
    
    def compute_painpoint_intensity_by_vs(self) -> pd.DataFrame:
        """Compute pain point intensity per value stream."""
        if self.painpoints_df is None or len(self.painpoints_df) == 0:
            return pd.DataFrame()
        
        results = []
        for vs_code in self.painpoints_df["vs_code"].unique():
            vs_pp = self.painpoints_df[self.painpoints_df["vs_code"] == vs_code]
            critical = len(vs_pp[vs_pp["severity"] == "Critical"])
            high = len(vs_pp[vs_pp["severity"] == "High"])
            medium = len(vs_pp[vs_pp["severity"] == "Medium"])
            intensity = critical * 4 + high * 2 + medium * 1
            
            results.append({
                "vs_code": vs_code,
                "painpoint_count": len(vs_pp),
                "painpoint_intensity": intensity,
                "critical_painpoints": critical
            })
        
        return pd.DataFrame(results)
    
    def compute_readiness_score(self, process_health: float, system_health: float, painpoint_intensity: float = 0) -> float:
        """Compute overall transformation readiness score."""
        pp_score = max(0, 100 - painpoint_intensity * 5)
        readiness = (
            process_health * config.PROCESS_HEALTH_WEIGHT +
            system_health * config.SYSTEM_HEALTH_WEIGHT +
            pp_score * config.READINESS_WEIGHT
        )
        return round(readiness, 1)
    
    def estimate_value_at_stake(self, vs_code: str, kpi_gap: float) -> float:
        """Estimate potential value improvement in USD."""
        base_values = {
            "O2C": 500000, "P2P": 300000, "P2M": 750000, "R2R": 200000,
            "H2R": 150000, "A2D": 250000, "R2S": 100000, "I2M": 400000, "DM": 350000,
        }
        base = base_values.get(vs_code, 200000)
        gap_factor = kpi_gap / 100
        return round(base * gap_factor, 0)
    
    def compute_health_scores(self) -> pd.DataFrame:
        """Compute comprehensive health scores for all value streams."""
        print("Computing health scores...")
        
        process_df = self.compute_process_health_by_vs()
        system_df = self.compute_system_health_by_vs()
        painpoint_df = self.compute_painpoint_intensity_by_vs()
        
        all_vs = set()
        if len(process_df) > 0:
            all_vs.update(process_df["vs_code"].tolist())
        if len(system_df) > 0:
            all_vs.update(system_df["vs_code"].tolist())
        if len(painpoint_df) > 0:
            all_vs.update(painpoint_df["vs_code"].tolist())
        
        if not all_vs:
            all_vs = {"O2C", "P2P", "P2M", "R2R", "H2R", "A2D", "R2S"}
        
        results = []
        for vs_code in all_vs:
            proc_row = process_df[process_df["vs_code"] == vs_code] if len(process_df) > 0 else pd.DataFrame()
            process_health = proc_row["process_health"].values[0] if len(proc_row) > 0 else 70.0
            kpi_count = proc_row["kpi_count"].values[0] if len(proc_row) > 0 else 0
            
            sys_row = system_df[system_df["vs_code"] == vs_code] if len(system_df) > 0 else pd.DataFrame()
            system_health = sys_row["system_health"].values[0] if len(sys_row) > 0 else 75.0
            finding_count = sys_row["finding_count"].values[0] if len(sys_row) > 0 else 0
            
            pp_row = painpoint_df[painpoint_df["vs_code"] == vs_code] if len(painpoint_df) > 0 else pd.DataFrame()
            pp_intensity = pp_row["painpoint_intensity"].values[0] if len(pp_row) > 0 else 0
            pp_count = pp_row["painpoint_count"].values[0] if len(pp_row) > 0 else 0
            
            readiness = self.compute_readiness_score(process_health, system_health, pp_intensity)
            kpi_gap = 100 - process_health
            value_at_stake = self.estimate_value_at_stake(vs_code, kpi_gap)
            
            if readiness >= 80:
                rag_status = "Green"
            elif readiness >= 60:
                rag_status = "Amber"
            else:
                rag_status = "Red"
            
            results.append({
                "vs_code": vs_code,
                "process_health": process_health,
                "system_health": system_health,
                "readiness_score": readiness,
                "rag_status": rag_status,
                "kpi_count": kpi_count,
                "finding_count": finding_count,
                "painpoint_count": pp_count,
                "value_at_stake_usd": value_at_stake
            })
        
        self.health_scores_df = pd.DataFrame(results)
        return self.health_scores_df
    
    def save_health_scores(self):
        """Save health scores to parquet file."""
        if self.health_scores_df is not None:
            self.health_scores_df.to_parquet(config.HEALTH_SCORES_FILE, index=False)
            print(f"Saved health scores to {config.HEALTH_SCORES_FILE}")
    
    def run_scoring(self):
        """Run complete scoring pipeline."""
        print("=" * 60)
        print("ZeroRisk ERP Health Check - Scoring Engine")
        print("=" * 60)
        
        print("\\n1. Loading curated data...")
        self.load_data()
        
        print("\\n2. Computing health scores...")
        self.compute_health_scores()
        
        print("\\n3. Health Scores Summary:")
        if self.health_scores_df is not None:
            print(self.health_scores_df.to_string(index=False))
        
        print("\\n4. Saving results...")
        self.save_health_scores()
        
        print("\\n" + "=" * 60)
        print("Scoring Complete!")
        print("=" * 60)
        
        return self


if __name__ == "__main__":
    scoring = KPIScoring()
    scoring.run_scoring()