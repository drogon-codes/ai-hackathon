import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ValueStream } from '../services/api';

interface ValueStreamSelectorProps {
  valueStreams: ValueStream[];
  selectedValueStream: string | null;
  onSelect: (vsCode: string | null) => void;
  isLoading?: boolean;
}

const ValueStreamSelector: React.FC<ValueStreamSelectorProps> = ({
  valueStreams = [],
  selectedValueStream,
  onSelect,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedStream = selectedValueStream 
    ? valueStreams.find(vs => vs.code === selectedValueStream)
    : null;

  return (
    <div className="relative w-full max-w-xs">
      <button
        type="button"
        className={`w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-md flex items-center justify-between ${
          isLoading ? 'opacity-70 cursor-not-allowed' : ''
        }`}
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <span>
          {isLoading 
            ? 'Loading...' 
            : selectedStream 
              ? `${selectedStream.name} (${selectedStream.code})`
              : 'Select a Value Stream'}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-slate-700 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            <button
              type="button"
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600"
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
            >
              All Value Streams
            </button>
            {valueStreams.map((stream) => (
              <button
                key={stream.code}
                type="button"
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600"
                onClick={() => {
                  onSelect(stream.code);
                  setIsOpen(false);
                }}
              >
                {stream.name} ({stream.code})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ValueStreamSelector;