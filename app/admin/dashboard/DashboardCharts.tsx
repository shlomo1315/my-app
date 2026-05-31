'use client'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

const statusData = [
  { name: 'מאושרים', value: 68, color: '#22c55e' },
  { name: 'ממתינים', value: 18, color: '#f59e0b' },
  { name: 'בבדיקה', value: 9, color: '#3b82f6' },
  { name: 'נדחו', value: 5, color: '#ef4444' },
]

export default function DashboardCharts() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">סטטוס נתמכים</h2>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={statusData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {statusData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ fontSize: 12, color: '#475569' }}>{value}</span>}
          />
          <Tooltip formatter={(value) => [`${value}%`, '']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
