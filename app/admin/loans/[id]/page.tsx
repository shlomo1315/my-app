import Link from 'next/link'
import { ArrowRight, CreditCard, CheckCircle, AlertCircle, FileText, Edit } from 'lucide-react'
import { notFound } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { Loan, LoanPayment } from '@/types'
import Card from '@/components/ui/Card'
import { LoanStatusControl, DeleteLoanButton } from '../LoanControls'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

async function getLoan(id: string): Promise<(Loan & { payments: LoanPayment[] }) | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createClient()
    const [{ data: loan }, { data: payments }] = await Promise.all([
      supabase.from('loans').select('*, beneficiary:beneficiaries(full_name, id_number, phone)').eq('id', id).single(),
      supabase.from('loan_payments').select('*').eq('loan_id', id).order('paid_at', { ascending: false }),
    ])
    return loan ? { ...loan, payments: payments ?? [] } : null
  } catch {
    return null
  }
}

const fmtDate = (d?: string) => d ? format(new Date(d), 'dd/MM/yyyy', { locale: he }) : '—'
const fmtCur = (n: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const loan = await getLoan(id)

  if (!loan && isSupabaseConfigured()) notFound()

  if (!loan) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/admin/loans" className="text-slate-400 hover:text-slate-600"><ArrowRight size={20} /></Link>
          <h1 className="text-xl font-bold">פרטי הלוואה</h1>
        </div>
        <div className="bg-white rounded-xl border p-8 text-center text-slate-400">הגדר Supabase לצפייה</div>
      </div>
    )
  }

  const b = loan.beneficiary as { full_name: string; id_number: string; phone?: string } | undefined
  const totalPaid = loan.payments.reduce((s, p) => s + p.amount, 0)
  const remaining = loan.amount - totalPaid
  const progress = Math.min(100, Math.round((totalPaid / loan.amount) * 100))

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/loans" className="text-slate-400 hover:text-slate-600"><ArrowRight size={20} /></Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{b?.full_name ?? 'פרטי הלוואה'}</h1>
            <p className="text-sm text-slate-500 ltr-num">{b?.id_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LoanStatusControl loan={loan} />
          <Link href={`/admin/loans/${loan.id}/edit`}>
            <button className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 transition-colors">
              <Edit size={14} /> עריכה
            </button>
          </Link>
          <DeleteLoanButton loanId={loan.id} redirect />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-indigo-600 mb-3">
            <CreditCard size={16} />
            <span className="text-xs font-semibold text-slate-500 uppercase">פרטי הלוואה</span>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-slate-500">סכום: </span><span className="font-bold ltr-num">{fmtCur(loan.amount)}</span></p>
            <p><span className="text-slate-500">מספר תשלומים: </span>{loan.installments}</p>
            <p><span className="text-slate-500">מטרה: </span>{loan.purpose ?? '—'}</p>
            {loan.purpose_details && <p><span className="text-slate-500">פירוט מטרה: </span>{loan.purpose_details}</p>}
            {loan.declaration && <p><span className="text-slate-500">פנייה קודמת לגמ״ח: </span>{loan.declaration}</p>}
            <p><span className="text-slate-500">תאריך פתיחה: </span><span className="ltr-num">{fmtDate(loan.created_at)}</span></p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">מצב החזר</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>התקדמות</span>
                <span className="ltr-num">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-sm"><span className="text-slate-500">שולם: </span><span className="text-green-700 font-bold ltr-num">{fmtCur(totalPaid)}</span></p>
            <p className="text-sm"><span className="text-slate-500">נותר: </span><span className="text-red-600 font-bold ltr-num">{fmtCur(remaining)}</span></p>
            <p className="text-sm"><span className="text-slate-500">תשלומים ששולמו: </span>{loan.payments.length}</p>
          </div>
        </Card>
      </div>

      <Card padding="none">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">היסטוריית תשלומים</h2>
          <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ הוסף תשלום</button>
        </div>
        {loan.payments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">לא נרשמו תשלומים עדיין</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {loan.payments.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {p.is_late
                    ? <AlertCircle size={16} className="text-red-500" />
                    : <CheckCircle size={16} className="text-green-500" />
                  }
                  <span className="text-sm text-slate-700 ltr-num">{fmtDate(p.paid_at)}</span>
                  {p.payment_method && <span className="text-xs text-slate-400">({p.payment_method})</span>}
                </div>
                <span className={`text-sm font-semibold ltr-num ${p.is_late ? 'text-red-600' : 'text-slate-800'}`}>
                  {fmtCur(p.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {Array.isArray(loan.document_urls) && loan.document_urls.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 text-indigo-600 mb-3">
            <FileText size={16} />
            <span className="text-xs font-semibold text-slate-500 uppercase">מסמכים מצורפים</span>
          </div>
          <div className="flex flex-col gap-2">
            {loan.document_urls.map((d, i) => (
              <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg px-3 py-2 transition-colors">
                <FileText size={14} className="flex-shrink-0" />
                <span className="truncate">{d.name || `מסמך ${i + 1}`}</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {loan.notes && (
        <Card>
          <h2 className="text-xs font-semibold text-slate-500 uppercase mb-2">הערות</h2>
          <p className="text-sm text-slate-700">{loan.notes}</p>
        </Card>
      )}
    </div>
  )
}
