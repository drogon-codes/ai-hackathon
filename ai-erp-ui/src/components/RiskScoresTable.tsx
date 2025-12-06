import { ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';

export interface RiskData {
  process: string;
  riskScore: number;
  impact: string;
  status: 'critical' | 'high' | 'medium' | 'low';
}
interface RiskScoresTableProps {
  data: RiskData[];
  className?: string;
}

type SortField = 'process' | 'riskScore' | 'impact' | 'status';
type SortDirection = 'asc' | 'desc';

const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'critical' || statusLower === 'red') return '#dc2626';
  if (statusLower === 'high' || statusLower === 'amber') return '#f97316';
  if (statusLower === 'medium' || statusLower === 'yellow') return '#eab308';
  if (statusLower === 'low' || statusLower === 'green') return '#22c55e';
  return '#6b7280';
};

const RiskScoresTable: React.FC<RiskScoresTableProps> = ({ data, className = '' }) => {
  const [sortConfig, setSortConfig] = useState<{ 
    key: SortField; 
    direction: SortDirection 
  }>({ 
    key: 'riskScore', 
    direction: 'desc' 
  });

  const handleSort = (key: SortField) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = useMemo(() => {
    const sortableData = [...data];
    if (!sortConfig) return sortableData;

    sortableData.sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      // Convert impact string to number for proper sorting
      if (sortConfig.key === 'impact') {
        aValue = parseFloat(a.impact.replace(/[^0-9.]/g, ''));
        bValue = parseFloat(b.impact.replace(/[^0-9.]/g, ''));
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sortableData;
  }, [data, sortConfig]);

  if (!data || data.length === 0) return null;

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 ${className}`}>
      <h3 className="font-semibold text-lg mb-6 flex items-center">
        Detailed Risk Scores
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700"
                onClick={() => handleSort('process')}
              >
                <div className="flex items-center">
                  Process
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700"
                onClick={() => handleSort('riskScore')}
              >
                <div className="flex items-center">
                  Risk Score
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700"
                onClick={() => handleSort('impact')}
              >
                <div className="flex items-center">
                  Impact
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-800/50 divide-y divide-slate-700">
            {sortedData.map((item, index) => (
              <tr key={index} className="hover:bg-slate-700/50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">
                  {item.process}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">
                  {item.riskScore.toFixed(1)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">
                  {item.impact}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span 
                    className="px-2 py-1 text-xs rounded-full font-medium"
                    style={{
                      backgroundColor: `${getStatusColor(item.status)}20`,
                      color: getStatusColor(item.status),
                      border: `1px solid ${getStatusColor(item.status)}`
                    }}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiskScoresTable;
