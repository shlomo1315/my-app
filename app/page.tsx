'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Building2,
  Mail,
  KeyRound,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  MapPin,
  Users,
  Clock,
  GitBranch,
  ChevronLeft,
  Heart,
} from 'lucide-react'

type Step = 'email' | 'otp' | 'form' | 'success' | 'already-registered'

const MARITAL_OPTIONS = [
  { value: 'רווק', label: 'רווק' },
  { value: 'רווקה', label: 'רווקה' },
  { value: 'נשוי', label: 'נשוי' },
  { value: 'נשואה', label: 'נשואה' },
  { value: 'גרוש', label: 'גרוש' },
  { value: 'גרושה', label: 'גרושה' },
  { value: 'אלמן', label: 'אלמן' },
  { value: 'אלמנה', label: 'אלמנה' },
]

const MARRIED_STATUSES = ['נשוי', 'נשואה', 'אלמן', 'אלמנה']

const STATUS_LABELS: Record<string, string> = {
  pending: 'בטיפול',
  approved: 'מאושר',
  rejected: 'נדחה',
  review: 'בבדיקה',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-200',
  approved: 'bg-green-100 text-green-800 border border-green-200',
  rejected: 'bg-red-100 text-red-800 border border-red-200',
  review: 'bg-blue-100 text-blue-800 border border-blue-200',
}

// ─── Lineage cascade component ───

interface LineageNode {
  id: string
  name: string
  generation: number
  parent_id: string | null
}

