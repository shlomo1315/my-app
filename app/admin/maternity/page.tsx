import Link from 'next/link'
import { Plus, Baby } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { MaternityAid } from '@/types'
import Button from '@/components/ui/Button'
import MaternityTable from './MaternityTable'
import RecoveryHomeLinks from './RecoveryHomeLinks'

async function getMaternityAids(): Promise<MaternityAid[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('maternity_aids')
      .select('*, beneficiary:beneficiaries(id, full_name, family_name, phone, spouse_name, spouse_id_number, children, children_count)')
      .order('created_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

export default async function MaternityPage() {
  const aids = await getMaternityAids()

  // Unique recovery homes (only non-empty values)
  const recoveryHomes = [...new Set(
    aids.map(a => a.recovery_home).filter(Boolean) as string[]
  )].sort()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">אגף יולדות</h1>
          <p className="text-sm text-slate-500 mt-0.5">{aids.length} תיקים</p>
        </div>
        <Link href="/admin/maternity/new">
          <Button>
            <Plus size={16} />
            לידה חדשה
          </Button>
        </Link>
      </div>

      {recoveryHomes.length > 0 && (
        <RecoveryHomeLinks homes={recoveryHomes} />
      )}

      {aids.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Baby size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 text-sm">לא נמצאו תיקי יולדות</p>
        </div>
      ) : (
        <MaternityTable data={aids} />
      )}
    </div>
  )
}
