import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Tag, Loader2, BookOpen, Filter, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { queryKnowledgeBase, QueryRequest, QueryResponse } from '../services/api';

const KnowledgeBase: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [topK, setTopK] = useState(5);
  const [useRAG, setUseRAG] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'All Categories',
    'Security',
    'Performance',
    'Compliance',
    'Architecture',
    'Risk Assessment',
    'Process Mining',
    'Sentiment Analysis'
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const request: QueryRequest = {
        query: query.trim(),
        category: category && category !== 'All Categories' ? category : undefined,
        top_k: topK,
        use_rag: useRAG,
      };

      const response = await queryKnowledgeBase(request);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query knowledge base');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setTimeout(() => {
      const form = document.getElementById('search-form') as HTMLFormElement;
      form?.requestSubmit();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-2">
            <BookOpen className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
          </div>
          <p className="text-slate-400">Search through ERP modernization documentation and analysis results</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-6"
        >
          <form id="search-form" onSubmit={handleSearch} className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search knowledge base..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className={cn(
                  "px-6 py-3 rounded-lg font-semibold transition-all duration-200",
                  isLoading || !query.trim()
                    ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/50"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Search'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Results Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useRAG}
                      onChange={(e) => setUseRAG(e.target.checked)}
                      className="w-4 h-4 text-cyan-500 bg-slate-900 border-slate-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm text-slate-300">Use AI-powered answers (RAG)</span>
                  </label>
                </div>
              </motion.div>
            )}
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 mr-2">Quick searches:</span>
            {[
              'security vulnerabilities',
              'performance bottlenecks',
              'modernization roadmap',
              'compliance gaps',
              'risk assessment'
            ].map((quickQuery) => (
              <button
                key={quickQuery}
                onClick={() => handleQuickSearch(quickQuery)}
                className="text-xs px-3 py-1 bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white rounded-full transition-colors duration-200"
              >
                {quickQuery}
              </button>
            ))}
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6"
          >
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold">Error</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
                <p className="text-red-300 text-xs mt-2">
                  Make sure the API server is running: <code className="bg-red-900/30 px-1 rounded">python api_server.py</code>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {useRAG && results.answer && (
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <BookOpen className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">AI Answer</h3>
                </div>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{results.answer}</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  <span>Source Documents ({results.results_count})</span>
                </h3>
              </div>

              <div className="space-y-4">
                {results.sources.map((source) => (
                  <motion.div
                    key={source.index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: source.index * 0.05 }}
                    className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-cyan-500/50 rounded-lg p-5 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-bold">
                          {source.index}
                        </span>
                        <div>
                          <h4 className="text-white font-semibold">{source.source}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Tag className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-400">{source.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {source.content_preview}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {!results && !error && !isLoading && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Enter a search query to explore the knowledge base</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
