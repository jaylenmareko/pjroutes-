'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ConnectRefreshPage() {
  const router = useRouter()
  useEffect(() => {
    router.push('/listings')
  }, [router])
  return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <p className="text-muted text-sm">Redirecting...</p>
    </div>
  )
}
