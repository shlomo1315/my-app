'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { GitBranch, ChevronLeft, Loader2, Heart, User, Phone, MapPin, Users, FileText } from 'lucide-react'

const MARITAL_OPTIONS = [
  'נשוי', 'נשואה', 'גרוש', 'גרושה', 'אלמן', 'אלמנה',
]
// All remaining statuses involve a spouse (current / former / deceased)
const MARRIED_STATUSES = MARITAL_OPTIONS

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LineageNode {
  id: string
  name: string
  generation: number
  parent_id: string | null
}

function LineageCascade({
  initialNodeId,
  onSelect,
}: {
  initialNodeId?: string
  onSelect: (nodeId: string, path: string[]) => void
}) {
  const [levels, setLevels] = useState<
    { nodes: LineageNode[]; selected: string | null; selectedName: string }[]
  >([])
  const [loading, setLoading] = useState(false)

  const loadLevel = useCallback(async (parentId: string | null, levelIdx: number) => {
    setLoading(true)
    try {
      const url = parentId ? `/api/lineage?parent_id=${parentId}` : '/api/lineage'
      const res = await fetch(url)
      const data = await res.json()
      setLevels(prev => {
        const next = prev.slice(0, levelIdx)
        if ((data.nodes ?? []).length > 0) {
          next.push({ nodes: data.nodes, selected: null, selectedName: '' })
        }
        return next
      })
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadLevel(null, 0) }, [loadLevel])

  const handleSelect = async (levelIdx: number, node: LineageNode) => {
    const currentPath = levels.slice(0, levelIdx).map(l => l.selectedName).concat(node.name)
    setLevels(prev =>
      prev.slice(0, levelIdx + 1).map((l, i) =>
        i === levelIdx ? { ...l, selected: node.id, selectedName: node.name } : l
      )
    )
    setLoading(true)
    try {
      const res = await fetch(`/api/lineage?parent_id=${node.id}`)
      const data = await res.json()
      const children: LineageNode[] = data.nodes ?? []
      setLevels(prev => {
        const next = prev.slice(0, levelIdx + 1)
        if (children.length > 0) {
          next.push({ nodes: children, selected: null, selectedName: '' })
          onSelect('', currentPath)
        } else {
          onSelect(node.id, currentPath)
        }
        return next
      })
    } catch {
      onSelect(node.id, currentPath)
    }
    setLoading(false)
  }

  if (levels.length === 0 && loading) {
    return <div className="text-sm text-slate-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" />טוען...</div>
  }

  return (
    <div className="flex flex-col gap-3">
      {levels.map((level, idx) => (
        <div key={idx}>
          <p className="text-xs font-medium text-slate-500 mb-1.5">
            {idx === 0 ? 'דור ראשון:' : `המשך דור ${idx + 1}:`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {level.nodes.map(node => (
              <button
                key={node.id}
                type="button"
                onClick={() => handleSelect(idx, node)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  level.selected === node.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
              >
                {node.name}
              </button>
            ))}
            {loading && idx === levels.length - 1 && (
              <Loader2 size={14} className="animate-spin text-slate-400 self-center" />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function Section({ title, icon: Icon, children }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-indigo-500" />
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Field({ label, required, error, children }: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">
        {label}{required && <span className="text-red-500 mr-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function FInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400 w-full ${className}`}
      {...props}
    />
  )
}

interface FormState {
  id_number: string
  full_name: string
  phone: string
  phone2: string
  email: string
  address: string
  city: string
  birth_date: string
  gender: string
  marital_status: string
  spouse_name: string
  spouse_id_number: string
  children_count: string
  notes: string
  lineage_node_id: string
}

interface Props {
  defaultValues?: Partial<FormState & { lineage_node_id: string }>
  beneficiaryId?: string
}

export default function BeneficiaryForm({ defaultValues, beneficiaryId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const isEdit = !!beneficiaryId

  const [form, setForm] = useState<FormState>({
    id_number: defaultValues?.id_number ?? '',
    full_name: defaultValues?.full_name ?? '',
    phone: defaultValues?.phone ?? '',
    phone2: defaultValues?.phone2 ?? '',
    email: defaultValues?.email ?? '',
    address: defaultValues?.address ?? '',
    city: defaultValues?.city ?? '',
    birth_date: defaultValues?.birth_date ?? '',
    gender: defaultValues?.gender ?? '',
    marital_status: defaultValues?.marital_status ?? '',
    spouse_name: defaultValues?.spouse_name ?? '',
    spouse_id_number: defaultValues?.spouse_id_number ?? '',
    children_count: String(defaultValues?.children_count ?? '0'),
    notes: defaultValues?.notes ?? '',
    lineage_node_id: defaultValues?.lineage_node_id ?? '',
  })
  const [lineagePath, setLineagePath] = useState<string[]>([])

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const showSpouseFields = MARRIED_STATUSES.includes(form.marital_status)

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {}

    // מצב משפחתי
    if (!form.marital_status) errs.marital_status = 'יש לבחור מצב משפחתי'

    // פרטים אישיים
    if (!form.id_number.trim()) errs.id_number = 'שדה חובה'
    else if (!/^\d{5,9}$/.test(form.id_number.replace(/\D/g, ''))) errs.id_number = 'ת.ז. לא תקינה'
    if (!form.full_name.trim()) errs.full_name = 'שדה חובה'
    if (!form.gender) errs.gender = 'שדה חובה'
    if (!form.birth_date) errs.birth_date = 'שדה חובה'

    // בן/בת הזוג
    if (showSpouseFields) {
      if (!form.spouse_name.trim()) errs.spouse_name = 'שדה חובה'
      if (!form.spouse_id_number.trim()) errs.spouse_id_number = 'שדה חובה'
      else if (!/^\d{5,9}$/.test(form.spouse_id_number.replace(/\D/g, ''))) errs.spouse_id_number = 'ת.ז. לא תקינה'
    }

    // פרטי קשר
    if (!form.phone.trim()) errs.phone = 'שדה חובה'
    if (!form.email.trim()) errs.email = 'שדה חובה'
    else if (!EMAIL_REGEX.test(form.email.trim())) errs.email = 'אימייל לא תקין'

    // כתובת
    if (!form.address.trim()) errs.address = 'שדה חובה'
    if (!form.city.trim()) errs.city = 'שדה חובה'

    // שיוך שושלת
    if (!form.lineage_node_id) errs.lineage_node_id = 'יש לבחור שיוך שושלת'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        id_number: form.id_number.replace(/\D/g, ''),
        full_name: form.full_name.trim(),
        phone: form.phone || null,
        phone2: form.phone2 || null,
        email: form.email || null,
        address: form.address || null,
        city: form.city || null,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        marital_status: form.marital_status || null,
        spouse_name: showSpouseFields ? (form.spouse_name || null) : null,
        spouse_id_number: showSpouseFields ? (form.spouse_id_number.replace(/\D/g, '') || null) : null,
        children_count: parseInt(form.children_count) || 0,
        notes: form.notes || null,
        lineage_node_id: form.lineage_node_id || null,
      }

      if (isEdit) {
        const { error } = await supabase.from('beneficiaries').update(payload).eq('id', beneficiaryId)
        if (error) throw error
        router.back()
      } else {
        const { data: inserted, error } = await supabase
          .from('beneficiaries')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        router.push(`/admin/beneficiaries/${inserted.id}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`שגיאה בשמירה: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">

      {/* ── Marital status FIRST ── */}
      <Section title="מצב משפחתי" icon={Heart}>
        <div className="flex flex-wrap gap-2 mb-1">
          {MARITAL_OPTIONS.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => setForm(f => ({ ...f, marital_status: opt }))}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                form.marital_status === opt
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {errors.marital_status && <p className="text-xs text-red-500 mt-1">{errors.marital_status}</p>}

        {showSpouseFields && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
            <p className="col-span-2 text-xs font-medium text-slate-500">
              {form.marital_status === 'אלמן' || form.marital_status === 'אלמנה'
                ? 'פרטי בן/בת הזוג המנוח/ה'
                : form.marital_status === 'גרוש' || form.marital_status === 'גרושה'
                ? 'פרטי בן/בת הזוג לשעבר'
                : 'פרטי בן/בת הזוג'}
            </p>
            <Field label="שם בן/בת הזוג" required error={errors.spouse_name}>
              <FInput value={form.spouse_name} onChange={set('spouse_name')} placeholder="שם מלא" required />
            </Field>
            <Field label='ת"ז בן/בת הזוג' required error={errors.spouse_id_number}>
              <FInput
                value={form.spouse_id_number}
                onChange={set('spouse_id_number')}
                placeholder="123456789"
                dir="ltr"
                inputMode="numeric"
                maxLength={9}
                required
              />
            </Field>
          </div>
        )}
      </Section>

      {/* ── Personal ── */}
      <Section title="פרטים אישיים" icon={User}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="שם הבעל" required error={errors.full_name}>
            <FInput value={form.full_name} onChange={set('full_name')} placeholder="ישראל ישראלי" required />
          </Field>
          <Field label='תעודת זהות' required error={errors.id_number}>
            <FInput
              value={form.id_number}
              onChange={set('id_number')}
              placeholder="123456789"
              dir="ltr"
              inputMode="numeric"
              maxLength={9}
              required
            />
          </Field>
          <Field label="מגדר" required error={errors.gender}>
            <select
              value={form.gender}
              onChange={set('gender')}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              required
            >
              <option value="">בחר...</option>
              <option value="male">זכר</option>
              <option value="female">נקבה</option>
            </select>
          </Field>
          <Field label="תאריך לידה" required error={errors.birth_date}>
            <FInput type="date" value={form.birth_date} onChange={set('birth_date')} dir="ltr" required />
          </Field>
          <Field label="מספר ילדים" required>
            <FInput type="number" min="0" max="30" value={form.children_count} onChange={set('children_count')} required />
          </Field>
        </div>
      </Section>

      {/* ── Contact ── */}
      <Section title="פרטי קשר" icon={Phone}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="טלפון ראשי" required error={errors.phone}>
            <FInput type="tel" value={form.phone} onChange={set('phone')} placeholder="050-0000000" dir="ltr" required />
          </Field>
          <Field label="טלפון נוסף">
            <FInput type="tel" value={form.phone2} onChange={set('phone2')} placeholder="050-0000000" dir="ltr" />
          </Field>
          <Field label="אימייל" required error={errors.email}>
            <FInput type="email" value={form.email} onChange={set('email')} placeholder="name@example.com" dir="ltr" required />
          </Field>
        </div>
      </Section>

      {/* ── Address ── */}
      <Section title="כתובת" icon={MapPin}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="רחוב ומספר" required error={errors.address}>
            <FInput value={form.address} onChange={set('address')} placeholder="הרב קוק 12" required />
          </Field>
          <Field label="עיר" required error={errors.city}>
            <FInput value={form.city} onChange={set('city')} placeholder="בני ברק" required />
          </Field>
        </div>
      </Section>

      {/* ── Lineage ── */}
      <Section title="שיוך שושלת *" icon={GitBranch}>
        <p className="text-xs text-slate-500 mb-3">
          בחר את הענף שהנתמך שייך אליו. לחץ על שם ואז המשך לבחור את הדור הבא.
        </p>
        {errors.lineage_node_id && (
          <p className="text-xs text-red-500 mb-3">{errors.lineage_node_id}</p>
        )}

        {(form.lineage_node_id || lineagePath.length > 0) && (
          <div className="flex items-center gap-1 flex-wrap mb-3 p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
            <span className="text-xs text-indigo-600 font-medium ml-1">נבחר:</span>
            {lineagePath.map((name, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronLeft size={11} className="text-indigo-300" />}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  i === lineagePath.length - 1
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {name}
                </span>
              </span>
            ))}
          </div>
        )}

        <LineageCascade
          initialNodeId={form.lineage_node_id}
          onSelect={(nodeId, path) => {
            setForm(f => ({ ...f, lineage_node_id: nodeId }))
            setLineagePath(path)
          }}
        />

        {form.lineage_node_id && (
          <button
            type="button"
            onClick={() => { setForm(f => ({ ...f, lineage_node_id: '' })); setLineagePath([]) }}
            className="mt-2 text-xs text-slate-400 hover:text-slate-600 underline"
          >
            נקה בחירה
          </button>
        )}
      </Section>

      {/* ── Notes ── */}
      <Section title="הערות" icon={FileText}>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          rows={3}
          placeholder="הערות נוספות..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </Section>

      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          יש שדות חובה שלא מולאו או שאינם תקינים. אנא בדוק את השדות המסומנים באדום.
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={() => router.back()}>ביטול</Button>
        <Button type="submit" loading={saving}>
          {isEdit ? 'שמור שינויים' : 'רישום נתמך'}
        </Button>
      </div>
    </form>
  )
}
