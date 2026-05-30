'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { MARITAL_STATUS_OPTIONS, CITY_OPTIONS } from '@/types'

const schema = z.object({
  id_number: z.string().min(7, 'תעודת זהות חייבת להכיל לפחות 7 ספרות').max(9),
  full_name: z.string().min(2, 'שם מלא חייב להכיל לפחות 2 תווים'),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', '']).optional(),
  marital_status: z.string().optional(),
  children_count: z.number().min(0),
  notes: z.string().optional(),
  nedarim_id: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  defaultValues?: Partial<FormData>
  beneficiaryId?: string
}

export default function BeneficiaryForm({ defaultValues, beneficiaryId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const isEdit = !!beneficiaryId

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { children_count: 0, gender: '' },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload = { ...data, gender: data.gender || null, email: data.email || null }

      if (isEdit) {
        await supabase.from('beneficiaries').update(payload).eq('id', beneficiaryId)
      } else {
        const { data: inserted, error } = await supabase.from('beneficiaries').insert(payload).select().single()
        if (error) throw error
        router.push(`/admin/beneficiaries/${inserted.id}`)
        return
      }
      router.back()
    } catch (err) {
      console.error(err)
      alert('שגיאה בשמירה. נסה שוב.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Card>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">פרטים אישיים</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="תעודת זהות"
            error={errors.id_number?.message}
            required
            dir="ltr"
            placeholder="123456789"
            {...register('id_number')}
          />
          <Input
            label="שם מלא"
            error={errors.full_name?.message}
            required
            placeholder="ישראל ישראלי"
            {...register('full_name')}
          />
          <Select
            label="מגדר"
            options={[
              { value: 'male', label: 'זכר' },
              { value: 'female', label: 'נקבה' },
            ]}
            placeholder="בחר מגדר"
            {...register('gender')}
          />
          <Input
            label="תאריך לידה"
            type="date"
            error={errors.birth_date?.message}
            dir="ltr"
            {...register('birth_date')}
          />
          <Select
            label="מצב משפחתי"
            options={MARITAL_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            placeholder="בחר מצב משפחתי"
            {...register('marital_status')}
          />
          <Input
            label="מספר ילדים"
            type="number"
            min="0"
            error={errors.children_count?.message}
            {...register('children_count', { valueAsNumber: true })}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">פרטי קשר</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="טלפון ראשי"
            type="tel"
            dir="ltr"
            placeholder="050-0000000"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="טלפון משני"
            type="tel"
            dir="ltr"
            placeholder="050-0000000"
            error={errors.phone2?.message}
            {...register('phone2')}
          />
          <Input
            label="אימייל"
            type="email"
            dir="ltr"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="מספר נדרים"
            dir="ltr"
            error={errors.nedarim_id?.message}
            {...register('nedarim_id')}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">כתובת</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="כתובת"
            placeholder="רחוב, מספר בית"
            error={errors.address?.message}
            {...register('address')}
          />
          <Select
            label="עיר"
            options={CITY_OPTIONS.map((c) => ({ value: c, label: c }))}
            placeholder="בחר עיר"
            {...register('city')}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">הערות</h2>
        <textarea
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={3}
          placeholder="הערות נוספות..."
          {...register('notes')}
        />
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          ביטול
        </Button>
        <Button type="submit" loading={saving}>
          {isEdit ? 'שמור שינויים' : 'רישום נתמך'}
        </Button>
      </div>
    </form>
  )
}
