'use client'
import { SessionProvider } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/admin/Sidebar'

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const noSidebar = pathname === '/admin/login' || pathname === '/admin'

  if (noSidebar) return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  )
}
