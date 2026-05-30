'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import Card from '@/components/ui/Card'

const monthlyData = [
  { month: 'ינו', נתמכים: 12, הלוואות: 4 },
  { month: 'פבר', נתמכים: 19, הלוואות: 7 },
  { month: 'מרץ', נתמכים: 15, הלוואות: 5 },
  { month: 'אפר', נתמכים: 22, הלוואות: 9 },
  { month: 'מאי', נתמכים: 18, הלוואות: 6 },
  { month: 'יוני', נתמכים: 25, הלוואות: 11 },
]

const statusData = [
  { name: 'מאושרים', value: 68, color: '#22c55e' },
  { name: 'ממתינים', value: 18, color: '#f59e0b' },
  { name: 'בבדיקה', value: 9, color: '#3b82f6' },
  { name: 'נדחו', value: 5, color: '#ef4444' },
]

export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">רישומים חודשיים</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar dataKey="נתמכים" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="הלוואות" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
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
      </Card>
    </div>
  )
}
