import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const parentId = request.nextUrl.searchParams.get('parent_id')
  const nodeId = request.nextUrl.searchParams.get('node_id')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // שחזור מסלול שושלת מלא עבור עריכה: בהינתן node_id, מחזיר לכל דור את האפשרויות
  // (אחים תחת אותו הורה) ואת מי שנבחר במסלול — מהשורש ועד הצומת הנבחר.
  if (nodeId) {
    const chain: { id: string; parent_id: string | null }[] = []
    let currentId: string | null = nodeId
    let guard = 0
    while (currentId && guard < 20) {
      guard++
      const { data } = await supabase
        .from('lineage_nodes')
        .select('id, parent_id')
        .eq('id', currentId)
        .maybeSingle()
      const n = data as { id: string; parent_id: string | null } | null
      if (!n) break
      chain.unshift({ id: n.id, parent_id: n.parent_id })
      currentId = n.parent_id
    }
    const path = []
    for (const node of chain) {
      let q = supabase
        .from('lineage_nodes')
        .select('id, name, generation, parent_id, notes')
        .order('name')
      q = node.parent_id ? q.eq('parent_id', node.parent_id) : q.is('parent_id', null)
      const { data: siblings } = await q
      path.push({ selectedId: node.id, nodes: siblings ?? [] })
    }
    return NextResponse.json({ path })
  }

  let query = supabase
    .from('lineage_nodes')
    .select('id, name, generation, parent_id, notes')
    .order('name')

  if (parentId) {
    query = query.eq('parent_id', parentId)
  } else {
    query = query.is('parent_id', null)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ nodes: data ?? [] })
}
