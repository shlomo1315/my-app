'use client'
import { useState, useEffect } from 'react'
import { HDate, Sedra, Locale, HebrewCalendar, flags } from '@hebcal/core'
import { Clock, CalendarDays, BookOpen, Sparkles } from 'lucide-react'

// חגים ומועדים יהודיים בלבד (כולל ראש חודש) — ללא ימי החג הישראליים המודרניים
function computeHolidays(d: Date): string[] {
  try {
    const evs = HebrewCalendar.getHolidaysOnDate(new HDate(d), true) ?? []
    return evs
      .filter(ev => !(ev.getFlags() & flags.MODERN_HOLIDAY))
      .map(ev => ev.render('he-x-NoNikud'))
  } catch {
    return []
  }
}

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
  // תאריך עברי בגימטריה (יום + חודש + שנה באותיות עבריות) — למשל "ט״ז בסיון תשפ״ו"
  let hebrew = ''
  try {
    hebrew = new HDate(now).renderGematriya(true)
  } catch { /* ignore */ }
  const parsha = computeParsha(now)
  const holidays = computeHolidays(now)

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
      {holidays.length > 0 && (
        <>
          <span className="h-3.5 w-px bg-slate-200" />
          <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
            <Sparkles size={13} className="text-amber-500" /> {holidays.join(' · ')}
          </span>
        </>
      )}
    </div>
  )
}
