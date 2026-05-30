import Link from 'next/link'
import { Plus, CreditCard } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { Loan } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

async function getLoans(): Promise<Loan[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('loans')
      .select('*, beneficiary:beneficiaries(full_name, id_number)')
      .order('created_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

const fmtDate = (d?: string) => d ? format(new Date(d), 'dd/MM/yy', { locale: he }) : '—'
const fmtCur = (n: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)

export default async function LoansPage() {
  const loans = await getLoans()
  const active = loans.filter((l) => l.status === 'active')
  const totalActive = active.reduce((s, l) => s + l.amount, 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">הלוואות</h1>
          <p className="text-sm text-slate-500 mt-0.5">{loans.length} הלוואות</p>
        </div>
        <Link href="/admin/loans/new">
          <Button>
            <Plus size={16} />
            הלוואה חדשה
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'הלוואות פעילות', value: active.length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'סה״כ בפעילות', value: fmtCur(totalActive), color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'ממתינות לאישור', value: loans.filter((l) => l.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'בפיגור', value: loans.filter((l) => l.status === 'defaulted').length, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
            <p className={`text-xl font-bold ${color} ltr-num`}>{value}</p>
            <p className="text-sm text-slate-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <Card padding="none">
        <div className="px-5 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700">רשימת הלוואות</h2>
        </div>
        {loans.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400 text-sm">לא נמצאו הלוואות</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['שם הלווה', 'ת.ז.', 'סכום', 'תשלום חודשי', 'תשלומים', 'מטרה', 'תאריך פתיחה', 'סטטוס', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => {
                  const b = loan.beneficiary as { full_name: string; id_number: string } | undefined
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{b?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 ltr-num text-xs font-mono text-slate-500">{b?.id_number ?? '—'}</td>
                      <td className="px-4 py-3 ltr-num font-semibold text-slate-900">{fmtCur(loan.amount)}</td>
                      <td className="px-4 py-3 ltr-num text-slate-600">{fmtCur(loan.monthly_payment)}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{loan.installments}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[120px] truncate">{loan.purpose ?? '—'}</td>
                      <td className="px-4 py-3 ltr-num text-slate-500 text-xs">{fmtDate(loan.created_at)}</td>
                      <td className="px-4 py-3"><StatusBadge status={loan.status} /></td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/loans/${loan.id}`} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">צפייה</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
