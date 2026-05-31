'use client'
import Link from 'next/link'
import { Eye, Phone } from 'lucide-react'
import DataTable, { Column } from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import { Beneficiary } from '@/types'

interface Props {
  data: Beneficiary[]
}

const fullName = (row: Beneficiary) =>
  [row.family_name, row.full_name].filter(Boolean).join(' ') || row.full_name

const columns: Column<Beneficiary>[] = [
  {
    key: 'full_name',
    header: 'שם מלא',
    sortable: true,
    render: (row) => (
      <Link
        href={`/admin/beneficiaries/${row.id}`}
        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
      >
        {fullName(row)}
      </Link>
    ),
  },
  {
    key: 'id_number',
    header: 'מספר זהות',
    render: (row) => (
      <span dir="ltr" className="font-mono text-xs text-slate-600 inline-block text-left tabular-nums">
        {row.id_number || '—'}
      </span>
    ),
  },
  {
    key: 'phone',
    header: 'טלפון',
    render: (row) =>
      row.phone ? (
        <div dir="ltr" className="flex items-center justify-end gap-1.5 text-xs text-slate-600 tabular-nums">
          <Phone size={12} className="text-slate-400 flex-shrink-0" />
          <span>{row.phone}</span>
        </div>
      ) : (
        <span className="text-slate-300">—</span>
      ),
  },
  { key: 'city', header: 'עיר', render: (row) => row.city || <span className="text-slate-300">—</span> },
  {
    key: 'marital_status',
    header: 'מצב משפחתי',
    render: (row) =>
      row.marital_status ? (
        <span className="text-xs text-slate-600">{row.marital_status}</span>
      ) : (
        <span className="text-slate-300">—</span>
      ),
  },
  {
    key: 'children_count',
    header: 'ילדים',
    className: 'text-center',
    render: (row) => (
      <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium tabular-nums">
        {row.children_count ?? 0}
      </span>
    ),
  },
  {
    key: 'eligibility_status',
    header: 'סטטוס',
    sortable: true,
    render: (row) => <StatusBadge status={row.eligibility_status} />,
  },
  {
    key: 'is_active',
    header: 'פעיל',
    render: (row) =>
      row.is_active ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          פעיל
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          לא פעיל
        </span>
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
      searchKeys={['full_name', 'family_name', 'id_number', 'phone', 'city']}
      emptyMessage="לא נמצאו נתמכים. לחץ על 'רישום נתמך חדש' להוספה."
      actions={(row) => (
        <Link href={`/admin/beneficiaries/${row.id}`}>
          <button className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50">
            <Eye size={14} />
            צפייה
          </button>
        </Link>
      )}
    />
  )
}
