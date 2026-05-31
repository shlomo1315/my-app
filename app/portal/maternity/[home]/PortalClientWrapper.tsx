'use client'
import { useState } from 'react'
import PortalLogin from './PortalLogin'

export default function PortalClientWrapper({ home }: { home: string }) {
  const [authed, setAuthed] = useState(false)

  if (authed) {
    // After login, reload to get server-rendered data with the new cookie
    window.location.reload()
    return null
  }

  return <PortalLogin home={home} onSuccess={() => setAuthed(true)} />
}
