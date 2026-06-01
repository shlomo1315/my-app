'use client'
import { useState, useEffect } from 'react'
import { HDate, Sedra, Locale, HebrewCalendar, flags, Zmanim, Location } from '@hebcal/core'
import { Clock, CalendarDays, BookOpen, Sparkles, Hourglass } from 'lucide-react'

// מיקום לחישוב זמני הלכה. ניתן להחליף לעיר אחרת (למשל 'Bnei Brak') במידת הצורך.
const ZMANIM_LOCATION = Location.lookup('Jerusalem') ?? Location.lookup('Tel Aviv') ?? null
const ZMANIM_TZ = 'Asia/Jerusalem'

type Zman = { name: string; t: Date }

// רשימת זמני ההלכה היומיים לפי הסדר הכרונולוגי
function dayZmanim(date: Date): Zman[] {
  if (!ZMANIM_LOCATION) return []
  const z = new Zmanim(ZMANIM_LOCATION, date, false)
  const list: { name: string; fn: () => Date }[] = [
    { name: 'עלות השחר', fn: () => z.alotHaShachar() },
    { name: 'זמן טלית ותפילין', fn: () => z.misheyakir() },
    { name: 'הנץ החמה', fn: () => z.neitzHaChama() },
    { name: 'סוף זמן ק״ש (מג״א)', fn: () => z.sofZmanShmaMGA() },
    { name: 'סוף זמן ק״ש (גר״א)', fn: () => z.sofZmanShma() },
    { name: 'סוף זמן תפילה', fn: () => z.sofZmanTfilla() },
    { name: 'חצות היום', fn: () => z.chatzot() },
    { name: 'מנחה גדולה', fn: () => z.minchaGedola() },
    { name: 'מנחה קטנה', fn: () => z.minchaKetana() },
    { name: 'פלג המנחה', fn: () => z.plagHaMincha() },
    { name: 'שקיעה', fn: () => z.shkiah() },
    { name: 'צאת הכוכבים', fn: () => z.tzeit() },
  ]
  const out: Zman[] = []
  for (const item of list) {
    try {
      const t = item.fn()
      if (t instanceof Date && !isNaN(t.getTime())) out.push({ name: item.name, t })
    } catch { /* דילוג על זמן שלא ניתן לחשב */ }
  }
  // מיון כרונולוגי — חשוב כי שני סוגי ק״ש (מג״א/גר״א) לא בהכרח לפי סדר הקריאה
  return out.sort((a, b) => a.t.getTime() - b.t.getTime())
}

// הזמן ההלכתי הקרוב ביותר שעוד לא עבר (כולל מעבר ליום המחר אחרי צאת הכוכבים)
function nextZman(now: Date): Zman | null {
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const all = [...dayZmanim(now), ...dayZmanim(tomorrow)]
  return all.find(z => z.t.getTime() > now.getTime()) ?? null
}

// כמה זמן נשאר עד הזמן הקרוב — ספירה לאחור חיה
function remaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `בעוד ${h}:${pad(m)}:${pad(s)}` : `בעוד ${m}:${pad(s)}`
}

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
  // הזמן ההלכתי הקרוב + כמה זמן נשאר עד אליו
  const nz = nextZman(now)
  const nzTime = nz ? nz.t.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: ZMANIM_TZ }) : ''
  const nzRemaining = nz ? remaining(nz.t.getTime() - now.getTime()) : ''

  return (
    <div className="hidden md:flex items-center gap-3 text-xs">
      <span className="inline-flex items-center gap-1 text-slate-700 font-semibold tabular-nums">
        <Clock size={13} className="text-indigo-500" /> {time}
      </span>
      {nz && (
        <>
          <span className="h-3.5 w-px bg-slate-200" />
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium tabular-nums">
            <Hourglass size={13} className="text-emerald-500" />
            <span>{nz.name}</span>
            <span className="ltr-num font-semibold">{nzTime}</span>
            <span className="text-emerald-600/70 ltr-num">({nzRemaining})</span>
          </span>
        </>
      )}
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