function LineageCascade({
  onSelect,
}: {
  onSelect: (nodeId: string, path: string[]) => void
}) {
  const [levels, setLevels] = useState<
    { nodes: LineageNode[]; selected: string | null; selectedName: string }[]
  >([])
  const [loadingLevel, setLoadingLevel] = useState<number | null>(null)

  const loadLevel = useCallback(
    async (parentId: string | null, levelIdx: number) => {
      setLoadingLevel(levelIdx)
      try {
        const url = parentId ? `/api/lineage?parent_id=${parentId}` : '/api/lineage'
        const res = await fetch(url)
        const data = await res.json()
        setLevels((prev) => {
          const next = prev.slice(0, levelIdx)
          if ((data.nodes ?? []).length > 0) {
            next.push({ nodes: data.nodes, selected: null, selectedName: '' })
          }
          return next
        })
      } catch {
        /* ignore */
      }
      setLoadingLevel(null)
    },
    []
  )

  useEffect(() => {
    loadLevel(null, 0)
  }, [loadLevel])

  const handleSelect = async (levelIdx: number, node: LineageNode) => {
    const currentPath = levels
      .slice(0, levelIdx)
      .map((l) => l.selectedName)
      .concat(node.name)

    setLevels((prev) =>
      prev
        .slice(0, levelIdx + 1)
        .map((l, i) =>
          i === levelIdx ? { ...l, selected: node.id, selectedName: node.name } : l
        )
    )

    // Fetch children
    setLoadingLevel(levelIdx + 1)
    try {
      const res = await fetch(`/api/lineage?parent_id=${node.id}`)
      const data = await res.json()
      const children: LineageNode[] = data.nodes ?? []
      setLevels((prev) => {
        const next = prev.slice(0, levelIdx + 1)
        if (children.length > 0) {
          next.push({ nodes: children, selected: null, selectedName: '' })
          onSelect('', currentPath) // incomplete
        } else {
          onSelect(node.id, currentPath) // final leaf
        }
        return next
      })
    } catch {
      onSelect(node.id, currentPath)
    }
    setLoadingLevel(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {levels.map((level, idx) => (
        <div key={idx}>
          <p className="text-xs font-medium text-slate-500 mb-2">
            {idx === 0 ? 'בחר מהדור הראשון:' : `בחר המשך הדור ${idx + 1}:`}
          </p>
          <div className="flex flex-wrap gap-2">
            {level.nodes.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => handleSelect(idx, node)}
                className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                  level.selected === node.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
              >
                {node.name}
              </button>
            ))}
            {loadingLevel === idx + 1 && (
              <span className="flex items-center gap-1 text-xs text-slate-400 self-center">
                <Loader2 size={12} className="animate-spin" />
                טוען...
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Shared form helpers ───

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

function Input({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400 ${className}`}
      {...props}
    />
  )
}

function SelectInput({
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { id: 'email', label: 'אימות' },
    { id: 'otp', label: 'קוד' },
    { id: 'form', label: 'פרטים' },
    { id: 'success', label: 'סיום' },
  ]
  const order = ['email', 'otp', 'form', 'success', 'already-registered']
  const currentIndex = order.indexOf(current)

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, idx) => {
        const isDone = currentIndex > idx
        const isActive = current === step.id
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  isDone
                    ? 'bg-indigo-600 text-white'
                    : isActive
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isDone ? <CheckCircle2 size={16} /> : idx + 1}
              </div>
              <span
                className={`text-xs ${
                  isActive || isDone ? 'text-indigo-600 font-medium' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-10 h-0.5 mb-4 ${
                  isDone ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main page ───

export default function PublicRegistrationPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [nonce, setNonce] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existingBeneficiary, setExistingBeneficiary] = useState<{
    full_name: string
    eligibility_status: string
    created_at: string
  } | null>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Lineage state
  const [lineageNodeId, setLineageNodeId] = useState('')
  const [lineagePath, setLineagePath] = useState<string[]>([])

  // Form fields
  const [form, setForm] = useState({
    id_number: '',
    full_name: '',
    phone: '',
    phone2: '',
    address: '',
    city: '',
    birth_date: '',
    gender: '',
    marital_status: '',
    spouse_name: '',
    spouse_id_number: '',
    children_count: '0',
    notes: '',
  })

  const setField =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const showSpouseFields = MARRIED_STATUSES.includes(form.marital_status)

  // Step 1 — send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'שגיאה בשליחת הקוד')
      } else {
        setStep('otp')
      }
    } catch {
      setError('שגיאת רשת. אנא נסה שוב.')
    }
    setLoading(false)
  }

  // OTP digit handlers
  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otpDigits]
    next[idx] = val
    setOtpDigits(next)
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus()
  }
  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus()
  }
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtpDigits(text.split(''))
      otpRefs.current[5]?.focus()
    }
    e.preventDefault()
  }

  // Step 2 — verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = otpDigits.join('')
    if (token.length < 6) { setError('אנא הזן את כל 6 הספרות'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'קוד שגוי')
      } else if (data.alreadyRegistered) {
        setExistingBeneficiary(data.beneficiary)
        setStep('already-registered')
      } else {
        setNonce(data.nonce)
        setStep('form')
      }
    } catch {
      setError('שגיאת רשת. אנא נסה שוב.')
    }
    setLoading(false)
  }

  // Step 3 — submit registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.id_number || !form.full_name || !form.phone) {
      setError('אנא מלא את שדות החובה: שם מלא, ת.ז. וטלפון')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          email,
          nonce,
          children_count: parseInt(form.children_count || '0'),
          lineage_node_id: lineageNodeId || null,
          spouse_name: showSpouseFields ? form.spouse_name : null,
          spouse_id_number: showSpouseFields ? form.spouse_id_number : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'שגיאה בשמירת הנתונים')
      } else {
        setStep('success')
      }
    } catch {
      setError('שגיאת רשת. אנא נסה שוב.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight">היכל החתם סופר</h1>
            <p className="text-xs text-slate-500">מערכת רישום ציבורית</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        {step !== 'success' && step !== 'already-registered' && (
          <StepIndicator current={step} />
        )}

        {/* ─── Step 1: Email ─── */}
        {step === 'email' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Mail size={20} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">רישום ראשוני</h2>
                <p className="text-sm text-slate-500">נשלח קוד אימות לאימייל שלך</p>
              </div>
            </div>
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <Field label="כתובת אימייל" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  dir="ltr"
                  autoComplete="email"
                />
              </Field>
              {error && <ErrorBox message={error} />}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                {loading ? 'שולח...' : 'שלח קוד אימות'}
              </button>
            </form>
          </div>
        )}

        {/* ─── Step 2: OTP ─── */}
        {step === 'otp' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <KeyRound size={20} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">הזן קוד אימות</h2>
                <p className="text-sm text-slate-500">
                  שלחנו קוד בן 6 ספרות אל{' '}
                  <span className="font-medium text-slate-700" dir="ltr">
                    {email}
                  </span>
                </p>
              </div>
            </div>
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <div className="flex gap-2 justify-center" dir="ltr">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-colors"
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                <Clock size={13} />
                <span>הקוד בתוקף ל-10 דקות. בדוק גם בתיקיית ספאם.</span>
              </div>
              {error && <ErrorBox message={error} />}
              <button
                type="submit"
                disabled={loading || otpDigits.some((d) => !d)}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {loading ? 'מאמת...' : 'אמת קוד'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtpDigits(['', '', '', '', '', '']); setError('') }}
                className="text-sm text-slate-500 hover:text-indigo-600 underline text-center"
              >
                חזרה לשינוי אימייל
              </button>
            </form>
          </div>
        )}

        {/* ─── Step 3: Registration Form ─── */}
        {step === 'form' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">

            {/* ── Personal details ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <User size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">פרטים אישיים</h2>
                  <p className="text-sm text-slate-500">
                    אימייל אומת:{' '}
                    <span dir="ltr">{email}</span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label="שם מלא" required>
                    <Input
                      value={form.full_name}
                      onChange={setField('full_name')}
                      placeholder="ישראל ישראלי"
                      required
                    />
                  </Field>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label='מספר ת"ז' required hint="ספרות בלבד">
                    <Input
                      value={form.id_number}
                      onChange={setField('id_number')}
                      placeholder="123456789"
                      inputMode="numeric"
                      maxLength={9}
                      dir="ltr"
                      required
                    />
                  </Field>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="תאריך לידה">
                    <Input
                      type="date"
                      value={form.birth_date}
                      onChange={setField('birth_date')}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </Field>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="מין">
                    <SelectInput value={form.gender} onChange={setField('gender')}>
                      <option value="">בחר...</option>
                      <option value="male">זכר</option>
                      <option value="female">נקבה</option>
                    </SelectInput>
                  </Field>
                </div>
              </div>
            </div>

            {/* ── Marital status ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart size={18} className="text-indigo-600" />
                <h3 className="font-semibold text-slate-900">מצב משפחתי</h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {MARITAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, marital_status: opt.value }))}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      form.marital_status === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Conditional spouse fields */}
              {showSpouseFields && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <p className="col-span-2 text-xs text-slate-500 font-medium">
                    {form.marital_status === 'אלמן' || form.marital_status === 'אלמנה'
                      ? 'פרטי בן/בת הזוג המנוח/ה'
                      : 'פרטי בן/בת הזוג'}
                  </p>
                  <div className="col-span-2 sm:col-span-1">
                    <Field label="שם בן/בת הזוג">
                      <Input
                        value={form.spouse_name}
                        onChange={setField('spouse_name')}
                        placeholder="שם מלא"
                      />
                    </Field>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Field label='ת"ז בן/בת הזוג'>
                      <Input
                        value={form.spouse_id_number}
                        onChange={setField('spouse_id_number')}
                        placeholder="123456789"
                        inputMode="numeric"
                        maxLength={9}
                        dir="ltr"
                      />
                    </Field>
                  </div>
                </div>
              )}
            </div>

            {/* ── Contact ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Phone size={18} className="text-indigo-600" />
                <h3 className="font-semibold text-slate-900">פרטי קשר</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Field label="טלפון ראשי" required>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={setField('phone')}
                      placeholder="050-0000000"
                      dir="ltr"
                      required
                    />
                  </Field>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="טלפון נוסף">
                    <Input
                      type="tel"
                      value={form.phone2}
                      onChange={setField('phone2')}
                      placeholder="050-0000000"
                      dir="ltr"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* ── Address ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-indigo-600" />
                <h3 className="font-semibold text-slate-900">כתובת</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label="רחוב ומספר בית">
                    <Input
                      value={form.address}
                      onChange={setField('address')}
                      placeholder="הרב קוק 12"
                    />
                  </Field>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="עיר">
                    <Input
                      value={form.city}
                      onChange={setField('city')}
                      placeholder="בני ברק"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* ── Lineage ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch size={18} className="text-indigo-600" />
                <h3 className="font-semibold text-slate-900">שיוך שושלת</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                בחר את הענף שאתה שייך אליו. לחץ על שם ואז בחר המשך הדור.
              </p>

              {lineagePath.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <span className="text-xs text-indigo-600 font-medium ml-1">נבחר:</span>
                  {lineagePath.map((name, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <ChevronLeft size={12} className="text-indigo-300" />}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          i === lineagePath.length - 1
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {name}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              <LineageCascade
                onSelect={(nodeId, path) => {
                  setLineageNodeId(nodeId)
                  setLineagePath(path)
                }}
              />

              {lineageNodeId && (
                <button
                  type="button"
                  onClick={() => { setLineageNodeId(''); setLineagePath([]) }}
                  className="mt-3 text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  נקה בחירה
                </button>
              )}
            </div>

            {/* ── Children + Notes ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-indigo-600" />
                <h3 className="font-semibold text-slate-900">ילדים והערות</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Field label="מספר ילדים">
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={form.children_count}
                      onChange={setField('children_count')}
                    />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="הערות / תיאור המצב" hint="כל מידע נוסף שתרצה להוסיף">
                    <textarea
                      value={form.notes}
                      onChange={setField('notes')}
                      rows={3}
                      placeholder="תאר את המצב המשפחתי או הצרכים המיוחדים..."
                      className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none w-full"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {error && <ErrorBox message={error} />}

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
              <p className="font-medium mb-1">שים לב</p>
              <p>הטופס ייבדק על ידי צוות העמותה. תקבל עדכון על סטטוס הבקשה שלך.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-base"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              {loading ? 'שולח...' : 'שלח בקשת רישום'}
            </button>
          </form>
        )}

        {/* ─── Success ─── */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">הבקשה התקבלה!</h2>
            <p className="text-slate-600 mb-6">
              בקשת הרישום שלך נשלחה בהצלחה. צוות העמותה יעיין בבקשתך ויצור עמך קשר.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 text-right border border-slate-200">
              <p className="flex items-center gap-2 mb-2">
                <Mail size={14} className="text-indigo-500 flex-shrink-0" />
                <span>
                  עדכון ישלח לכתובת <span dir="ltr">{email}</span>
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Clock size={14} className="text-indigo-500 flex-shrink-0" />
                <span>זמן טיפול ממוצע: עד 7 ימי עסקים</span>
              </p>
            </div>
          </div>
        )}

        {/* ─── Already registered ─── */}
        {step === 'already-registered' && existingBeneficiary && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">כבר רשום במערכת</h2>
              <p className="text-slate-500 text-sm">כתובת האימייל שלך קיימת במערכת</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">שם:</span>
                <span className="font-semibold text-slate-900">{existingBeneficiary.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">סטטוס בקשה:</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    STATUS_COLORS[existingBeneficiary.eligibility_status] ||
                    'bg-slate-100 text-slate-700'
                  }`}
                >
                  {STATUS_LABELS[existingBeneficiary.eligibility_status] ||
                    existingBeneficiary.eligibility_status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">תאריך רישום:</span>
                <span className="text-slate-700 font-medium" dir="ltr">
                  {new Date(existingBeneficiary.created_at).toLocaleDateString('he-IL')}
                </span>
              </div>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              לשינוי פרטים או לבירורים נוספים, אנא פנה ישירות לצוות העמותה.
            </div>
          </div>
        )}

        {step !== 'success' && step !== 'already-registered' && (
          <p className="text-center text-xs text-slate-400 mt-6">
            מערכת מאובטחת · כל הפרטים מוצפנים
          </p>
        )}
      </main>
    </div>
  )
}
