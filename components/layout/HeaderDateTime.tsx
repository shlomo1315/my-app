'use client'
import { useState, useEffect } from 'react'
import { HDate, Sedra, Locale } from '@hebcal/core'
import { Clock, CalendarDays, BookOpen } from 'lucide-react'

// פרשת השבוע (לפי לוח ארץ ישראל) בעברית ללא ניקוד
function computeParsha(d: Date): string {
  try {
    const hd = new HDate(d)
    const sedra = new Sedra(hd.getFullYear(), true)
    const res = sedra.lookup(hd)
    const names = res.parsha.map((p: string) => Locale.gettext(p, 'he-x-NoNikud') || p)
    if (res.chag) return names.join(' ')
    return 'פרשת ' + names.join('־')
  } catch {
    return ''
  }
}

export default function HeaderDateTime() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!now) return null

  const time = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const greg = now.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  let hebrew = ''
  try {
    hebrew = new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' }).format(now)
  } catch { /* ignore */ }
  const parsha = computeParsha(now)

  return (
    <div className="hidden md:flex items-center gap-3 text-xs">
      <span className="inline-flex items-center gap-1 text-slate-700 font-semibold tabular-nums">
        <Clock size={13} className="text-indigo-500" /> {time}
      </span>
      <span className="h-3.5 w-px bg-slate-200" />
      <span className="inline-flex items-center gap-1.5 text-slate-600">
        <CalendarDays size={13} className="text-indigo-500" />
        {hebrew && <span>{hebrew}</span>}
        <span className="text-slate-300">·</span>
        <span className="ltr-num">{greg}</span>
      </span>
      {parsha && (
        <>
          <span className="h-3.5 w-px bg-slate-200" />
          <span className="inline-flex items-center gap-1 text-indigo-700 font-medium">
            <BookOpen size={13} className="text-indigo-500" /> {parsha}
          </span>
        </>
      )}
    </div>
  )
}
