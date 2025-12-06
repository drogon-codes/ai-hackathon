// src/contexts/ModelContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ModelContextType {
  selectedModel: string;
  useLLM: boolean;
  setSelectedModel: (model: string) => void;
  setUseLLM: (use: boolean) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState<string>('vector-search');
  const [useLLM, setUseLLM] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel');
    const savedUseLLM = localStorage.getItem('useLLM');
    
    if (savedModel) {
      setSelectedModel(savedModel);
    }
    if (savedUseLLM !== null) {
      setUseLLM(savedUseLLM === 'true');
    }
  }, []);

  // Save to localStorage when changed
  const handleSetSelectedModel = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('selectedModel', model);
  };

  const handleSetUseLLM = (use: boolean) => {
    setUseLLM(use);
    localStorage.setItem('useLLM', use.toString());
  };

  return (
    <ModelContext.Provider
      value={{
        selectedModel,
        useLLM,
        setSelectedModel: handleSetSelectedModel,
        setUseLLM: handleSetUseLLM,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = (): ModelContextType => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};
