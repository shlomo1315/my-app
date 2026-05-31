'use client'
import Link from 'next/link'
import { Eye, Phone, MapPin } from 'lucide-react'
import DataTable, { Column } from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import { Beneficiary } from '@/types'

const fullName = (row: Beneficiary) =>
  [row.family_name, row.full_name].filter(Boolean).join(' ') || row.full_name

// First Hebrew/Latin letter for the avatar
const initials = (row: Beneficiary) => {
  const name = fullName(row).trim()
  return name ? name.charAt(0) : '?'
}

// Stable soft color per row based on the id, so avatars feel varied but consistent
const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
]
const avatarColor = (id: string) => {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

const MARITAL_TINT: Record<string, string> = {
  'נישואים': 'bg-emerald-50 text-emerald-700',
  'גרוש': 'bg-slate-100 text-slate-600',
  'גרושה': 'bg-slate-100 text-slate-600',
  'אלמן': 'bg-amber-50 text-amber-700',
  'אלמנה': 'bg-amber-50 text-amber-700',
}

const columns: Column<Beneficiary>[] = [
  {
    key: 'full_name',
    header: 'נתמך',
    sortable: true,
    render: (row) => (
      <Link
        href={`/admin/beneficiaries/${row.id}`}
        className="flex items-center gap-3 group/name"
      >
        <span
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor(row.id)}`}
        >
          {initials(row)}
        </span>
        <span className="flex flex-col min-w-0">
          <span className="font-medium text-slate-800 group-hover/name:text-indigo-600 truncate">
            {fullName(row)}
          </span>
          {row.id_number ? (
            <span dir="ltr" className="font-mono text-[11px] text-slate-400 text-left tabular-nums">
              {row.id_number}
            </span>
          ) : null}
        </span>
      </Link>
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
  {
    key: 'city',
    header: 'עיר',
    render: (row) =>
      row.city ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
          <MapPin size={12} className="text-slate-400" />
          {row.city}
        </span>
      ) : (
        <span className="text-slate-300">—</span>
      ),
  },
  {
    key: 'marital_status',
    header: 'מצב משפחתי',
    render: (row) =>
      row.marital_status ? (
        <span
          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
            MARITAL_TINT[row.marital_status] ?? 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.marital_status}
        </span>
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
    className: 'text-center',
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

export default function BeneficiariesTable({ data }: { data: Beneficiary[] }) {
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
