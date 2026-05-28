import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { Beneficiary } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import BeneficiariesTable from './BeneficiariesTable'

async function getBeneficiaries(): Promise<Beneficiary[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('beneficiaries')
      .select('*, family:families(family_name)')
      .order('created_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

export default async function BeneficiariesPage() {
  const beneficiaries = await getBeneficiaries()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">נתמכים</h1>
          <p className="text-sm text-slate-500 mt-0.5">{beneficiaries.length} רשומות</p>
        </div>
        <Link href="/beneficiaries/new">
          <Button>
            <Plus size={16} />
            רישום נתמך חדש
          </Button>
        </Link>
      </div>

      <BeneficiariesTable data={beneficiaries} />
    </div>
  )
}
