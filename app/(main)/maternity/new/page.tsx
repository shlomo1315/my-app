'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const schema = z.object({
  beneficiary_id: z.string().min(1, 'יש לבחור נתמכת'),
  birth_date: z.string().min(1, 'תאריך לידה חובה'),
  baby_name: z.string().optional(),
  card_number: z.string().optional(),
  weekly_amount: z.number().min(0),
  recovery_home: z.string().optional(),
  recovery_from: z.string().optional(),
  recovery_to: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewMaternityPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { weekly_amount: 0 },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const { data: inserted, error } = await supabase
        .from('maternity_aids')
        .insert({ ...data, total_weeks: 6, card_balance: 0 })
        .select()
        .single()
      if (error) throw error
      router.push(`/maternity/${inserted.id}`)
    } catch {
      alert('שגיאה בשמירה. נסה שוב.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/maternity" className="text-slate-400 hover:text-slate-600"><ArrowRight size={20} /></Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">פתיחת תיק יולדת</h1>
          <p className="text-sm text-slate-500">מילוי פרטי תיק סיוע יולדות</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Card>
          <h2 className="text-sm font-semibold text-slate-700 mb-4">פרטי לידה</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="מזהה נתמכת"
              placeholder="UUID של הנתמכת"
              error={errors.beneficiary_id?.message}
              required
              {...register('beneficiary_id')}
            />
            <Input
              label="תאריך לידה"
              type="date"
              error={errors.birth_date?.message}
              required
              dir="ltr"
              {...register('birth_date')}
            />
            <Input
              label="שם התינוק/ת"
              placeholder="שם התינוק"
              {...register('baby_name')}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-700 mb-4">כרטיס נדרים קארד</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="מספר כרטיס"
              dir="ltr"
              placeholder="0000-0000-0000-0000"
              {...register('card_number')}
            />
            <Input
              label="סכום שבועי (₪)"
              type="number"
              min="0"
              {...register('weekly_amount', { valueAsNumber: true })}
            />
          </div>
          <p className="text-xs text-slate-500 mt-3 bg-blue-50 rounded-lg p-3">
            הכרטיס יוטען אוטומטית ל-6 שבועות מתאריך הלידה. בתום התקופה הסכום יוחזר אוטומטית לארנק.
          </p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-700 mb-4">בית החלמה</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="שם בית החלמה" {...register('recovery_home')} />
            <Input label="מתאריך" type="date" dir="ltr" {...register('recovery_from')} />
            <Input label="עד תאריך" type="date" dir="ltr" {...register('recovery_to')} />
          </div>
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
          <Button type="submit" loading={saving}>פתיחת תיק</Button>
        </div>
      </form>
    </div>
  )
}
