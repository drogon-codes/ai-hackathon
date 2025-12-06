// src/components/RiskHeatmap.tsx
import { AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RiskData {
  process: string;
  riskScore: number;
  impact: string;
  status: 'critical' | 'high' | 'medium' | 'low';
}

interface RiskHeatmapProps {
  data: RiskData[];
}

const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'critical' || statusLower === 'red') return '#dc2626';
  if (statusLower === 'high' || statusLower === 'amber') return '#f97316';
  if (statusLower === 'medium' || statusLower === 'yellow') return '#eab308';
  if (statusLower === 'low' || statusLower === 'green') return '#22c55e';
  return '#6b7280';
};

const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Sort data by risk score in descending order
  const sortedData = [...data].sort((a, b) => b.riskScore - a.riskScore);

  // Format data for the chart
  const chartData = sortedData.map(item => ({
    name: item.process,
    'Risk Score': item.riskScore,
    impact: parseFloat(item.impact.replace(/[^0-9.]/g, '')), // Convert $1.2K to 1.2
    status: item.status,
    fill: getStatusColor(item.status)
  }));

  // Get unique statuses for the legend
  const statuses = [...new Set(data.map(item => item.status.toLowerCase()))];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 p-3 border border-slate-700 rounded shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">Risk Score: <span className="font-medium">{payload[0].value}</span></p>
          <p className="text-sm">Impact: ${data.impact.toFixed(1)}K</p>
          <p className="text-sm">Status: 
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs" 
                  style={{ backgroundColor: data.fill, color: 'white' }}>
              {data.status}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Legend item component
  const LegendItem = ({ status }: { status: string }) => {
    const color = getStatusColor(status);
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    
    return (
      <div className="flex items-center">
        <div 
          className="w-3 h-3 rounded-sm mr-1" 
          style={{ backgroundColor: color }}
        ></div>
        <span>{label}</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
      <h3 className="font-semibold text-lg mb-6 flex items-center">
        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
        Risk Heatmap
      </h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              domain={[0, 100]}
              tick={{ fill: '#9ca3af' }} 
              tickLine={{ stroke: '#4b5563' }}
            />
            <YAxis 
              dataKey="name"
              type="category"
              tick={{ fill: '#9ca3af' }}
              tickLine={{ stroke: '#4b5563' }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="Risk Score" 
              radius={[0, 4, 4, 0]}
              name="Risk Score"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`} 
                  fill={entry.fill} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dynamic Legend */}
      <div className="flex justify-center mt-6 space-x-4 text-xs">
        {statuses.map(status => (
          <LegendItem key={status} status={status} />
        ))}
      </div>
    </div>
  );
};

export default RiskHeatmap;