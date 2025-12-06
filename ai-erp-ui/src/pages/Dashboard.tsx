// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import api from '../services/api.service';
import { 
  Activity, 
  AlertCircle, 
  DollarSign, 
  Zap, 
  Shield, 
  ChevronRight,
  ArrowUpRight,
  LucideIcon,
  IndianRupee
} from 'lucide-react';
import { motion } from 'framer-motion';
import { HealthScore } from '../types';
import ValueStreamHeatmap from '../components/ValueStreamHeatMap';
import RiskHeatmap from '../components/RiskHeatmap';
import RagStatusPieChart from '../components/RagStatusPieChart';
import RiskScoresTable from '../components/RiskScoresTable';
import ValueStreamSelector from '../components/ValueStreamSelector';
import RagInsights from '../components/RagInsights';
import SystemStatistics from '../components/SystemStatistics';
import { fetchValueStreams, fetchHealthScores } from '../services/api';
import { ValueStream } from '../services/api';


// Move interfaces to the top level
interface RiskItem {
  id: number;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  process: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'cyan' | 'red' | 'green' | 'yellow';
  subtext?: string;
  progress?: number;
}

const MetricCard = ({ title, value, icon: Icon, color, subtext, progress }: MetricCardProps) => {
  const colorVariants = {
    cyan: 'from-cyan-500 to-cyan-600',
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  return (
    <motion.div 
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-all duration-200"
      whileHover={{ y: -5 }}
    >
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colorVariants[color]} bg-opacity-20`}>
          <Icon className={`h-5 w-5 text-${color}-400`} />
        </div>
        <ChevronRight className="h-4 w-4 text-slate-500" />
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-slate-400 text-sm mt-1">{title}</p>
        {subtext && (
          <p className="text-xs mt-2 flex items-center text-green-400">
            <ArrowUpRight className="h-3 w-3 mr-1" />
            {subtext}
          </p>
        )}
      </div>
      {progress && (
        <div className="mt-4">
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${colorVariants[color]} rounded-full`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

interface RiskItemProps {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  process: string;
}

const RiskItem = ({ title, severity, impact, process }: RiskItemProps) => {
  const severityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  return (
    <div className="flex items-center p-3 hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer group">
      <div className={`h-2 w-2 rounded-full ${severityColors[severity]} mr-3`}></div>
      <div className="flex-1">
        <h4 className="font-medium group-hover:text-cyan-400 transition-colors">{title}</h4>
        <p className="text-xs text-slate-400">{process}</p>
      </div>
      <div className="text-right">
        <p className="text-red-400 font-medium">${impact}</p>
        <p className="text-xs text-slate-400 capitalize">{severity}</p>
      </div>
    </div>
  );
};

interface QuickWinCardProps {
  title: string;
  effort: string;
  savings: string;
  roi: string;
  onView: () => void;
  onAdd: () => void;
}

const Dashboard: React.FC = () => {
  // State hooks at the top
  const [valueStreams, setValueStreams] = useState<ValueStream[]>([]);
  const [selectedValueStream, setSelectedValueStream] = useState<string | null>(null);
  const [scores, setScores] = useState<HealthScore[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadValueStreams = async () => {
      try {
        const streams = await fetchValueStreams();
        setValueStreams(streams);
      } catch (err) {
        setError('Failed to load value streams');
        console.error(err);
      }
    };

    loadValueStreams();
  }, []);

  // Fetch scores when selected value stream changes
  useEffect(() => {
  const loadScores = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchHealthScores(selectedValueStream);
      console.log('Fetched Health Scores:', data);
      console.log('Selected Value Stream:', selectedValueStream);
      setScores(data);
    } catch (err) {
      console.error('Error loading health scores:', err);
      setError('Failed to load health scores');
      setScores([]);
    } finally {
      setIsLoading(false);
    }
  };

  loadScores();
}, [selectedValueStream]);

  const calculateAverages = (): {
    avgProcessHealth: number;
    avgSystemHealth: number;
    avgReadiness: number;
    totalValueAtStake: number;
  } | null => {
    if (scores.length === 0) return null;

    const total = scores.reduce(
      (acc, score) => ({
        process_health: acc.process_health + score.process_health,
        system_health: acc.system_health + score.system_health,
        readiness_score: acc.readiness_score + score.readiness_score,
        value_at_stake_usd: acc.value_at_stake_usd + score.value_at_stake_usd,
      }),
      {
        process_health: 0,
        system_health: 0,
        readiness_score: 0,
        value_at_stake_usd: 0,
      }
    );

    return {
      avgProcessHealth: total.process_health / scores.length,
      avgSystemHealth: total.system_health / scores.length,
      avgReadiness: total.readiness_score / scores.length,
      totalValueAtStake: total.value_at_stake_usd,
    };
  };

    const riskData = scores.map(score => ({
      process: score.vs_code,
      riskScore: 100 - score.readiness_score,
      impact: `$${(score.value_at_stake_usd / 1000).toFixed(1)}K`,
      status: (score.rag_status?.toLowerCase() || 'low') as 'critical' | 'high' | 'medium' | 'low'
    }));

  const formatNumber = (num: number, isCurrency: boolean = false): string => {
    if (isNaN(num)) return '0.0';
    if (isCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    }
    return num.toFixed(1);
  };

  const averages = calculateAverages();

  // Loading and error states
  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
  if (!averages) return <div className="p-8 text-center">No data available</div>;

  return (
    <div className="space-y-8 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ValueStreamSelector
          valueStreams={valueStreams}
          selectedValueStream={selectedValueStream}
          onSelect={setSelectedValueStream}
          isLoading={isLoading}
        />
      </div>
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Process Health" 
          value={formatNumber(averages.avgProcessHealth)} 
          icon={Shield} 
          color="cyan" 
          progress={averages.avgProcessHealth} 
        />
        <MetricCard 
          title="System Health" 
          value={formatNumber(averages.avgSystemHealth)} 
          icon={Activity} 
          color="green" 
        />
        <MetricCard 
          title="Readiness Score" 
          value={formatNumber(averages.avgReadiness)} 
          icon={AlertCircle} 
          color="yellow" 
        />
        <MetricCard 
          title="Value at Stake" 
          value={formatNumber(averages.totalValueAtStake, true)} 
          icon={IndianRupee} 
          color="red" 
        />
      </div>

      {/* Two-Column Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <ValueStreamHeatmap data={scores} ></ValueStreamHeatmap>
      </div>

      {/* Two-Column Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <RagStatusPieChart
            data={scores}
          />
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <RiskHeatmap data={riskData}></RiskHeatmap>
        </div>
      </div>

      {/* AI-Powered Insights */}
      <RagInsights />

      {/* System Statistics */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <SystemStatistics />
      </div>

      {/* Risk Distribution Chart */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="font-semibold text-lg mb-6">Risk Score</h3>
        <RiskScoresTable data={riskData} />
      </div>
    </div>
  );
};

export default Dashboard;