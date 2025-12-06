// src/components/RagStatusPieChart.tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, PieLabelRenderProps } from 'recharts';
import { HealthScore } from '../types';

const COLORS = {
  red: '#dc2626',    // red-600
  amber: '#f97316',  //amber-500
  green: '#10b981',  // emerald-500
  gray: '#6b7280'    // gray-500
};

interface RagStatusPieChartProps {
  data: HealthScore[];
}

const RagStatusPieChart: React.FC<RagStatusPieChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-slate-400">No data available</p>
      </div>
    );
  }

  // Count RAG statuses - normalize to lowercase and handle variations
  const ragCounts = data.reduce((acc, item) => {
    const status = item.rag_status?.toLowerCase()?.trim() || 'unknown';
    // Map yellow to amber for consistency
    const normalizedStatus = status === 'yellow' ? 'amber' : status;
    acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('RAG Status Counts:', ragCounts);
  console.log('Original Data:', data);

  // Convert to array for the pie chart
  const pieData = [
    { name: 'Red', value: ragCounts.red || 0, color: COLORS.red },
    { name: 'Amber', value: ragCounts.amber || 0, color: COLORS.amber },
    { name: 'Green', value: ragCounts.green || 0, color: COLORS.green }
  ].filter(item => item.value > 0); // Only show statuses that exist in the data

  if (pieData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-slate-400">No RAG status data available</p>
      </div>
    );
  }

  const total = data.length;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-slate-800 p-3 border border-slate-700 rounded shadow-lg text-sm">
          <p className="font-semibold">{data.name}</p>
          <p>{data.value} of {total} value streams ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <div className="w-2 h-5 bg-blue-500 mr-2 rounded-sm"></div>
        RAG Status Distribution
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }: any) => {
                if (!name || percent === undefined) return '';
                return `${name}: ${(percent * 100).toFixed(0)}%`;
              }}
              labelLine={false}
            >
            {pieData.map((entry, index) => (
                <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                stroke="#1f2937"
                strokeWidth={1}
                />
            ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              formatter={(value) => (
                <span className="text-xs text-gray-300">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RagStatusPieChart;