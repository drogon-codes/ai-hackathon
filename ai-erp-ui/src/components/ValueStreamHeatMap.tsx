import { Thermometer } from 'lucide-react';
import { HealthScore } from '../types';

// Add this new component above the Dashboard component
interface HeatmapCellProps {
  value: string;
  label?: string;
  showLabel?: boolean;
}

const HeatmapCell: React.FC<HeatmapCellProps> = ({ value, label, showLabel = false }) => {
  const getColorClass = (rag_status: string) => {
    if (rag_status == 'Dark Green') return 'bg-green-600';
    if (rag_status == 'Green') return 'bg-green-400';
    if (rag_status == 'Yellow') return 'bg-yellow-500';
    if (rag_status == 'Orange') return 'bg-orange-500';
    if (rag_status == 'Amber') return 'bg-amber-500';
    if (rag_status == 'Red') return 'bg-red-600';
  };

  return (
    <div className="relative group">
      <div 
        className={`w-16 h-16 ${getColorClass(value)} flex items-center justify-center text-white font-medium`}
        title={`${label || 'Score'}: ${value}`}
      >
        {showLabel ? value : ''}
      </div>
    </div>
  );
};

const ValueStreamHeatmap: React.FC<{ data: HealthScore[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Get unique value streams
  const valueStreams = [...new Set(data.map(item => item.vs_code))];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6">
      <h3 className="font-semibold text-lg mb-6 flex items-center">
        <Thermometer className="h-5 w-5 text-red-400 mr-2" />
        Value Stream Health Heatmap
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left pb-4 pr-4">Metric</th>
              {valueStreams.map(vs => (
                <th key={vs} className="text-center pb-4 px-1">
                  <div className="w-16">{vs}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 pr-4">Process Health</td>
              {valueStreams.map(vs => {
                const item = data.find(d => d.vs_code === vs);
                return (
                  <td key={`${vs}-process`} className="px-1 py-2">
                    <HeatmapCell 
                      value={item?.rag_status || ''} 
                      label={`${vs} Process Health`} 
                    />
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="py-2 pr-4">System Health</td>
              {valueStreams.map(vs => {
                const item = data.find(d => d.vs_code === vs);
                return (
                  <td key={`${vs}-system`} className="px-1 py-2">
                    <HeatmapCell 
                      value={item?.rag_status || ''} 
                      label={`${vs} System Health`} 
                    />
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="py-2 pr-4">Readiness</td>
              {valueStreams.map(vs => {
                const item = data.find(d => d.vs_code === vs);
                return (
                  <td key={`${vs}-readiness`} className="px-1 py-2">
                    <HeatmapCell 
                      value={item?.rag_status || ''} 
                      label={`${vs} Readiness`} 
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex justify-center items-center space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-600 mr-1"></div>
          <span>80-100</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-400 mr-1"></div>
          <span>60-79</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-500 mr-1"></div>
          <span>40-59</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-amber-500 mr-1"></div>
          <span>20-39</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-600 mr-1"></div>
          <span>0-19</span>
        </div>
      </div>
    </div>
  );
};

export default ValueStreamHeatmap;