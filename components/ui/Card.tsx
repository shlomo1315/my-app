import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  iconBg?: string
  trend?: { value: number; label: string }
}

export default function Card({ children, className = '', padding = 'md' }: CardProps) {
  const padClasses = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${padClasses[padding]} ${className}`}>
      {children}
    </div>
  )
}

export function StatCard({ title, value, subtitle, icon, iconBg = 'bg-indigo-50', trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 ltr-num">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={`flex-shrink-0 rounded-xl p-3 ${iconBg}`}>{icon}</div>
      </div>
    </div>
  )
}
