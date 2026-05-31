import { Users, CreditCard, Baby, Gift, Clock, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { DashboardStats } from '@/types'
import DashboardCharts from './DashboardCharts'

async function getStats(): Promise<DashboardStats> {
  const defaults: DashboardStats = {
    total_beneficiaries: 0,
    pending_approvals: 0,
    active_loans: 0,
    maternity_active: 0,
    distributions_planned: 0,
    total_loan_amount: 0,
  }

  if (!isSupabaseConfigured()) return defaults

  try {
    const supabase = await createClient()

    const [beneficiaries, loans, maternity, distributions] = await Promise.all([
      supabase.from('beneficiaries').select('eligibility_status', { count: 'exact' }),
      supabase.from('loans').select('status, amount'),
      supabase.from('maternity_aids').select('status', { count: 'exact' }).eq('status', 'active'),
      supabase.from('distributions').select('status', { count: 'exact' }).in('status', ['planning', 'active']),
    ])

    const benefData = beneficiaries.data ?? []
    const loanData = loans.data ?? []

    return {
      total_beneficiaries: benefData.length,
      pending_approvals: benefData.filter((b) => b.eligibility_status === 'pending').length,
      active_loans: loanData.filter((l) => l.status === 'active').length,
      maternity_active: maternity.count ?? 0,
      distributions_planned: distributions.count ?? 0,
      total_loan_amount: loanData
        .filter((l) => l.status === 'active')
        .reduce((s, l) => s + (Number(l.amount) || 0), 0),
    }
  } catch {
    return defaults
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">לוח בקרה</h1>
        <p className="text-sm text-slate-500 mt-0.5">סקירה כללית של פעילות העמותה — היכל החתם סופר</p>
      </div>

      {!isSupabaseConfigured() && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>מצב פיתוח:</strong> Supabase לא מוגדר — מוצגים נתוני אפס. הגדר את משתני הסביבה כדי לראות נתונים אמיתיים.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="סה״כ נתמכים"
          value={stats.total_beneficiaries.toLocaleString('he-IL')}
          icon={<Users size={20} className="text-indigo-600" />}
          iconBg="bg-indigo-50"
          href="/admin/beneficiaries"
        />
        <StatCard
          title="ממתינים לאישור"
          value={stats.pending_approvals.toLocaleString('he-IL')}
          icon={<Clock size={20} className="text-amber-600" />}
          iconBg="bg-amber-50"
          href="/admin/beneficiaries?status=pending"
        />
        <StatCard
          title="הלוואות פעילות"
          value={stats.active_loans.toLocaleString('he-IL')}
          icon={<CreditCard size={20} className="text-blue-600" />}
          iconBg="bg-blue-50"
          href="/admin/loans"
        />
        <StatCard
          title="יולדות פעילות"
          value={stats.maternity_active.toLocaleString('he-IL')}
          icon={<Baby size={20} className="text-pink-600" />}
          iconBg="bg-pink-50"
          href="/admin/maternity"
        />
        <StatCard
          title="חלוקות מתוכננות"
          value={stats.distributions_planned.toLocaleString('he-IL')}
          icon={<Gift size={20} className="text-purple-600" />}
          iconBg="bg-purple-50"
          href="/admin/distributions"
        />
        <StatCard
          title="יתרת הלוואות"
          value={formatCurrency(stats.total_loan_amount)}
          icon={<TrendingUp size={20} className="text-green-600" />}
          iconBg="bg-green-50"
          href="/admin/loans"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardCharts />

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">פעולות מהירות</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/admin/beneficiaries/new', label: 'רישום נתמך חדש', icon: Users, color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
              { href: '/admin/maternity/new', label: 'פתיחת תיק יולדת', icon: Baby, color: 'bg-pink-50 text-pink-700 hover:bg-pink-100' },
              { href: '/admin/loans/new', label: 'בקשת הלוואה', icon: CreditCard, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { href: '/admin/distributions/new', label: 'חלוקה חדשה', icon: Gift, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
            ].map(({ href, label, icon: Icon, color }) => (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-xl p-3 text-sm font-medium transition-colors ${color}`}
              >
                <Icon size={16} />
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">סיכום מצב מערכת</h2>
          <div className="space-y-3">
            {[
              { label: 'נתמכים מאושרים', note: `${stats.total_beneficiaries - stats.pending_approvals} מתוך ${stats.total_beneficiaries}`, color: 'bg-green-500' },
              { label: 'ממתינים לאישור', note: `${stats.pending_approvals} נתמכים`, color: 'bg-amber-500' },
              { label: 'יולדות פעילות', note: `${stats.maternity_active} תיקים פתוחים`, color: 'bg-pink-500' },
              { label: 'חלוקות בתכנון', note: `${stats.distributions_planned} חלוקות`, color: 'bg-purple-500' },
            ].map(({ label, note, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-sm text-slate-700">{label}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium ltr-num">{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
