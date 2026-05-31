import { cookies } from 'next/headers'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { Baby, Building2, CalendarDays, Clock } from 'lucide-react'
import { format, differenceInDays, addDays, isAfter } from 'date-fns'
import { he } from 'date-fns/locale'
import type { MaternityAid } from '@/types'
import PortalClientWrapper from './PortalClientWrapper'

type MotherRef = {
  full_name?: string
  family_name?: string
  spouse_name?: string
  spouse_id_number?: string
}

const motherName = (m?: MotherRef) => {
  if (!m) return '—'
  if (m.spouse_name) return [m.family_name, m.spouse_name].filter(Boolean).join(' ')
  return [m.family_name, m.full_name].filter(Boolean).join(' ') || '—'
}

const sixWeeksEnd = (aid: MaternityAid): Date => {
  if (aid.six_weeks_end) return new Date(aid.six_weeks_end)
  return addDays(new Date(aid.birth_date), 42)
}

async function getActiveAids(home: string): Promise<MaternityAid[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('maternity_aids')
      .select('*, beneficiary:beneficiaries(id, full_name, family_name, spouse_name, spouse_id_number)')
      .eq('status', 'active')
      .eq('recovery_home', home)
      .order('birth_date', { ascending: false })
    if (!data) return []
    const now = new Date()
    return data.filter((a: MaternityAid) => isAfter(sixWeeksEnd(a), now))
  } catch {
    return []
  }
}

function cookieName(home: string) {
  return `portal_${Buffer.from(home).toString('base64url').slice(0, 20)}`
}

export default async function RecoveryHomePortal({
  params,
}: {
  params: Promise<{ home: string }>
}) {
  const { home: homeEncoded } = await params
  const homeName = decodeURIComponent(homeEncoded)

  // Check auth cookie
  const cookieStore = await cookies()
  const isAuthed = cookieStore.get(cookieName(homeName))?.value === '1'

  if (!isAuthed) {
    return <PortalClientWrapper home={homeName} />
  }

  const aids = await getActiveAids(homeName)
  const today = new Date()
  const todayStr = format(today, 'EEEE, d בMMMM yyyy', { locale: he })

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-white rounded-xl shadow border border-sky-200 flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="לוגו" className="w-full h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">היכל החתם סופר</p>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={20} className="text-indigo-500" />
              {homeName}
            </h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
              <CalendarDays size={13} />
              {todayStr}
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5">
          <Baby size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-indigo-700">
            מוצגות יולדות <strong>מאושרות</strong> שנמצאות בתוך תקופת 6 השבועות.
            הרשימה מתעדכנת אוטומטית — יולדת שעברה 42 יום מהלידה אינה מוצגת עוד.
          </p>
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">יולדות פעילות</h2>
          <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold rounded-full px-3 py-1">
            {aids.length} נרשמות
          </span>
        </div>

        {/* Table */}
        {aids.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <Baby size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">אין יולדות פעילות כרגע</p>
            <p className="text-slate-400 text-sm mt-1">יולדות שתאריך הלידה שלהן בתוך 6 שבועות יופיעו כאן</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['שם היולדת', 'ת.ז. האישה', 'שם התינוק', 'תאריך לידה', 'ימים שנותרו'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {aids.map(aid => {
                    const m = aid.beneficiary as MotherRef | undefined
                    const endDate = sixWeeksEnd(aid)
                    const daysLeft = differenceInDays(endDate, today)
                    const urgent = daysLeft <= 7
                    return (
                      <tr key={aid.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3.5 font-medium text-slate-800">{motherName(m)}</td>
                        <td className="px-4 py-3.5 text-xs font-mono text-slate-600 ltr-num">
                          {(m as { spouse_id_number?: string })?.spouse_id_number ?? '—'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">{aid.baby_name ?? '—'}</td>
                        <td className="px-4 py-3.5 text-slate-600 ltr-num whitespace-nowrap">
                          {aid.birth_date ? format(new Date(aid.birth_date), 'dd/MM/yyyy') : '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 ${
                            urgent
                              ? 'bg-red-100 text-red-700'
                              : daysLeft <= 14
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            <Clock size={11} />
                            {daysLeft} ימים
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          מערכת ניהול היכל החתם סופר · לשימוש פנימי בלבד
        </p>
      </div>
    </div>
  )
}
