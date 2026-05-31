'use client'
import { useState, useEffect } from 'react'
import { Link2, Check, Building2, Lock, Eye, EyeOff, Loader2, Trash2, Plus } from 'lucide-react'

interface Portal { home_name: string; updated_at: string }

export default function RecoveryHomeLinks({ homes }: { homes: string[] }) {
  const [portals, setPortals] = useState<Portal[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [editingHome, setEditingHome] = useState<string | null>(null)
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedHome, setSavedHome] = useState<string | null>(null)

  const hasPassword = (home: string) => portals.some(p => p.home_name === home)

  useEffect(() => {
    fetch('/api/portal/password')
      .then(r => r.json())
      .then(d => setPortals(d.portals ?? []))
      .catch(() => {})
  }, [])

  if (homes.length === 0) return null

  const copyLink = (home: string) => {
    const url = `${window.location.origin}/portal/maternity/${encodeURIComponent(home)}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(home)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const openEdit = (home: string) => {
    setEditingHome(home)
    setPw('')
    setShowPw(false)
    setError('')
  }

  const savePassword = async (home: string) => {
    if (!pw || pw.length < 4) { setError('סיסמה חייבת להיות לפחות 4 תווים'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/portal/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_name: home, password: pw }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'שגיאה'); setSaving(false); return }
      setPortals(prev => {
        const exists = prev.find(p => p.home_name === home)
        if (exists) return prev.map(p => p.home_name === home ? { ...p, updated_at: new Date().toISOString() } : p)
        return [...prev, { home_name: home, updated_at: new Date().toISOString() }]
      })
      setSavedHome(home)
      setTimeout(() => setSavedHome(null), 2000)
      setEditingHome(null)
    } catch {
      setError('שגיאת רשת')
    } finally {
      setSaving(false)
    }
  }

  const removePassword = async (home: string) => {
    if (!confirm(`להסיר גישה לפורטל עבור "${home}"?`)) return
    await fetch('/api/portal/password', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home_name: home }),
    })
    setPortals(prev => prev.filter(p => p.home_name !== home))
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-2">
        <Link2 size={16} className="text-indigo-500" />
        <h2 className="text-sm font-semibold text-slate-700">פורטל בתי החלמה</h2>
      </div>

      <div className="divide-y divide-slate-100">
        {homes.map(home => (
          <div key={home} className="px-5 py-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <Building2 size={15} className="text-slate-400 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-slate-800">{home}</span>
                  {hasPassword(home) ? (
                    <span className="mr-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                      <Lock size={10} /> סיסמה מוגדרת
                    </span>
                  ) : (
                    <span className="mr-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      ללא סיסמה
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Copy link — only if password set */}
                {hasPassword(home) && (
                  <button onClick={() => copyLink(home)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                      copied === home
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                    }`}>
                    {copied === home ? <><Check size={13} /> הועתק!</> : <><Link2 size={13} /> העתק קישור</>}
                  </button>
                )}

                {/* Set/change password */}
                <button onClick={() => editingHome === home ? setEditingHome(null) : openEdit(home)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                  {savedHome === home ? <><Check size={13} className="text-green-600" /> נשמר!</> : hasPassword(home) ? <><Lock size={13} /> שנה סיסמה</> : <><Plus size={13} /> הגדר סיסמה</>}
                </button>

                {/* Remove access */}
                {hasPassword(home) && (
                  <button onClick={() => removePassword(home)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                    title="הסר גישה">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Password input inline */}
            {editingHome === home && (
              <div className="mt-3 flex items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    placeholder="הכנס סיסמה (לפחות 4 תווים)"
                    dir="ltr"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={e => e.key === 'Enter' && savePassword(home)}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button onClick={() => savePassword(home)} disabled={saving || !pw}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  שמור
                </button>
                {error && <span className="text-xs text-red-600">{error}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          הגדר סיסמה לכל בית החלמה — לאחר מכן העתק את הקישור ושלח להם. הם יצטרכו להזין סיסמה לפני הצפייה ברשימה.
        </p>
      </div>
    </div>
  )
}
