'use client'
import { useState, useRef, useEffect } from 'react'
import Icon from '@/components/ui/Icon'

const UNITS = [
  { label: 'SAC', sub: 'Atendimento ao cliente', phone: '558592183654', icon: '📋' },
  { label: 'Caucaia — Loja', sub: 'Jurema · Matriz', phone: '5585994257643', icon: '🏪' },
  { label: 'Caucaia — Clínica 24h', sub: 'Emergências veterinárias', phone: '5585991575287', icon: '🏥' },
  { label: 'Pecém', sub: 'São Gonçalo do Amarante', phone: '5585981173322', icon: '📍' },
  { label: 'São Gonçalo', sub: 'Centro', phone: '5585991976216', icon: '📍' },
  { label: 'Taíba', sub: 'São Gonçalo do Amarante', phone: '5585992231172', icon: '📍' },
]

export default function CTABand() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <section className="cta-band">
      <div className="container cta-inner">
        <h2>Seu pet merece o melhor.<br />Vamos cuidar juntos?</h2>
        <p>Agende agora mesmo uma consulta, banho ou vacinação em qualquer uma das nossas 4 unidades.</p>
        <div className="cta-actions">
          <a href="#agendar" className="btn btn-primary btn-lg">
            <Icon name="calendar" size={18} /> Agendar atendimento
          </a>
          <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
            {open && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setOpen(false)}>
                <div className="wa-menu" style={{ width: '100%', maxWidth: 340 }} onClick={e => e.stopPropagation()}>
                  <div className="wa-menu-header">Fale conosco pelo WhatsApp</div>
                  {UNITS.map(u => (
                    <a
                      key={u.phone}
                      href={`https://wa.me/${u.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wa-menu-item"
                      onClick={() => setOpen(false)}
                    >
                      <span className="wa-menu-icon">{u.icon}</span>
                      <span className="wa-menu-info">
                        <span className="wa-menu-label">{u.label}</span>
                        <span className="wa-menu-sub">{u.sub}</span>
                      </span>
                      <Icon name="wa" size={18} />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <button className="btn btn-white btn-lg" onClick={() => setOpen(o => !o)}>
              <Icon name="wa" size={18} /> Falar no WhatsApp
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
