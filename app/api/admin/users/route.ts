import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const VALID_ROLES = ['admin', 'secretary', 'reviewer', 'collections']

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// מאמת שמי שמבצע את הפעולה מחובר ומשמש כמנהל (admin)
async function verifyAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(list) { try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { /* server component */ } },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return profile?.role === 'admin'
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'אין הרשאה — רק מנהל יכול להוסיף משתמשים' }, { status: 403 })
  }

  const admin = getAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'מפתח השירות (SERVICE_ROLE) אינו מוגדר בשרת' }, { status: 500 })
  }

  let body: { full_name?: string; email?: string; password?: string; role?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 }) }

  const full_name = String(body.full_name ?? '').trim()
  const email = String(body.email ?? '').toLowerCase().trim()
  const password = String(body.password ?? '')
  const role = String(body.role ?? '')

  if (!full_name) return NextResponse.json({ error: 'שם מלא חובה' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'אימייל לא תקין' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' }, { status: 400 })
  if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: 'תפקיד לא תקין' }, { status: 400 })

  // יצירת משתמש האימות
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name },
  })
  if (authErr || !created?.user) {
    const msg = authErr?.message ?? 'שגיאה ביצירת המשתמש'
    const status = /already|exists|registered/i.test(msg) ? 409 : 500
    return NextResponse.json({ error: /already|exists|registered/i.test(msg) ? 'אימייל זה כבר רשום במערכת' : msg }, { status })
  }

  // יצירת פרופיל מקושר
  const { error: profErr } = await admin.from('profiles').insert({
    id: created.user.id, email, full_name, role, is_active: true,
  })
  if (profErr) {
    // ניקוי: אם הפרופיל נכשל, מחק את משתמש האימות שנוצר
    await admin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: `שגיאה ביצירת הפרופיל: ${profErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
