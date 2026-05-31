'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Check, AlertTriangle, Pencil } from 'lucide-react'
import { ROLE_LABELS, type UserRole, type Profile } from '@/types'

const ROLES: UserRole[] = ['admin', 'secretary', 'reviewer', 'collections']

export default function EditUserButton({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [role, setRole] = useState<UserRole>(profile.role)
  const [isActive, setIsActive] = useState(profile.is_active)

  const close = () => {
    if (saving) return
    setOpen(false)
    setError('')
    setDone(false)
    // Reset to current profile values
    setFullName(profile.full_name)
    setPhone(profile.phone ?? '')
    setRole(profile.role)
    setIsActive(profile.is_active)
  }

  const submit = async () => {
    if (!fullName.trim()) { setError('שם מלא חובה'); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profile.id, full_name: fullName, phone, role, is_active: isActive }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'שגיאה בעדכון'); setSaving(false); return }
      setDone(true)
      setSaving(false)
      router.refresh()
      setTimeout(() => { setOpen(false); setDone(false) }, 1200)
    } catch {
      setError('שגיאת רשת — נסה שוב')
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        title="עריכת משתמש"
      >
        <Pencil size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={close}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Pencil size={15} className="text-indigo-500" /> עריכת משתמש
              </h3>
              <button onClick={close} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            {done ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
                  <Check size={26} />
                </div>
                <p className="text-sm font-medium text-slate-800">הפרטים עודכנו בהצלחה</p>
              </div>
            ) : (
              <div className="p-5 flex flex-col gap-3">
                {/* Email — read only */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500">אימייל</label>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 ltr-num text-left">
                    {profile.email}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">שם מלא <span className="text-red-500">*</span></label>
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">טלפון</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="05X-XXXXXXX"
                    dir="ltr"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600">תפקיד <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r => (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className={`py-2 rounded-lg border text-sm font-medium transition-colors ${role === r ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                        {ROLE_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border border-slate-200 rounded-lg px-3">
                  <span className="text-sm text-slate-700">משתמש פעיל</span>
                  <button
                    type="button"
                    onClick={() => setIsActive(v => !v)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-indigo-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isActive ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> {error}
                  </div>
                )}

                <div className="flex gap-2 justify-end mt-1">
                  <button onClick={close} disabled={saving}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                    ביטול
                  </button>
                  <button onClick={submit} disabled={saving || !fullName.trim()}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    שמור שינויים
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
