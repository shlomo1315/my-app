'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import Card from '@/components/ui/Card'

export interface MonthlyPoint { month: string; נתמכים: number; הלוואות: number }
export interface SlicePoint { name: string; value: number; color: string }

export default function DashboardCharts({
  monthly,
  statusData,
}: {
  monthly: MonthlyPoint[]
  statusData: SlicePoint[]
}) {
  const hasStatus = statusData.some(s => s.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">פעילות ב-6 החודשים האחרונים</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gBenef" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="gLoan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#86efac" stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} cursor={{ fill: '#f8fafc' }} />
            <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: '#475569' }}>{v}</span>} />
            <Bar dataKey="נתמכים" fill="url(#gBenef)" radius={[6, 6, 0, 0]} maxBarSize={36} />
            <Bar dataKey="הלוואות" fill="url(#gLoan)" radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">סטטוס נתמכים</h2>
        {hasStatus ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData.filter(s => s.value > 0)} cx="50%" cy="45%" innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="value">
                {statusData.filter(s => s.value > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: '#475569' }}>{v}</span>} />
              <Tooltip formatter={(value) => [`${value}`, 'נתמכים']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">אין נתונים להצגה</div>
        )}
      </Card>
    </div>
  )
}
