import { Bell, Database, Shield, Users } from 'lucide-react'
import Card from '@/components/ui/Card'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { Profile, ROLE_LABELS } from '@/types'
import LineageTreeManager from '@/components/admin/LineageTreeManager'
import AddUserButton from './AddUserButton'

async function getProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    return data ?? []
  } catch {
    return []
  }
}

export default async function SettingsPage() {
  const profiles = await getProfiles()

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">הגדרות</h1>
        <p className="text-sm text-slate-500 mt-0.5">ניהול המערכת והמשתמשים</p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Database size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">חיבור Supabase</h2>
          </div>
          <div className={`rounded-xl p-4 text-sm ${isSupabaseConfigured() ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
            {isSupabaseConfigured() ? (
              <div>
                <p className="font-semibold">מחובר ✓</p>
                <p className="mt-1 text-xs ltr-num">{process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold">לא מחובר</p>
                <p className="mt-1">עדכן את NEXT_PUBLIC_SUPABASE_URL ו-NEXT_PUBLIC_SUPABASE_ANON_KEY בקובץ .env.local</p>
              </div>
            )}
          </div>
        </Card>

        <Card padding="none">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-700">משתמשי מערכת</h2>
            </div>
            <AddUserButton />
          </div>
          {profiles.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              {isSupabaseConfigured() ? 'לא נמצאו משתמשים' : 'חיבור Supabase נדרש לצפייה במשתמשים'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {profiles.map((p) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold">
                      {p.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.full_name}</p>
                      <p className="text-xs text-slate-500 ltr-num">{p.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 font-medium">
                      {ROLE_LABELS[p.role]}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">הרשאות תפקידים</h2>
          </div>
          <div className="space-y-3">
            {[
              { role: 'admin' as const, perms: ['ניהול מלא', 'הוספת משתמשים', 'אישור זכאות', 'ניהול הלוואות', 'דוחות'], color: 'bg-purple-100 text-purple-700' },
              { role: 'secretary' as const, perms: ['רישום נתמכים', 'עדכון נתונים', 'פתיחת תיקים'], color: 'bg-blue-100 text-blue-700' },
              { role: 'reviewer' as const, perms: ['בדיקת זכאות', 'אישור/דחייה', 'אימות מסמכים'], color: 'bg-green-100 text-green-700' },
              { role: 'collections' as const, perms: ['ניהול גבייה', 'רישום תשלומים', 'דוחות פיגורים'], color: 'bg-orange-100 text-orange-700' },
            ].map(({ role, perms, color }) => (
              <div key={role} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <span className={`text-xs font-semibold rounded-full px-2 py-0.5 flex-shrink-0 mt-0.5 ${color}`}>
                  {ROLE_LABELS[role]}
                </span>
                <div className="flex flex-wrap gap-1">
                  {perms.map((p) => (
                    <span key={p} className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <LineageTreeManager />
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">הגדרות התראות</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'תזכורת תפוגת כרטיס יולדת', desc: '7 ימים לפני תפוגה' },
              { label: 'פיגורים בהלוואות', desc: 'כשתשלום עובר 30 יום' },
              { label: 'בקשות ממתינות לאישור', desc: 'סיכום יומי' },
              { label: 'אישורי חלוקה', desc: 'שבוע לפני מועד החלוקה' },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <button className="relative w-10 h-5 bg-indigo-500 rounded-full transition-colors">
                  <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm translate-x-5 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
