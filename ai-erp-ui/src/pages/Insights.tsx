import React, { useState, useEffect, Activity } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Play, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  FileText,
  Trash2,
  RefreshCw,
  Database,
  LucideIcon,
  ActivityIcon,
  DatabaseIcon
} from 'lucide-react';
import { cn } from '../utils/cn';
import { 
  startAnalysis, 
  getAnalysisStatus, 
  getAnalysisResults, 
  deleteAnalysisJob,
  AnalysisStatus,
  AnalysisResults, 
  getStatistics,
  SystemStatistics
} from '../services/api';

interface JobCard {
  job: AnalysisStatus;
  results?: AnalysisResults;
}

const Insights: React.FC = () => {
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [inputDirectory, setInputDirectory] = useState('./data/input');
  const [createVectorStore, setCreateVectorStore] = useState(true);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<SystemStatistics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Poll running jobs
  useEffect(() => {
    const interval = setInterval(() => {
      jobs.forEach(async (jobCard) => {
        if (jobCard.job.status === 'running' || jobCard.job.status === 'pending') {
          try {
            const updatedStatus = await getAnalysisStatus(jobCard.job.job_id);
            setJobs((prev) =>
              prev.map((j) =>
                j.job.job_id === jobCard.job.job_id
                  ? { ...j, job: updatedStatus }
                  : j
              )
            );

            // Fetch results if completed
            if (updatedStatus.status === 'completed') {
              const results = await getAnalysisResults(jobCard.job.job_id);
              setJobs((prev) =>
                prev.map((j) =>
                  j.job.job_id === jobCard.job.job_id
                    ? { ...j, results }
                    : j
                )
              );
            }
          } catch (error) {
            console.error('Error polling job status:', error);
          }
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [jobs]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getStatistics();
        setStatistics(stats);
        setError(null);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleStartAnalysis = async () => {
    setIsStarting(true);
    try {
      const status = await startAnalysis({
        input_directory: inputDirectory,
        create_vector_store: createVectorStore,
      });
      
      setJobs((prev) => [{ job: status }, ...prev]);
      setShowNewJobModal(false);
      setInputDirectory('./data/input');
      setCreateVectorStore(true);
    } catch (error) {
      alert(`Failed to start analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsStarting(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await deleteAnalysisJob(jobId);
      setJobs((prev) => prev.filter((j) => j.job.job_id !== jobId));
    } catch (error) {
      alert(`Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500/50 bg-green-500/10';
      case 'failed':
        return 'border-red-500/50 bg-red-500/10';
      case 'running':
        return 'border-cyan-500/50 bg-cyan-500/10';
      case 'pending':
        return 'border-yellow-500/50 bg-yellow-500/10';
      default:
        return 'border-slate-700';
    }
  };

  interface StatCardProps {
    title: string;
    value: number | undefined;
    icon: LucideIcon;  // Use LucideIcon type instead of ComponentType
    color?: string;
  }

  const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue' 
  }) => (
    <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-${color}-900/30 text-${color}-400 mr-3`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-xl font-semibold text-white">
            {isLoading ? '...' : value ?? 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Zap className="h-8 w-8 text-cyan-400" />
                <h1 className="text-3xl font-bold text-white">Analysis Jobs</h1>
              </div>
              <p className="text-slate-400">Run ERP modernization health checks and view results</p>
            </div>
            <button
              onClick={() => setShowNewJobModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-lg transition-all duration-200 font-semibold"
            >
              <Play className="h-5 w-5" />
              <span>New Analysis</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8"
        >
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Jobs</p>
                <p className="text-3xl font-bold text-white mt-1">{statistics?.total_jobs}</p>
              </div>
              <BarChart3 className="h-10 w-10 text-cyan-400" />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Completed</p>
                <p className="text-3xl font-bold text-green-400 mt-1">
                  {statistics?.completed_jobs}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Running</p>
                <p className="text-3xl font-bold text-cyan-400 mt-1">
                  {jobs.filter((j) => j.job.status === 'running' || j.job.status === 'pending').length}
                </p>
              </div>
              <Loader2 className="h-10 w-10 text-cyan-400" />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Failed</p>
                <p className="text-3xl font-bold text-red-400 mt-1">
                  {statistics?.failed_jobs} 
                </p>
              </div>
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Vector Store</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">
                  {statistics?.vector_store?.document_count} 
                </p>
              </div>
              <DatabaseIcon className="h-10 w-10 text-blue-400" />
            </div>
          </div>
        </motion.div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-slate-700 text-center"
          >
            <TrendingUp className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Analysis Jobs Yet</h3>
            <p className="text-slate-400 mb-6">
              Start your first analysis to generate insights and visualizations
            </p>
            <button
              onClick={() => setShowNewJobModal(true)}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all duration-200 font-semibold"
            >
              Start Analysis
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {jobs.map((jobCard, index) => (
                <motion.div
                  key={jobCard.job.job_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "bg-slate-800/50 backdrop-blur-sm rounded-xl border p-6 transition-all duration-200",
                    getStatusColor(jobCard.job.status)
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(jobCard.job.status)}
                        <h3 className="text-lg font-semibold text-white">
                          {jobCard.job.job_id}
                        </h3>
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium uppercase",
                          jobCard.job.status === 'completed' && "bg-green-500/20 text-green-400",
                          jobCard.job.status === 'failed' && "bg-red-500/20 text-red-400",
                          jobCard.job.status === 'running' && "bg-cyan-500/20 text-cyan-400",
                          jobCard.job.status === 'pending' && "bg-yellow-500/20 text-yellow-400"
                        )}>
                          {jobCard.job.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-4">{jobCard.job.message}</p>

                      {/* Progress Bar */}
                      {(jobCard.job.status === 'running' || jobCard.job.status === 'pending') && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Progress</span>
                            <span>{jobCard.job.progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${jobCard.job.progress}%` }}
                              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-slate-400">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>Started: {formatDate(jobCard.job.started_at)}</span>
                        </div>
                        {jobCard.job.completed_at && (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>Completed: {formatDate(jobCard.job.completed_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* Results Summary */}
                      {jobCard.results && (
                        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
                          <h4 className="text-white font-semibold mb-2 flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>Results</span>
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Generated Files</p>
                              <p className="text-white font-semibold">
                                {jobCard.results.generated_files?.length || 0}
                              </p>
                            </div>
                            {jobCard.results.summary && (
                              <>
                                <div>
                                  <p className="text-slate-400">Analysis Type</p>
                                  <p className="text-white font-semibold">Full Health Check</p>
                                </div>
                                <div>
                                  <p className="text-slate-400">Status</p>
                                  <p className="text-green-400 font-semibold">Success</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleDeleteJob(jobCard.job.job_id)}
                      className="ml-4 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* New Job Modal */}
        <AnimatePresence>
          {showNewJobModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setShowNewJobModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-slate-800 rounded-xl border border-slate-700 p-6 z-50"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Start New Analysis</h2>
                  <button
                    onClick={() => setShowNewJobModal(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Input Directory
                    </label>
                    <input
                      type="text"
                      value={inputDirectory}
                      onChange={(e) => setInputDirectory(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="./data/input"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="vectorStore"
                      checked={createVectorStore}
                      onChange={(e) => setCreateVectorStore(e.target.checked)}
                      className="w-4 h-4 text-cyan-600 bg-slate-900 border-slate-600 rounded focus:ring-cyan-500"
                    />
                    <label htmlFor="vectorStore" className="text-slate-300">
                      Create/Update Vector Store for RAG
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowNewJobModal(false)}
                      className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStartAnalysis}
                      disabled={isStarting}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      {isStarting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Starting...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5" />
                          <span>Start Analysis</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Insights;