'use client'
import Link from 'next/link'
import { Eye, Phone } from 'lucide-react'
import DataTable, { Column } from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import { Beneficiary, ELIGIBILITY_LABELS, GENDER_LABELS } from '@/types'

interface Props {
  data: Beneficiary[]
}

const columns: Column<Beneficiary>[] = [
  {
    key: 'full_name',
    header: 'שם מלא',
    sortable: true,
    render: (row) => (
      <Link href={`/admin/beneficiaries/${row.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
        {row.full_name}
      </Link>
    ),
  },
  { key: 'id_number', header: 'מספר זהות', render: (row) => <span className="ltr-num font-mono text-xs">{row.id_number}</span> },
  {
    key: 'phone',
    header: 'טלפון',
    render: (row) =>
      row.phone ? (
        <div className="flex items-center gap-1 ltr-num text-xs">
          <Phone size={12} className="text-slate-400 flex-shrink-0" />
          {row.phone}
        </div>
      ) : (
        <span className="text-slate-400">—</span>
      ),
  },
  { key: 'city', header: 'עיר', render: (row) => row.city ?? '—' },
  {
    key: 'gender',
    header: 'מגדר',
    render: (row) => (row.gender ? GENDER_LABELS[row.gender] : '—'),
  },
  { key: 'children_count', header: 'ילדים', render: (row) => row.children_count },
  {
    key: 'eligibility_status',
    header: 'סטטוס זכאות',
    sortable: true,
    render: (row) => <StatusBadge status={row.eligibility_status} />,
  },
  {
    key: 'is_active',
    header: 'פעיל',
    render: (row) =>
      row.is_active ? (
        <span className="text-green-600 text-xs font-medium">פעיל</span>
      ) : (
        <span className="text-slate-400 text-xs">לא פעיל</span>
      ),
  },
]

export default function BeneficiariesTable({ data }: Props) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchable
      searchPlaceholder="חיפוש לפי שם, ת.ז., טלפון..."
      searchKeys={['full_name', 'id_number', 'phone', 'city']}
      emptyMessage="לא נמצאו נתמכים. לחץ על 'רישום נתמך חדש' להוספה."
      actions={(row) => (
        <Link href={`/admin/beneficiaries/${row.id}`}>
          <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded hover:bg-indigo-50">
            <Eye size={14} />
            צפייה
          </button>
        </Link>
      )}
    />
  )
}
