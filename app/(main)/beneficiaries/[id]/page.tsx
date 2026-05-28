import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Phone, MapPin, Calendar, Users, Edit } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { Beneficiary } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import Card from '@/components/ui/Card'
import { GENDER_LABELS } from '@/types'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

async function getBeneficiary(id: string): Promise<Beneficiary | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('beneficiaries')
      .select('*, family:families(*)')
      .eq('id', id)
      .single()
    return data
  } catch {
    return null
  }
}

export default async function BeneficiaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const beneficiary = await getBeneficiary(id)

  if (!beneficiary && isSupabaseConfigured()) notFound()

  if (!beneficiary) {
    return (
      <div className="flex flex-col gap-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <Link href="/beneficiaries" className="text-slate-400 hover:text-slate-600">
            <ArrowRight size={20} />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">פרטי נתמך</h1>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          נתמך זה אינו זמין. הגדר Supabase כדי לראות נתונים אמיתיים.
        </div>
      </div>
    )
  }

  const formatDate = (d?: string) =>
    d ? format(new Date(d), 'dd/MM/yyyy', { locale: he }) : '—'

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/beneficiaries" className="text-slate-400 hover:text-slate-600">
            <ArrowRight size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{beneficiary.full_name}</h1>
            <p className="text-sm text-slate-500 ltr-num">{beneficiary.id_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={beneficiary.eligibility_status} />
          <Link href={`/beneficiaries/${id}/edit`}>
            <button className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 border border-slate-300 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors">
              <Edit size={14} />
              עריכה
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-xs font-semibold text-slate-500 uppercase mb-3">פרטים אישיים</h2>
          <div className="space-y-2.5">
            <DetailRow label="שם מלא" value={beneficiary.full_name} />
            <DetailRow label="ת.ז." value={beneficiary.id_number} ltr />
            <DetailRow label="מגדר" value={beneficiary.gender ? GENDER_LABELS[beneficiary.gender] : '—'} />
            <DetailRow label="תאריך לידה" value={formatDate(beneficiary.birth_date)} />
            <DetailRow label="מצב משפחתי" value={beneficiary.marital_status ?? '—'} />
            <DetailRow label="מספר ילדים" value={String(beneficiary.children_count)} />
          </div>
        </Card>

        <Card>
          <h2 className="text-xs font-semibold text-slate-500 uppercase mb-3">פרטי קשר</h2>
          <div className="space-y-2.5">
            <DetailRow label="טלפון ראשי" value={beneficiary.phone ?? '—'} ltr icon={<Phone size={13} />} />
            <DetailRow label="טלפון משני" value={beneficiary.phone2 ?? '—'} ltr />
            <DetailRow label="אימייל" value={beneficiary.email ?? '—'} ltr />
            <DetailRow label="כתובת" value={beneficiary.address ?? '—'} icon={<MapPin size={13} />} />
            <DetailRow label="עיר" value={beneficiary.city ?? '—'} />
            <DetailRow label="מספר נדרים" value={beneficiary.nedarim_id ?? '—'} ltr />
          </div>
        </Card>
      </div>

      {beneficiary.family && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-indigo-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase">משפחה</h2>
          </div>
          <Link
            href={`/families/${beneficiary.family_id}`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            {(beneficiary.family as { family_name: string }).family_name}
          </Link>
        </Card>
      )}

      {beneficiary.notes && (
        <Card>
          <h2 className="text-xs font-semibold text-slate-500 uppercase mb-2">הערות</h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{beneficiary.notes}</p>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-400">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <Calendar size={16} className="mx-auto mb-1 text-slate-300" />
          <p className="font-medium text-slate-600">תאריך רישום</p>
          <p>{formatDate(beneficiary.created_at)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <Calendar size={16} className="mx-auto mb-1 text-slate-300" />
          <p className="font-medium text-slate-600">עדכון אחרון</p>
          <p>{formatDate(beneficiary.updated_at)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${beneficiary.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
          <p className="font-medium text-slate-600">סטטוס</p>
          <p>{beneficiary.is_active ? 'פעיל' : 'לא פעיל'}</p>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, ltr, icon }: { label: string; value: string; ltr?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-slate-500 flex-shrink-0 flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className={`text-sm text-slate-800 ${ltr ? 'ltr-num text-left' : ''}`}>{value}</span>
    </div>
  )
}
