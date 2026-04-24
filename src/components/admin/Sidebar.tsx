'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

// Paleta Tarly
const C = {
  bg:        '#0A1930',   // navy fundo
  border:    'rgba(255,255,255,0.07)',
  active:    '#004A99',   // azul primário
  activeText:'#ffffff',
  accent:    '#EF7720',   // laranja
  text:      'rgba(255,255,255,0.55)',
  textHover: 'rgba(255,255,255,0.85)',
  section:   'rgba(255,255,255,0.28)',
  toggle:    'rgba(255,255,255,0.25)',
  userBg:    'rgba(255,255,255,0.06)',
}

const NAV_MAIN = [
  { href: '/admin/overview',   icon: '○', label: 'Visão Geral' },
  { href: '/admin/agenda',     icon: '□', label: 'Agenda' },
  { href: '/admin/dashboard',  icon: '∿', label: 'Banho & Tosa' },
]

const NAV_CLINICA = [
  { href: '/admin/clinica-vet', icon: '◈', label: 'Agenda Clínica' },
]

const NAV_COMMUNITY = [
  { href: '/admin/adocao', icon: '◡', label: 'Adoção' },
  { href: '/admin/blog',   icon: '≡', label: 'Blog' },
]

const NAV_WIP = [
  { href: '/admin/clientes',   icon: '◷', label: 'Clientes & Pets' },
  { href: '/admin/clinica',    icon: '◈', label: 'Clínica' },
  { href: '/admin/pdv',        icon: '◻', label: 'PDV' },
  { href: '/admin/produtos',   icon: '⊞', label: 'Produtos' },
  { href: '/admin/vendas',     icon: '◈', label: 'Vendas' },
  { href: '/admin/financeiro', icon: '◑', label: 'Financeiro' },
  { href: '/admin/staff',      icon: '◌', label: 'Equipe',  adminOnly: true },
  { href: '/admin/tenants',    icon: '⊡', label: 'Tenants', adminOnly: true },
]

function NavLink({ item, collapsed, active }: { item: { href: string; icon: string; label: string }; collapsed: boolean; active: boolean }) {
  return (
    <Link href={item.href} title={collapsed ? item.label : undefined} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: collapsed ? '10px 0' : '9px 12px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderRadius: 7, textDecoration: 'none',
      background: active ? C.active : 'transparent',
      color: active ? C.activeText : C.text,
      fontWeight: active ? 600 : 400,
      fontSize: '0.85rem',
      transition: 'all 0.15s',
      borderLeft: active ? `3px solid ${C.accent}` : '3px solid transparent',
    }}>
      <span style={{ fontSize: 15, flexShrink: 0, color: active ? C.accent : C.text }}>{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )
}

function SectionHeader({ icon, label, collapsed, open, onToggle }: { icon: string; label: string; collapsed: boolean; open: boolean; onToggle: () => void }) {
  return (
    <button onClick={() => !collapsed && onToggle()} style={{
      width: '100%', background: 'none', border: 'none',
      cursor: collapsed ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', gap: 8,
      padding: collapsed ? '6px 0' : '6px 12px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderRadius: 6, marginBottom: 2,
    }}>
      {collapsed ? (
        <span style={{ fontSize: 12, color: C.section }}>{icon}</span>
      ) : (
        <>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.section, letterSpacing: '0.08em', textTransform: 'uppercase', flex: 1, textAlign: 'left' }}>
            {icon} {label}
          </span>
          <span style={{ color: C.section, fontSize: 11 }}>{open ? '▾' : '▸'}</span>
        </>
      )}
    </button>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as Record<string, unknown> | undefined
  const isAdmin = user?.role === 'ADMIN'
  const [collapsed, setCollapsed] = useState(false)
  const [clinicaOpen, setClinicaOpen] = useState(true)
  const [communityOpen, setCommunityOpen] = useState(true)
  const [wipOpen] = useState(false)

  const wipItems = NAV_WIP.filter(n => !('adminOnly' in n) || !n.adminOnly || isAdmin)
  const isActive = (href: string) =>
    pathname === href || (href !== '/admin/overview' && pathname.startsWith(href))

  return (
    <aside style={{
      width: collapsed ? 64 : 224,
      minHeight: '100vh',
      background: C.bg,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '18px 0' : '18px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {!collapsed && (
          <Image src="/tarly-logo.png" alt="Tarly" width={88} height={26} style={{ objectFit: 'contain' }} priority />
        )}
        {collapsed && (
          <Image src="/tarly-logo.png" alt="Tarly" width={30} height={30} style={{ objectFit: 'contain', margin: '0 auto' }} priority />
        )}
        <button onClick={() => setCollapsed(c => !c)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.toggle, cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0 }}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav principal */}
      <nav style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1, borderBottom: `1px solid ${C.border}` }}>
        {NAV_MAIN.map(item => (
          <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
        ))}
      </nav>

      {/* Seção Clínica Vet */}
      <div style={{ padding: '8px 8px 0', borderBottom: `1px solid ${C.border}` }}>
        <SectionHeader icon="+" label="Clínica Vet" collapsed={collapsed} open={clinicaOpen} onToggle={() => setClinicaOpen(o => !o)} />
        {(clinicaOpen || collapsed) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingBottom: 8 }}>
            {NAV_CLINICA.map(item => (
              <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
            ))}
          </div>
        )}
      </div>

      {/* Seção Comunidade */}
      <div style={{ padding: '8px 8px 0', borderBottom: `1px solid ${C.border}` }}>
        <SectionHeader icon="◎" label="Comunidade" collapsed={collapsed} open={communityOpen} onToggle={() => setCommunityOpen(o => !o)} />
        {(communityOpen || collapsed) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingBottom: 8 }}>
            {NAV_COMMUNITY.map(item => (
              <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
            ))}
          </div>
        )}
      </div>

      {/* Seção Em construção */}
      <div style={{ padding: '8px 8px 0', flex: 1 }}>
        <SectionHeader icon="·" label="Em construção" collapsed={collapsed} open={wipOpen} onToggle={() => {}} />
        {wipOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {wipItems.map(item => (
              <div key={item.href} title={collapsed ? item.label : undefined} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 0' : '9px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 7, opacity: 0.35, cursor: 'not-allowed',
                color: C.text, fontSize: '0.85rem',
              }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                {!collapsed && <span style={{ fontSize: 10, opacity: 0.6 }}>×</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User */}
      <div style={{ padding: collapsed ? '12px 0' : '12px 14px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {String(user?.name ?? '')}
            </div>
            <div style={{ fontSize: '0.7rem', color: C.section }}>{String(user?.role ?? '')}</div>
          </div>
        )}
        <button onClick={() => signOut({ callbackUrl: '/admin/login' })} style={{
          width: '100%', background: C.userBg, border: `1px solid ${C.border}`, borderRadius: 6,
          color: C.text, fontSize: '0.8rem',
          padding: collapsed ? '8px 0' : '8px 12px',
          cursor: 'pointer', textAlign: collapsed ? 'center' : 'left',
        }}>
          {collapsed ? '←' : '← Sair'}
        </button>
      </div>
    </aside>
  )
}
