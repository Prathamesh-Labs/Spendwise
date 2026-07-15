import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORIES } from '../constants';

const CATEGORY_COLORS = {
  food: '#f59e0b',
  housing: '#3b82f6',
  utilities: '#8b5cf6',
  transport: '#0ea5e9',
  entertainment: '#ec4899',
  salary: '#10b981',
  other: '#9ca3af'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{data.name}</p>
        <p className="tooltip-value">
          ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

function ExpenseChart({ transactions }) {
  // Calculations inside to keep App.jsx slim
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const data = CATEGORIES.map(cat => ({
    name: cat,
    value: expensesByCategory[cat] || 0
  })).filter(item => item.value > 0);

  if (totalExpenses === 0) return null;

  return (
    <div className="chart-wrapper">
      <div className="chart-container bar-chart-container">
        <ResponsiveContainer width="100%" height={data.length * 36 + 24}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 12, right: 12, left: -20, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              stroke="#9ca3af"
              fontSize={11}
              width={95}
              tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} 
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
              {data.map((entry) => (
                <Cell 
                  key={`cell-${entry.name}`} 
                  fill={CATEGORY_COLORS[entry.name] || '#9ca3af'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ExpenseChart;
