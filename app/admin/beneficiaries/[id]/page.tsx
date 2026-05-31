import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Phone, MapPin, Calendar, Users, GitBranch, ChevronLeft } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { Beneficiary } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import Card from '@/components/ui/Card'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import BeneficiaryActions from './BeneficiaryActions'

async function getBeneficiary(id: string): Promise<Beneficiary | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('id', id)
      .single()
    return data
  } catch {
    return null
  }
}

// Walk the lineage tree from the selected node up to the root → ordered path of names
async function getLineagePath(nodeId?: string): Promise<string[]> {
  if (!nodeId || !isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('lineage_nodes')
      .select('id, name, parent_id')
    if (!data) return []
    const map = new Map(data.map(n => [n.id, n]))
    const path: string[] = []
    let cur = map.get(nodeId)
    let guard = 0
    while (cur && guard < 50) {
      path.unshift(cur.name)
      cur = cur.parent_id ? map.get(cur.parent_id) : undefined
      guard++
    }
    return path
  } catch {
    return []
  }
}

export default async function BeneficiaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const beneficiary = await getBeneficiary(id)
  const lineagePath = await getLineagePath(beneficiary?.lineage_node_id)

  if (!beneficiary && isSupabaseConfigured()) notFound()

  if (!beneficiary) {
    return (
      <div className="flex flex-col gap-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <Link href="/admin/beneficiaries" className="text-slate-400 hover:text-slate-600">
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
          <Link href="/admin/beneficiaries" className="text-slate-400 hover:text-slate-600">
            <ArrowRight size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{[beneficiary.family_name, beneficiary.full_name].filter(Boolean).join(' ')}</h1>
            <p className="text-sm text-slate-500 ltr-num">{beneficiary.id_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={beneficiary.eligibility_status} />
          <BeneficiaryActions id={id} name={[beneficiary.family_name, beneficiary.full_name].filter(Boolean).join(' ')} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-xs font-semibold text-slate-500 uppercase mb-3">פרטי הבעל</h2>
          <div className="space-y-2.5">
            <DetailRow label="שם משפחה" value={beneficiary.family_name ?? '—'} />
            <DetailRow label="שם פרטי" value={beneficiary.full_name} />
            <DetailRow label={beneficiary.id_doc_type === 'passport' ? 'דרכון' : 'ת.ז.'} value={beneficiary.id_number} ltr />
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
          </div>
        </Card>
      </div>

      {beneficiary.spouse_name && (
        <Card>
          <h2 className="text-xs font-semibold text-slate-500 uppercase mb-3">פרטי האישה</h2>
          <div className="space-y-2.5">
            <DetailRow label="שם" value={beneficiary.spouse_name} />
            {beneficiary.spouse_id_number && (
              <DetailRow label={beneficiary.spouse_doc_type === 'passport' ? 'דרכון' : 'ת.ז.'} value={beneficiary.spouse_id_number} ltr />
            )}
            {beneficiary.spouse_birth_date && (
              <DetailRow label="תאריך לידה" value={formatDate(beneficiary.spouse_birth_date)} />
            )}
          </div>
        </Card>
      )}

      {/* ── Lineage / generations ── */}
      {(lineagePath.length > 0 || (Array.isArray(beneficiary.lineage_manual) && beneficiary.lineage_manual.length > 0)) && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={16} className="text-indigo-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase">שיוך שושלת</h2>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {lineagePath.map((name, i) => (
              <span key={`t-${i}`} className="flex items-center gap-1.5">
                {i > 0 && <ChevronLeft size={12} className="text-slate-300" />}
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <span className="text-indigo-400 ml-1">דור {i + 1}</span>
                  {name}
                </span>
              </span>
            ))}
            {Array.isArray(beneficiary.lineage_manual) &&
              (beneficiary.lineage_manual as string[]).map((name, i) => (
                <span key={`m-${i}`} className="flex items-center gap-1.5">
                  <ChevronLeft size={12} className="text-slate-300" />
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    <span className="text-amber-400 ml-1">דור {lineagePath.length + 1 + i}</span>
                    {name}
                  </span>
                </span>
              ))}
          </div>
        </Card>
      )}

      {Array.isArray(beneficiary.children) && (beneficiary.children as unknown[]).length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-indigo-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase">ילדים ({(beneficiary.children as unknown[]).length})</h2>
          </div>
          <div className="flex flex-col gap-2">
            {(beneficiary.children as { name: string; id_number?: string; doc_type?: string; gender?: string; birth_date?: string }[]).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                <span className="font-medium text-slate-800">{c.name}</span>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {c.gender && <span>{c.gender === 'male' ? 'זכר' : 'נקבה'}</span>}
                  {c.birth_date && <span>{formatDate(c.birth_date)}</span>}
                  {c.id_number && <span className="ltr-num font-mono">{c.id_number}</span>}
                </div>
              </div>
            ))}
          </div>
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
