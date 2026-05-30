'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const schema = z.object({
  beneficiary_id: z.string().min(1, 'יש לבחור נתמך'),
  amount: z.number().min(100, 'סכום מינימלי 100 ₪'),
  installments: z.number().min(1).max(120),
  purpose: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewLoanPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [amount, setAmount] = useState(0)
  const [installments, setInstallments] = useState(12)

  const monthlyPayment = installments > 0 ? Math.ceil(amount / installments) : 0

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, installments: 12 },
  })

  const watchAmount = watch('amount')
  const watchInstallments = watch('installments')

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const monthly = Math.ceil(data.amount / data.installments)
      const { data: inserted, error } = await supabase
        .from('loans')
        .insert({ ...data, monthly_payment: monthly })
        .select()
        .single()
      if (error) throw error
      router.push(`/admin/loans/${inserted.id}`)
    } catch {
      alert('שגיאה בשמירה. נסה שוב.')
    } finally {
      setSaving(false)
    }
  }

  const fmtCur = (n: number) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/loans" className="text-slate-400 hover:text-slate-600"><ArrowRight size={20} /></Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">בקשת הלוואה חדשה</h1>
          <p className="text-sm text-slate-500">מילוי פרטי בקשת הלוואה</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Card>
          <h2 className="text-sm font-semibold text-slate-700 mb-4">פרטי הלווה</h2>
          <Input
            label="מזהה נתמך"
            placeholder="UUID של הנתמך"
            error={errors.beneficiary_id?.message}
            required
            {...register('beneficiary_id')}
          />
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-700 mb-4">פרטי הלוואה</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="סכום הלוואה (₪)"
              type="number"
              min="100"
              error={errors.amount?.message}
              required
              {...register('amount', { valueAsNumber: true })}
            />
            <Input
              label="מספר תשלומים"
              type="number"
              min="1"
              max="120"
              error={errors.installments?.message}
              required
              {...register('installments', { valueAsNumber: true })}
            />
            <Input
              label="מטרת ההלוואה"
              placeholder="חתונה, ריהוט, רפואה..."
              {...register('purpose')}
            />
          </div>

          {watchAmount > 0 && watchInstallments > 0 && (
            <div className="mt-4 bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-indigo-700">תשלום חודשי משוער:</span>
              <span className="text-xl font-bold text-indigo-800 ltr-num">
                {fmtCur(Math.ceil(watchAmount / watchInstallments))}
              </span>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">הערות</h2>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
            {...register('notes')}
          />
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={() => router.back()}>ביטול</Button>
          <Button type="submit" loading={saving}>הגשת בקשה</Button>
        </div>
      </form>
    </div>
  )
}
