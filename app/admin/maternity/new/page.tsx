'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Search, Loader2, Check, AlertTriangle, Upload, X, Baby } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, addWeeks } from 'date-fns'
import { he } from 'date-fns/locale'
import type { Beneficiary } from '@/types'

const RECOVERY_HOMES = ['אם וילד', 'טלזסטון', 'ביכורים']

function sixWeeksEnd(birthDate: string): string {
  if (!birthDate) return ''
  const d = new Date(birthDate)
  return format(addWeeks(d, 6), 'dd/MM/yyyy', { locale: he })
}

export default function NewMaternityPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  // Step 1 — mother lookup
  const [idInput, setIdInput] = useState('')
  const [looking, setLooking] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [mother, setMother] = useState<Beneficiary | null>(null)

  // Step 2 — baby details
  const [babyIdType, setBabyIdType] = useState<'id' | 'passport'>('id')
  const [babyIdNumber, setBabyIdNumber] = useState('')
  const [babyGender, setBabyGender] = useState<'male' | 'female' | ''>('')
  const [babyBirthDate, setBabyBirthDate] = useState('')
  const [recoveryHome, setRecoveryHome] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [certFile, setCertFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const lookupMother = async () => {
    if (!idInput.trim()) return
    setLooking(true); setLookupError(''); setMother(null)
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('id_number', idInput.trim())
        .single()
      if (error || !data) {
        setLookupError('לא נמצאה נתמכת עם תעודת זהות זו במערכת. יש לרשום אותה תחילה בכרטסת נתמכים.')
      } else {
        setMother(data)
      }
    } catch {
      setLookupError('שגיאת רשת — נסה שוב')
    }
    setLooking(false)
  }

  const handleSubmit = async () => {
    if (!mother) return
    if (!babyBirthDate) { setSaveError('תאריך לידת תינוק חובה'); return }
    setSaving(true); setSaveError('')
    try {
      let certUrl: string | undefined
      if (certFile) {
        const path = `maternity/${mother.id}/${Date.now()}_${certFile.name}`
        const { error: upErr } = await supabase.storage.from('documents').upload(path, certFile)
        if (!upErr) {
          const { data: pub } = supabase.storage.from('documents').getPublicUrl(path)
          certUrl = pub.publicUrl
        }
      }

      const sixEnd = addWeeks(new Date(babyBirthDate), 6).toISOString().split('T')[0]

      const { data: inserted, error } = await supabase
        .from('maternity_aids')
        .insert({
          beneficiary_id: mother.id,
          birth_date: babyBirthDate,
          baby_id_type: babyIdType,
          baby_id_number: babyIdNumber || null,
          baby_gender: babyGender || null,
          birth_certificate_url: certUrl ?? null,
          recovery_home: recoveryHome || null,
          card_number: cardNumber || null,
          six_weeks_end: sixEnd,
          total_weeks: 6,
          card_balance: 0,
          weekly_amount: 0,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error
      router.push(`/admin/maternity/${inserted.id}`)
    } catch (e) {
      setSaveError('שגיאה בשמירה — נסה שוב')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const statusWarning = mother && mother.eligibility_status !== 'approved'

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/maternity" className="text-slate-400 hover:text-slate-600"><ArrowRight size={20} /></Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">לידה חדשה</h1>
          <p className="text-sm text-slate-500">פתיחת תיק סיוע יולדות</p>
        </div>
      </div>

      {/* ── Step 1: Mother lookup ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">1</span>
          פרטי האם
        </h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={idInput}
            onChange={e => setIdInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookupMother()}
            placeholder="הכנס מספר תעודת זהות של האם"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left ltr-num"
            dir="ltr"
          />
          <button
            onClick={lookupMother}
            disabled={looking || !idInput.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {looking ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            חיפוש
          </button>
        </div>

        {lookupError && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
            {lookupError}
          </div>
        )}

        {mother && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-green-800">
                <Check size={15} /> נמצאה — {[mother.family_name, mother.full_name].filter(Boolean).join(' ')}
              </span>
              <button onClick={() => { setMother(null); setIdInput('') }} className="text-slate-400 hover:text-slate-600"><X size={15} /></button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-green-700 mt-1">
              <span>ת.ז.: <span className="ltr-num font-mono">{mother.id_number}</span></span>
              {mother.phone && <span>טלפון: <span className="ltr-num">{mother.phone}</span></span>}
              {mother.city && <span>עיר: {mother.city}</span>}
              {mother.spouse_name && <span>בן/בת זוג: {mother.spouse_name}</span>}
            </div>
            {statusWarning && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
                <AlertTriangle size={13} />
                שים לב: הנתמכת בסטטוס "{mother.eligibility_status === 'pending' || mother.eligibility_status === 'review' ? 'ממתין לאישור' : 'לא מאושר'}" — ניתן להמשיך אך מומלץ לאשר קודם.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Step 2: Baby details (shown only after mother found) ────────── */}
      {mother && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">2</span>
              פרטי התינוק
            </h2>

            {/* ID type + number */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-600">סוג מסמך תינוק</label>
              <div className="flex gap-2">
                {(['id', 'passport'] as const).map(t => (
                  <button key={t} onClick={() => setBabyIdType(t)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${babyIdType === t ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                    {t === 'id' ? 'תעודת זהות' : 'דרכון'}
                  </button>
                ))}
              </div>
              <input
                type="text" value={babyIdNumber} onChange={e => setBabyIdNumber(e.target.value)}
                placeholder={babyIdType === 'id' ? 'מספר תעודת זהות תינוק' : 'מספר דרכון תינוק'}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ltr-num text-left"
                dir="ltr"
              />
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-600">מין התינוק</label>
              <div className="flex gap-2">
                {([['male', 'זכר'], ['female', 'נקבה']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setBabyGender(val)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${babyGender === val ? (val === 'male' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-pink-500 border-pink-500 text-white') : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Birth date + 6 weeks calc */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-600">תאריך לידת התינוק *</label>
              <input
                type="date" value={babyBirthDate} onChange={e => setBabyBirthDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                dir="ltr"
              />
              {babyBirthDate && (
                <div className="flex items-center gap-2 text-xs bg-indigo-50 text-indigo-700 rounded-lg px-3 py-2 border border-indigo-100">
                  <Baby size={13} />
                  סיום 6 שבועות (תאריך יעד): <span className="font-bold mr-1">{sixWeeksEnd(babyBirthDate)}</span>
                </div>
              )}
            </div>

            {/* Recovery home */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-600">בית החלמה</label>
              <div className="flex gap-2">
                {RECOVERY_HOMES.map(h => (
                  <button key={h} onClick={() => setRecoveryHome(recoveryHome === h ? '' : h)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${recoveryHome === h ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Birth certificate */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-600">אישור לידה (קובץ מצורף)</label>
              <input type="file" ref={fileRef} className="hidden" accept="image/*,.pdf"
                onChange={e => setCertFile(e.target.files?.[0] ?? null)} />
              {certFile ? (
                <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-700">
                  <Check size={14} />
                  <span className="truncate flex-1">{certFile.name}</span>
                  <button onClick={() => { setCertFile(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="text-slate-400 hover:text-red-500 flex-shrink-0"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg px-4 py-4 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                  <Upload size={16} />
                  לחץ להעלאת קובץ (תמונה / PDF)
                </button>
              )}
            </div>
          </div>

          {/* ── Step 3: Nedarim card ──────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">3</span>
              כרטיס נדרים
            </h2>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-600">מספר כרטיס נדרים</label>
              <input
                type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)}
                placeholder="0000-0000-0000-0000"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ltr-num text-left"
                dir="ltr"
              />
            </div>
          </div>

          {/* Submit */}
          {saveError && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle size={14} /> {saveError}
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Link href="/admin/maternity"
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              ביטול
            </Link>
            <button onClick={handleSubmit} disabled={saving || !babyBirthDate}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              פתח תיק יולדת
            </button>
          </div>
        </>
      )}
    </div>
  )
}
