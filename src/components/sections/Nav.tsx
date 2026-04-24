'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'

const LINKS = [
  { href: '/#servicos', label: 'Serviços' },
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#unidades', label: 'Unidades' },
  { href: '/adocao', label: '❤️ Adoção', highlight: true },
  { href: '/dicas', label: 'Dicas' },
  { href: '/#contato', label: 'Contato' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <a href="/" className="nav-logo">
            <Image src="/marreiro-logo-full.png" alt="Marreiro Clínica e Pet Shop" width={160} height={60} style={{ height: 68, width: 'auto', objectFit: 'contain' }} />
          </a>

          <nav className="nav-links">
            {LINKS.map(l => (
              <a key={l.href} href={l.href} style={l.highlight ? { color: '#EF7720', fontWeight: 800 } : undefined}>{l.label}</a>
            ))}
          </nav>

          <div className="nav-cta">
            <a href="https://wa.me/5585991575287?text=Ol%C3%A1%2C%20preciso%20de%20atendimento%20de%20emerg%C3%AAncia!" className="nav-phone" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#004A99', borderRadius: 8, padding: '4px 8px', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="5" y="0" width="4" height="14" rx="1" fill="#EF7720"/>
                  <rect x="0" y="5" width="14" height="4" rx="1" fill="#EF7720"/>
                </svg>
                <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>EMERGÊNCIA</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#EF7720' }}>24 HORAS</span>
                </span>
              </span>
              <span className="nav-phone-number">(85) 99157-5287</span>
            </a>
            <a href="/#agendar" className="btn btn-primary nav-cta-btn" style={{ padding: '10px 18px', fontSize: 14 }} onClick={e => {
              const el = document.getElementById('agendar')
              if (el) { e.preventDefault(); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' }) }
            }}>Agendar</a>

            <button className="nav-hamburger" onClick={() => setOpen(o => !o)} aria-label="Menu">
              <span className={`ham-bar ${open ? 'open' : ''}`} />
              <span className={`ham-bar ${open ? 'open' : ''}`} />
              <span className={`ham-bar ${open ? 'open' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer mobile */}
      {open && <div className="nav-overlay" onClick={() => setOpen(false)} />}
      <div className={`nav-drawer ${open ? 'open' : ''}`}>
        <div className="nav-drawer-inner">
          {LINKS.map(l => (
            <a key={l.href} href={l.href} className="nav-drawer-link" style={l.highlight ? { color: '#EF7720' } : undefined} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 16, paddingTop: 16 }}>
            <a href="https://wa.me/5585991575287" target="_blank" rel="noopener noreferrer" className="nav-drawer-link" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setOpen(false)}>
              <Icon name="wa" size={18} /> (85) 99157-5287 — Plantão 24h
            </a>
            <a href="/#agendar" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 16, padding: '14px', fontSize: 16 }} onClick={e => {
              setOpen(false)
              const el = document.getElementById('agendar')
              if (el) { e.preventDefault(); setTimeout(() => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' }), 100) }
            }}>Agendar agora</a>
          </div>
        </div>
      </div>
    </>
  )
}
