import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Database,
  FileText,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { getStatistics, SystemStatistics as Stats } from '../services/api';
import { cn } from '../utils/cn';

const SystemStatistics: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStatistics();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const successRate = stats.total_jobs > 0 
    ? ((stats.completed_jobs / stats.total_jobs) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Activity className="h-5 w-5 text-cyan-400" />
          <span>System Statistics</span>
        </h3>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </button>
      </div>

      {/* Job Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <FileText className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total_jobs}</p>
              <p className="text-xs text-slate-400">Total Jobs</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.completed_jobs}</p>
              <p className="text-xs text-slate-400">Completed</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Loader2 className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-400">{stats.running_jobs}</p>
              <p className="text-xs text-slate-400">Running</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{stats.failed_jobs}</p>
              <p className="text-xs text-slate-400">Failed</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Success Rate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Success Rate</span>
          <span className="text-lg font-bold text-white">{successRate}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
            style={{ width: `${successRate}%` }}
          />
        </div>
      </motion.div>

      {/* Vector Store Info */}
      {stats.vector_store && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Database className="h-5 w-5 text-cyan-400" />
            <h4 className="text-white font-semibold">Vector Store</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Documents</p>
              <p className="text-white font-semibold text-lg">
                {stats.vector_store.total_documents || 0}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Chunks</p>
              <p className="text-white font-semibold text-lg">
                {stats.vector_store.total_chunks || 0}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400">Embedding Model</p>
              <p className="text-white font-medium text-xs">
                {stats.vector_store.embedding_model || 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SystemStatistics;
