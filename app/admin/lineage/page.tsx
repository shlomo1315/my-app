import { GitBranch } from 'lucide-react'
import LineagePageManager from '@/components/admin/LineagePageManager'

export const metadata = { title: 'עץ הדורות' }

export default function LineagePage() {
  return (
    <div className="flex flex-col gap-5">
      <LineagePageManager />
    </div>
  )
}
