import Link from 'next/link'
import { Plus, Baby } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { MaternityAid } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

async function getMaternityAids(): Promise<MaternityAid[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('maternity_aids')
      .select('*, beneficiary:beneficiaries(full_name, phone)')
      .order('created_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

const formatDate = (d?: string) => d ? format(new Date(d), 'dd/MM/yy', { locale: he }) : '—'
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)

export default async function MaternityPage() {
  const aids = await getMaternityAids()
  const active = aids.filter((a) => a.status === 'active').length
  const pending = aids.filter((a) => a.status === 'pending').length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">אגף יולדות</h1>
          <p className="text-sm text-slate-500 mt-0.5">{aids.length} תיקים</p>
        </div>
        <Link href="/maternity/new">
          <Button>
            <Plus size={16} />
            פתיחת תיק יולדת
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'תיקים פעילים', value: active, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'ממתינים לאישור', value: pending, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'סה״כ תיקים', value: aids.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-slate-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <Card padding="none">
        <div className="px-5 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700">רשימת תיקים</h2>
        </div>
        {aids.length === 0 ? (
          <div className="p-12 text-center">
            <Baby size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400 text-sm">לא נמצאו תיקי יולדות</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['שם יולדת', 'תאריך לידה', 'שם תינוק', 'כרטיס נדרים', 'יתרה', 'בית החלמה', 'סטטוס', 'פעולות'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aids.map((aid) => (
                  <tr key={aid.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {(aid.beneficiary as { full_name: string } | undefined)?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 ltr-num text-slate-600">{formatDate(aid.birth_date)}</td>
                    <td className="px-4 py-3 text-slate-600">{aid.baby_name ?? '—'}</td>
                    <td className="px-4 py-3 ltr-num text-xs font-mono text-slate-600">{aid.card_number ?? '—'}</td>
                    <td className="px-4 py-3 ltr-num text-slate-700 font-medium">{formatCurrency(aid.card_balance)}</td>
                    <td className="px-4 py-3 text-slate-600">{aid.recovery_home ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={aid.status} /></td>
                    <td className="px-4 py-3">
                      <Link href={`/maternity/${aid.id}`} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                        צפייה
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
