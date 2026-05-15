'use client'
import { useRouter } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-ink text-white px-6 py-4 flex items-center justify-between">
        <span className="font-bold tracking-tight text-sm">PJRoutes — Admin</span>
        <button
          onClick={handleLogout}
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          Sign out
        </button>
      </div>
      {children}
    </div>
  )
}
