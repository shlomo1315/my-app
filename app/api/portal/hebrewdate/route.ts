import { NextResponse } from 'next/server'
import { HDate, HebrewCalendar, gematriya } from '@hebcal/core'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const today = new HDate(new Date())

    // Hebrew date in gematriya (e.g. ט״ו סיון תשפ״ו)
    const hebrewDate = today.renderGematriya()

    // Parasha of the coming Shabbat (Israel)
    let parasha = ''
    let d = today
    for (let i = 0; i <= 7; i++) {
      const events = HebrewCalendar.calendar({ start: d, end: d, sedrot: true, il: true, locale: 'he' })
      const sedra = events.find(e => e.getDesc().startsWith('Parashat'))
      if (sedra) { parasha = sedra.render('he'); break }
      d = new HDate(d.abs() + 1)
    }

    // Hebrew year only
    const hebrewYear = gematriya(today.getFullYear())

    return NextResponse.json({ hebrewDate, parasha, hebrewYear })
  } catch {
    return NextResponse.json({ hebrewDate: '', parasha: '', hebrewYear: '' })
  }
}
