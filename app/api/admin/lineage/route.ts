import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

async function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function verifyStaff() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const admin = await getAdminClient()
  const { data, error } = await admin
    .from('lineage_nodes')
    .select('*')
    .order('generation')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ nodes: data ?? [] })
}

export async function POST(request: NextRequest) {
  const user = await verifyStaff()
  if (!user) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const body = await request.json()
  const { name, parent_id, notes } = body

  if (!name?.trim()) return NextResponse.json({ error: 'שם חובה' }, { status: 400 })

  const admin = await getAdminClient()

  let generation = 1
  if (parent_id) {
    const { data: parent } = await admin
      .from('lineage_nodes')
      .select('generation')
      .eq('id', parent_id)
      .single()
    if (parent) generation = parent.generation + 1
  }

  const { data, error } = await admin.from('lineage_nodes').insert({
    name: name.trim(),
    parent_id: parent_id || null,
    generation,
    notes: notes?.trim() || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ node: data })
}

export async function DELETE(request: NextRequest) {
  const user = await verifyStaff()
  if (!user) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'חסר ID' }, { status: 400 })

  const admin = await getAdminClient()
  const { error } = await admin.from('lineage_nodes').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
