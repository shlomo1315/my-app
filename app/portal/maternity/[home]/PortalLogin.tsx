'use client'
import { useState } from 'react'
import { Lock, Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react'

export default function PortalLogin({ home, onSuccess }: { home: string; onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'שגיאה'); setLoading(false); return }
      onSuccess()
    } catch {
      setError('שגיאת רשת — נסה שוב')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow border border-sky-200 flex items-center justify-center overflow-hidden p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="לוגו" className="w-full h-full object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">היכל החתם סופר</p>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2 justify-center mt-1">
              <Building2 size={18} className="text-indigo-500" /> {home}
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Lock size={15} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">כניסה מאובטחת</p>
              <p className="text-xs text-slate-500">הכנס סיסמה לצפייה ברשימת היולדות</p>
            </div>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="סיסמה"
                required
                dir="ltr"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading || !password}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              {loading ? 'מאמת...' : 'כניסה'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">מערכת מאובטחת לשימוש פנימי בלבד</p>
      </div>
    </div>
  )
}
