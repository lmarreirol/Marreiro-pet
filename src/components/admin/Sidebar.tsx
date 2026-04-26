'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

// Paleta Tarly
const C = {
  bg:        '#031544',   // azul marinho profundo
  border:    'rgba(255,255,255,0.07)',
  active:    '#3B82F6',   // azul tech
  activeText:'#ffffff',
  accent:    '#A855F7',   // roxo inovação
  text:      'rgba(255,255,255,0.55)',
  textHover: 'rgba(255,255,255,0.85)',
  section:   '#64748B',   // cinza institucional
  toggle:    'rgba(255,255,255,0.25)',
  userBg:    'rgba(255,255,255,0.06)',
}

const NAV_MAIN = [
  { href: '/admin/overview', icon: '○', label: 'Visão Geral' },
  { href: '/admin/agenda',   icon: '□', label: 'Agenda' },
]

const NAV_BANHO = [
  { href: '/admin/dashboard', icon: '∿', label: 'Agenda Salão' },
  { href: '/admin/staff',     icon: '◌', label: 'Equipe',  adminOnly: true },
  { href: '/admin/precos',    icon: '%', label: 'Preços',   adminOnly: true },
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
  { href: '/admin/tenants',    icon: '⊡', label: 'Tenants', adminOnly: true },
]

function Tooltip({ label, anchorRef }: { label: string; anchorRef: React.RefObject<HTMLSpanElement | null> }) {
  const [pos, setPos] = useState({ top: 0, left: 0 })
  useEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect()
      setPos({ top: r.top + r.height / 2, left: r.right + 10 })
    }
  }, [anchorRef])
  if (typeof document === 'undefined') return null
  return createPortal(
    <span style={{
      position: 'fixed', top: pos.top, left: pos.left,
      transform: 'translateY(-50%)',
      background: '#031544', color: '#fff',
      fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
      padding: '5px 12px', borderRadius: 8,
      boxShadow: '0 4px 20px rgba(59,130,246,0.2)',
      border: '1px solid rgba(59,130,246,0.2)',
      pointerEvents: 'none', zIndex: 9999,
      opacity: 0, animation: 'tooltipIn 0.18s ease forwards',
    }}>
      <span style={{
        position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)',
        borderWidth: 5, borderStyle: 'solid',
        borderColor: 'transparent #031544 transparent transparent',
      }} />
      {label}
    </span>,
    document.body
  )
}

function NavLink({ item, collapsed, active }: { item: { href: string; icon: string; label: string }; collapsed: boolean; active: boolean }) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  return (
    <span ref={ref} style={{ position: 'relative', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={item.href} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '10px 0' : '9px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 7, textDecoration: 'none',
        background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
        color: active ? '#fff' : C.text,
        fontWeight: active ? 600 : 400,
        fontSize: '0.85rem',
        transition: 'all 0.15s',
        borderLeft: active ? `3px solid #A855F7` : '3px solid transparent',
      }}>
        <span style={{ fontSize: 15, flexShrink: 0, color: active ? '#A855F7' : C.text }}>{item.icon}</span>
        {!collapsed && <span>{item.label}</span>}
      </Link>
      {collapsed && hovered && <Tooltip label={item.label} anchorRef={ref} />}
    </span>
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
  const [collapsed, setCollapsed] = useState(true)
  const [banhoOpen, setBanhoOpen] = useState(true)
  const [clinicaOpen, setClinicaOpen] = useState(true)
  const [communityOpen, setCommunityOpen] = useState(true)
  const [wipOpen, setWipOpen] = useState(false)

  const banhoItems = NAV_BANHO.filter(n => !('adminOnly' in n) || !n.adminOnly || isAdmin)

  const wipItems = NAV_WIP.filter(n => !('adminOnly' in n) || !n.adminOnly || isAdmin)
  const isActive = (href: string) =>
    pathname === href || (href !== '/admin/overview' && pathname.startsWith(href))

  return (
    <aside style={{
      width: collapsed ? 52 : 180,
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
      <div style={{ padding: '18px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {!collapsed && (
          <Image src="/tarly-logo.png" alt="Tarly" width={88} height={26} style={{ objectFit: 'contain', cursor: 'pointer' }} priority onClick={() => setCollapsed(true)} />
        )}
        {collapsed && (
          <Image src="/tarly-icon.png" alt="Tarly" width={32} height={32} style={{ objectFit: 'contain', cursor: 'pointer' }} priority onClick={() => setCollapsed(false)} />
        )}
      </div>

      {/* Nav principal */}
      <nav style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1, borderBottom: `1px solid ${C.border}` }}>
        {NAV_MAIN.map(item => (
          <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
        ))}
      </nav>

      {/* Seção Banho & Tosa */}
      <div style={{ padding: '8px 8px 0', borderBottom: `1px solid ${C.border}` }}>
        <SectionHeader icon="∿" label="Banho & Tosa" collapsed={collapsed} open={banhoOpen} onToggle={() => setBanhoOpen(o => !o)} />
        {(banhoOpen || collapsed) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingBottom: 8 }}>
            {banhoItems.map(item => (
              <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
            ))}
          </div>
        )}
      </div>

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
        <SectionHeader icon="·" label="Em construção" collapsed={collapsed} open={wipOpen} onToggle={() => setWipOpen(o => !o)} />
        {(wipOpen || collapsed) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingBottom: 8 }}>
            {wipItems.map(item => (
              <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
            ))}
          </div>
        )}
      </div>

      {/* Configurações */}
      {isAdmin && (
        <div style={{ padding: '6px 8px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <NavLink item={{ href: '/admin/settings', icon: '⚙', label: 'Configurações' }} collapsed={collapsed} active={isActive('/admin/settings')} />
        </div>
      )}

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
