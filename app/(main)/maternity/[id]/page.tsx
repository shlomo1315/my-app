import Link from 'next/link'
import { ArrowRight, Baby, CreditCard, Home } from 'lucide-react'
import { notFound } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { MaternityAid } from '@/types'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

async function getAid(id: string): Promise<MaternityAid | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('maternity_aids')
      .select('*, beneficiary:beneficiaries(full_name, phone, id_number)')
      .eq('id', id)
      .single()
    return data
  } catch {
    return null
  }
}

const fmtDate = (d?: string) => d ? format(new Date(d), 'dd/MM/yyyy', { locale: he }) : '—'
const fmtCur = (n: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)

export default async function MaternityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const aid = await getAid(id)

  if (!aid && isSupabaseConfigured()) notFound()

  if (!aid) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/maternity" className="text-slate-400 hover:text-slate-600"><ArrowRight size={20} /></Link>
          <h1 className="text-xl font-bold">פרטי תיק יולדת</h1>
        </div>
        <div className="bg-white rounded-xl border p-8 text-center text-slate-400">הגדר Supabase לצפייה בנתונים</div>
      </div>
    )
  }

  const beneficiary = aid.beneficiary as { full_name: string; phone?: string; id_number: string } | undefined
  const expiresIn = aid.card_expires_at
    ? Math.ceil((new Date(aid.card_expires_at).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/maternity" className="text-slate-400 hover:text-slate-600"><ArrowRight size={20} /></Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{beneficiary?.full_name ?? 'תיק יולדת'}</h1>
            <p className="text-sm text-slate-500">תאריך לידה: {fmtDate(aid.birth_date)}</p>
          </div>
        </div>
        <StatusBadge status={aid.status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Baby size={16} />
            <span className="text-xs font-semibold text-slate-500 uppercase">פרטי לידה</span>
          </div>
          <p className="text-sm"><span className="text-slate-500">שם תינוק: </span>{aid.baby_name ?? '—'}</p>
          <p className="text-sm"><span className="text-slate-500">תאריך לידה: </span><span className="ltr-num">{fmtDate(aid.birth_date)}</span></p>
        </Card>

        <Card className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <CreditCard size={16} />
            <span className="text-xs font-semibold text-slate-500 uppercase">נדרים קארד</span>
          </div>
          <p className="text-sm"><span className="text-slate-500">מספר כרטיס: </span><span className="ltr-num font-mono text-xs">{aid.card_number ?? '—'}</span></p>
          <p className="text-sm"><span className="text-slate-500">יתרה: </span><span className="text-green-700 font-bold">{fmtCur(aid.card_balance)}</span></p>
          <p className="text-sm"><span className="text-slate-500">טעינה שבועית: </span>{fmtCur(aid.weekly_amount)}</p>
          {expiresIn !== null && (
            <p className={`text-xs font-medium mt-1 ${expiresIn <= 7 ? 'text-red-600' : 'text-slate-500'}`}>
              {expiresIn > 0 ? `פג תוקף בעוד ${expiresIn} ימים` : 'תוקף הכרטיס פג'}
            </p>
          )}
          {aid.card_expires_at && (
            <p className="text-xs text-slate-400 ltr-num">
              תאריך פקיעה: {fmtDate(aid.card_expires_at)}
            </p>
          )}
        </Card>
      </div>

      {(aid.recovery_home || aid.recovery_from) && (
        <Card>
          <div className="flex items-center gap-2 text-indigo-600 mb-3">
            <Home size={16} />
            <span className="text-xs font-semibold text-slate-500 uppercase">בית החלמה</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-slate-500">שם: </span>{aid.recovery_home ?? '—'}</div>
            <div><span className="text-slate-500">מתאריך: </span><span className="ltr-num">{fmtDate(aid.recovery_from)}</span></div>
            <div><span className="text-slate-500">עד תאריך: </span><span className="ltr-num">{fmtDate(aid.recovery_to)}</span></div>
          </div>
        </Card>
      )}

      {aid.notes && (
        <Card>
          <h2 className="text-xs font-semibold text-slate-500 uppercase mb-2">הערות</h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{aid.notes}</p>
        </Card>
      )}
    </div>
  )
}
