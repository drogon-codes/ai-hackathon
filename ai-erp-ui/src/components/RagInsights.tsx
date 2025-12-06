import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { batchQuery } from '../services/api';

interface InsightCard {
  title: string;
  answer: string;
  icon: 'risk' | 'success' | 'info';
  loading?: boolean;
}

const RagInsights: React.FC = () => {
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queries = [
        "What is the overall readiness score and what does it mean?",
        "What are the top 3 critical risks identified?",
        "What modernization steps should be prioritized?"
      ];

      const response = await batchQuery(queries);
      
      const insightCards: InsightCard[] = response.results.map((result, idx) => ({
        title: queries[idx].replace('?', ''),
        answer: result.answer,
        icon: idx === 0 ? 'info' : idx === 1 ? 'risk' : 'success',
      }));

      setInsights(insightCards);
    } catch (err) {
      setError('Unable to fetch insights. Ensure the API server is running.');
      console.error('Failed to fetch RAG insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'risk':
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      default:
        return <TrendingUp className="h-5 w-5 text-cyan-400" />;
    }
  };

  const getGradient = (type: string) => {
    switch (type) {
      case 'risk':
        return 'from-red-500/10 to-red-600/10 border-red-500/30';
      case 'success':
        return 'from-green-500/10 to-green-600/10 border-green-500/30';
      default:
        return 'from-cyan-500/10 to-blue-500/10 border-cyan-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">AI-Powered Insights</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">AI-Powered Insights</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-slate-400 text-sm">{error}</p>
          <button
            onClick={fetchInsights}
            className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">AI-Powered Insights</h3>
        </div>
        <button
          onClick={fetchInsights}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-gradient-to-br ${getGradient(insight.icon)} border rounded-lg p-4`}
          >
            <div className="flex items-start space-x-3">
              <div className="mt-1">{getIcon(insight.icon)}</div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-2">{insight.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {insight.answer}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RagInsights;
