// src/components/ModelSelector.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Brain, Zap, Server, Cloud, Check, AlertCircle } from 'lucide-react';
import { fetchAvailableModels, ModelInfo } from '../services/api';
import { cn } from '../utils/cn';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  useLLM: boolean;
  onUseLLMChange: (use: boolean) => void;
  compact?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  useLLM,
  onUseLLMChange,
  compact = false
}) => {
  const [models, setModels] = useState<Record<string, ModelInfo>>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadModels();
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const loadModels = async () => {
    try {
      const data = await fetchAvailableModels();
      setModels(data.models);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModelIcon = (modelKey: string) => {
    switch (modelKey) {
      case 'vector-search':
        return <Zap className="h-4 w-4" />;
      case 'openai':
        return <Brain className="h-4 w-4" />;
      case 'ollama':
        return <Server className="h-4 w-4" />;
      case 'huggingface':
        return <Cloud className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const currentModel = models[selectedModel];

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500"></div>
        Loading models...
      </div>
    );
  }

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg hover:border-cyan-500 hover:bg-slate-700 transition-colors text-sm whitespace-nowrap"
          title="Select AI Model"
        >
          <div className="flex items-center gap-2">
            {getModelIcon(selectedModel)}
            <span className="text-slate-200 font-medium">{currentModel?.name || 'Select Model'}</span>
            {!currentModel?.available && (
              <AlertCircle className="h-3 w-3 text-amber-500" />
            )}
          </div>
          <svg 
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform",
              showDropdown && "rotate-180"
            )} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setShowDropdown(false)} />
            <div className="absolute left-0 bottom-full mb-2 w-96 bg-slate-800 border-2 border-slate-600 rounded-xl shadow-2xl z-[9999] max-h-[32rem] flex flex-col">
              <div className="p-4 border-b-2 border-slate-600 bg-slate-800/95 backdrop-blur-sm flex-shrink-0">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={useLLM}
                      onChange={(e) => onUseLLMChange(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-slate-500 bg-slate-900 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-slate-100 font-semibold group-hover:text-white transition-colors block">
                      Use AI Model for Answers
                    </span>
                    <span className="text-xs text-slate-400">
                      {useLLM ? 'AI-powered responses enabled' : 'Vector search only'}
                    </span>
                  </div>
                </label>
              </div>

              <div className="overflow-y-auto flex-1 overscroll-contain" style={{maxHeight: '26rem'}}>
                {Object.entries(models).map(([key, model]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onModelChange(key);
                      setShowDropdown(false);
                    }}
                    disabled={!model.available && key !== 'vector-search'}
                    className={cn(
                      "w-full text-left px-4 py-4 hover:bg-slate-700 transition-all duration-150 border-b border-slate-700/50 last:border-b-0 relative",
                      selectedModel === key && "bg-slate-700/80",
                      !model.available && key !== 'vector-search' && "opacity-40 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    {selectedModel === key && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />
                    )}
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "mt-1 flex-shrink-0 p-2 rounded-lg",
                        model.available ? "text-cyan-400 bg-cyan-500/10" : "text-slate-500 bg-slate-700/50"
                      )}>
                        {getModelIcon(key)}
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-50 text-sm">{model.name}</span>
                          {selectedModel === key && (
                            <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                          )}
                          {!model.available && key !== 'vector-search' && (
                            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{model.description}</p>
                        {model.configured_model && (
                          <p className="text-xs text-cyan-400/80 mt-1.5 font-mono">
                            {model.configured_model}
                          </p>
                        )}
                        {!model.available && model.requires_api_key && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <AlertCircle className="h-3 w-3 text-amber-400" />
                            <p className="text-xs text-amber-400 font-medium">
                              API key required
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full version for settings page
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-200">AI Model Selection</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useLLM}
            onChange={(e) => onUseLLMChange(e.target.checked)}
            className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-sm text-slate-300">Use AI Model</span>
        </label>
      </div>

      <div className="grid gap-3">
        {Object.entries(models).map(([key, model]) => (
          <button
            key={key}
            onClick={() => onModelChange(key)}
            disabled={!model.available && key !== 'vector-search'}
            className={cn(
              "p-4 rounded-lg border-2 transition-all text-left",
              selectedModel === key
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
              !model.available && key !== 'vector-search' && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                selectedModel === key
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "bg-slate-700 text-slate-400"
              )}>
                {getModelIcon(key)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{model.name}</span>
                  {selectedModel === key && (
                    <Check className="h-5 w-5 text-cyan-400" />
                  )}
                  {!model.available && key !== 'vector-search' && (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1">{model.description}</p>
                {model.configured_model && (
                  <p className="text-xs text-slate-500 mt-2">
                    Configured Model: <span className="text-cyan-400">{model.configured_model}</span>
                  </p>
                )}
                {model.requires_api_key && (
                  <p className="text-xs text-slate-500 mt-1">
                    {model.available ? '✓ API Key configured' : '⚠️ API Key required'}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {!useLLM && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200 font-medium">Vector Search Mode</p>
              <p className="text-xs text-amber-300/70 mt-1">
                AI model is disabled. Responses will be based on direct document retrieval only.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
