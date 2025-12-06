// src/pages/RiskHeatMap.tsx
import React, { useEffect, useState } from 'react';
import ValueStreamSelector from "../components/ValueStreamSelector";
import { fetchValueStreams, fetchHealthScores, ValueStream, RagStatus } from '../services/api';
import { AlertCircle, ArrowUpRight, CheckCircle, XCircle, AlertTriangle, IndianRupee, ArrowDownRight, Minus } from 'lucide-react';
import { fetchKPIs, KPI } from '../services/api';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment} from 'react';


interface ValueStreamMetrics {
  vs_code: string;
  process_health: number;
  system_health: number;
  readiness_score: number;
  rag_status: 'Red' | 'Amber' | 'Green' | 'Yellow';
  kpi_count: number;
  finding_count: number;
  painpoint_count: number;
  value_at_stake_usd: number;
}

const normalizeRagStatus = (status?: string): RagStatus => {
  if (!status) return 'Amber'; // Default value
  
  const normalized = status.toLowerCase();
  if (normalized === 'green') return 'Green';
  if (normalized === 'amber' || normalized === 'yellow') return 'Amber';
  if (normalized === 'red') return 'Red';
  return 'Amber'; // Fallback to Amber
};

const RiskHeatmap: React.FC = () => {
  const [valueStreams, setValueStreams] = useState<ValueStream[]>([]);
  const [selectedValueStream, setSelectedValueStream] = useState<any | null>(null);
  const [metrics, setMetrics] = useState<ValueStreamMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
    // Add these state variables inside your RiskHeatmap component
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);


  const analyzeWithAI = async () => {
    if (!selectedValueStream) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('http://localhost:8000/api/ask', {  // Update this line
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: `Analyze the risk heatmap for ${selectedValueStream.name}`,
          vs_code: selectedValueStream.code.toLowerCase(),
          include_history: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze with AI');
      }

      const data = await response.json();
      setAnalysisResult(data.answer || 'No analysis available');
      setIsAnalysisModalOpen(true);
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      setAnalysisResult('Failed to analyze with AI. Please try again.');
      setIsAnalysisModalOpen(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const loadValueStreams = async () => {
      try {
        const streams = await fetchValueStreams();
        setValueStreams(streams);
      } catch (err) {
        setError('Failed to load value streams');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadValueStreams();
  }, []);

  // Load metrics when value stream is selected
  useEffect(() => {
    if (!selectedValueStream) return;

    const loadMetrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchHealthScores(selectedValueStream.vs_code);
        const metrics = Array.isArray(data) ? data[0] : data;
        
        // Ensure all required fields have values
        const processedMetrics: ValueStreamMetrics = {
          vs_code: metrics.vs_code || selectedValueStream || '',
          process_health: metrics.process_health || 0,
          system_health: metrics.system_health || 0,
          readiness_score: metrics.readiness_score || 0,
          value_at_stake_usd: metrics.value_at_stake_usd || 0,
          // Optional fields with defaults
          kpi_count: metrics.kpi_count ?? 0,
          finding_count: metrics.finding_count ?? 0,
          painpoint_count: metrics.painpoint_count ?? 0,
          rag_status: normalizeRagStatus(metrics.rag_status)
        };
        
        setMetrics(processedMetrics);
      } catch (err) {
        console.error('Error loading metrics:', err);
        setError('Failed to load metrics');
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, [selectedValueStream]);

  useEffect(() => {
  if (!selectedValueStream) return;

  const loadKPIs = async () => {
      try {
        const kpiData = await fetchKPIs(selectedValueStream);
        setKpis(kpiData);
      } catch (err) {
        console.error('Error loading KPIs:', err);
        // Optionally show error to user
      }
    };

    loadKPIs();
  }, [selectedValueStream]);

  const getStatusIcon = (status?: string) => {
    if (!status) return <AlertCircle className="h-5 w-5 text-gray-500" />;
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'green') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (statusLower === 'amber' || statusLower === 'yellow') return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    if (statusLower === 'red') return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertCircle className="h-5 w-5 text-gray-500" />;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading && !metrics) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-400">{error}</div>;
  }

  const handleValueStreamSelect = (vsCode: string | null) => {
    const selected = valueStreams.find(vs => vs.code === vsCode) || null;
    setSelectedValueStream(selected);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Value Stream Deep Dive</h2>
        <p className="text-slate-400">Select value stream to analyze it deeply</p>
      </div>
      <div>
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <ValueStreamSelector
              valueStreams={valueStreams}
              selectedValueStream={selectedValueStream}
              onSelect={handleValueStreamSelect}  // Use the handler we just defined
            />
          </div>
          <button
            onClick={analyzeWithAI}
            disabled={!selectedValueStream || isAnalyzing}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Analyze with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Analysis Modal */}
    <Transition appear show={isAnalysisModalOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() => setIsAnalysisModalOpen(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-white"
                >
                  AI Analysis for {selectedValueStream?.name}
                </Dialog.Title>
                <div className="mt-4">
                  <div className="prose prose-invert max-w-none">
                    {analysisResult.split('\n').map((paragraph, i) => (
                      <p key={i} className="text-slate-300 mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    onClick={() => setIsAnalysisModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>

      {metrics && (
        <div className="space-y-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Overall Health */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Overall Health</h3>
                <div className="flex items-center">
                  <span className="text-2xl font-bold mr-2">{metrics.readiness_score}%</span>
                  {getStatusIcon(metrics.rag_status)}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Process Health</span>
                    <span>{metrics.process_health}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${metrics.process_health}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">System Health</span>
                    <span>{metrics.system_health}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${metrics.system_health}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="font-medium mb-4">Key Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-400">Value at Stake</p>
                    <p className="text-xl font-semibold">{formatCurrency(metrics.value_at_stake_usd)}</p>
                  </div>
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <IndianRupee className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400">KPIs</p>
                    <p className="text-xl font-semibold">{metrics.kpi_count}</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400">Findings</p>
                    <p className="text-xl font-semibold">{metrics.finding_count}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Overview */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="font-medium mb-4">Status Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      metrics.rag_status === 'Green' ? 'bg-green-500' : 
                      metrics.rag_status === 'Amber' ? 'bg-yellow-500' : 
                      metrics.rag_status === 'Red' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                    <span>Current Status</span>
                  </div>
                  <span className="font-medium">{metrics.rag_status}</span>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-2">Pain Points Identified</p>
                  <p className="text-xl font-semibold">{metrics.painpoint_count}</p>
                  <button className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center">
                    View Details <ArrowUpRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
                      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-medium mb-4">Key Performance Indicators</h3>
              {kpis && kpis.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {kpis.map((kpi) => {
                    const current = parseFloat(kpi.current_value);
                    const target = parseFloat(kpi.target_value);
                    const isTargetMet = kpi.target_direction === 'higher' 
                      ? current >= target 
                      : current <= target;

                    return (
                      <div key={`${kpi.vs_code}-${kpi.kpi_name}`} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-slate-300 truncate" title={kpi.kpi_name}>
                              {kpi.kpi_name}
                            </h4>
                            <div className="flex items-baseline mt-2">
                              <span className="text-2xl font-bold text-white">
                                {kpi.current_value}
                              </span>
                              <span className="ml-2 text-sm text-slate-400">
                                of {kpi.target_value} target
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                              {kpi.definition}
                            </p>
                          </div>
                          <div className={`ml-3 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
                            isTargetMet ? 'bg-green-900/30' : 'bg-red-900/30'
                          }`}>
                            {kpi.target_direction === 'higher' ? (
                              <ArrowUpRight className={`h-4 w-4 ${isTargetMet ? 'text-green-400' : 'text-red-400'}`} />
                            ) : (
                              <ArrowDownRight className={`h-4 w-4 ${isTargetMet ? 'text-green-400' : 'text-red-400'}`} />
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                            <span>Progress to Target</span>
                            <span className="font-medium">
                              {kpi.target_direction === 'higher' ? 'Higher is better' : 'Lower is better'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isTargetMet ? 'bg-green-500' : 'bg-red-500'
                              }`} 
                              style={{ 
                                width: `${Math.min(100, Math.abs((current / target) * 100))}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1.5">
                            <span className="text-xs text-slate-400">0%</span>
                            <span className="text-xs text-slate-400">100%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                  {isLoading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                      <span>Loading KPIs...</span>
                    </div>
                  ) : (
                    'No KPIs available for the selected value stream'
                  )}
                </div>
              )}
            </div>
        </div>
      )}

      {!metrics && !isLoading && (
        <div className="text-center py-12 text-slate-500">
          Select a value stream to view detailed metrics
        </div>
      )}
    </div>
  );
};

export default RiskHeatmap;