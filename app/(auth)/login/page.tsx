'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

const CONFETTI_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#14b8a6', '#ffffff']

function WelcomeScreen({ name }: { name: string }) {
  const [logoError, setLogoError] = useState(false)
  const [closing, setClosing] = useState(false)
  const pieces = Array.from({ length: 90 })

  useEffect(() => {
    const t = setTimeout(() => setClosing(true), 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-700 via-violet-600 to-purple-700"
      style={{ animation: closing ? 'welcome-out 0.5s ease-in forwards' : 'welcome-in 0.5s ease-out forwards' }}>

      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((_, i) => {
          const left = Math.random() * 100
          const delay = Math.random() * 1.2
          const duration = 2.5 + Math.random() * 2
          const size = 7 + Math.random() * 9
          const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
          const rounded = Math.random() > 0.4
          return (
            <span key={i} style={{
              position: 'absolute', left: `${left}%`, top: '-5%',
              width: size, height: size * (rounded ? 1 : 1.8),
              background: color, borderRadius: rounded ? '9999px' : '2px',
              opacity: 0.85,
              animation: `confetti-fall ${duration}s linear ${delay}s forwards`,
            }} />
          )
        })}
      </div>

      {/* Decorative circles */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/5" />

      {/* Card */}
      <div className="relative text-center text-white px-8 max-w-sm w-full mx-4"
        style={{ animation: 'pop-in 0.5s ease-out 0.15s both' }}>

        {/* Logo */}
        <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl overflow-hidden p-2">
          {logoError ? (
            <Building2 size={44} className="text-indigo-600" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/logo.jpg" alt="לוגו" className="w-full h-full object-contain"
              onError={() => setLogoError(true)} />
          )}
        </div>

        <h1 className="text-4xl font-bold mb-3 drop-shadow-lg">שלום, {name} 👋</h1>
        <p className="text-indigo-100 text-lg mb-1">ברוכים הבאים לתוכנת הניהול</p>
        <p className="text-white font-bold text-2xl drop-shadow">היכל החתם סופר</p>
        <p className="text-indigo-200 text-sm mt-8">מיד תועבר לניהול האתר...</p>

        {/* Progress bar */}
        <div className="mt-4 h-1 w-48 bg-white/20 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-white rounded-full" style={{ animation: 'shrink 2s linear forwards' }} />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoError, setLogoError] = useState(false)
  const [welcomeName, setWelcomeName] = useState<string | null>(null)

  const isPlaceholder =
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isPlaceholder) {
      setWelcomeName('אורח')
      setTimeout(() => { router.push('/admin/dashboard') }, 3000)
      return
    }
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('אימייל או סיסמה שגויים. אנא נסה שוב.')
      setLoading(false)
      return
    }
    // שלוף את שם המשתמש מהפרופיל
    let name = email.split('@')[0]
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
        .maybeSingle()
      if (profile?.full_name) name = profile.full_name
    }
    setLoading(false)
    setWelcomeName(name)
    setTimeout(() => {
      router.push('/admin/dashboard')
      router.refresh()
    }, 3000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 p-4">
      {welcomeName && <WelcomeScreen name={welcomeName} />}
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-sky-200 overflow-hidden p-2">
            {logoError ? (
              <Building2 size={40} className="text-sky-600" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/logo.jpg"
                alt="היכל החתם סופר"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            )}
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800 leading-snug">
              ברוכים הבאים לתוכנת ניהול<br />היכל החתם סופר
            </h1>
            <p className="text-slate-500 text-sm mt-2">כניסה למערכת</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {isPlaceholder && (
            <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700">
                <p className="font-semibold">מצב פיתוח</p>
                <p>Supabase לא מוגדר. לחץ &quot;כניסה&quot; להמשך ללא אימות.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                אימייל
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required={!isPlaceholder}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                dir="ltr"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                סיסמה
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required={!isPlaceholder}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pl-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
              כניסה למערכת
            </Button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4">
          מערכת מאובטחת לשימוש פנימי בלבד
        </p>
      </div>
    </div>
  )
}
