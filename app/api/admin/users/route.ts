import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'

function adminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'admin' ? user : null
}

// POST /api/admin/users — invite a new staff member
export async function POST(request: NextRequest) {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
  }

  const { email, full_name, role } = body as Record<string, string>

  if (!email || !full_name || !role) {
    return NextResponse.json({ error: 'שדות חובה חסרים' }, { status: 400 })
  }

  const validRoles: UserRole[] = ['admin', 'secretary', 'reviewer', 'collections']
  if (!validRoles.includes(role as UserRole)) {
    return NextResponse.json({ error: 'תפקיד לא תקין' }, { status: 400 })
  }

  const admin = adminClient()

  // Check if email already in profiles
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'משתמש עם אימייל זה כבר קיים' }, { status: 409 })
  }

  // Invite the user — Supabase sends an invitation email
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email.toLowerCase().trim(),
    { data: { full_name: full_name.trim(), role } }
  )

  if (inviteError) {
    if (inviteError.message?.includes('already been registered')) {
      return NextResponse.json({ error: 'משתמש עם אימייל זה כבר רשום במערכת' }, { status: 409 })
    }
    console.error('Invite error:', inviteError.message)
    return NextResponse.json({ error: 'שגיאה בשליחת ההזמנה' }, { status: 500 })
  }

  // Insert profile
  const { error: profileError } = await admin.from('profiles').insert({
    id: inviteData.user.id,
    email: email.toLowerCase().trim(),
    full_name: full_name.trim(),
    role,
    is_active: true,
  })

  if (profileError) {
    console.error('Profile insert error:', profileError.message)
    // Clean up the auth user if profile failed
    await admin.auth.admin.deleteUser(inviteData.user.id)
    return NextResponse.json({ error: 'שגיאה ביצירת הפרופיל' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// PATCH /api/admin/users — update role or active status
export async function PATCH(request: NextRequest) {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
  }

  const { id, role, is_active } = body as Record<string, string | boolean>

  if (!id) return NextResponse.json({ error: 'חסר מזהה משתמש' }, { status: 400 })

  // Prevent admin from demoting themselves
  if (id === caller.id && role && role !== 'admin') {
    return NextResponse.json({ error: 'לא ניתן לשנות את התפקיד של המשתמש הנוכחי' }, { status: 403 })
  }

  const updates: Record<string, unknown> = {}
  if (role !== undefined) updates.role = role
  if (is_active !== undefined) updates.is_active = is_active

  const admin = adminClient()
  const { error } = await admin.from('profiles').update(updates).eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/users?id=xxx — remove a user
export async function DELETE(request: NextRequest) {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'חסר מזהה משתמש' }, { status: 400 })

  if (id === caller.id) {
    return NextResponse.json({ error: 'לא ניתן למחוק את המשתמש הנוכחי' }, { status: 403 })
  }

  const admin = adminClient()
  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) {
    return NextResponse.json({ error: 'שגיאה במחיקת המשתמש' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
