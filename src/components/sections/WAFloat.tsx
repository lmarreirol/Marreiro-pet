'use client'
import { useState, useEffect, useRef } from 'react'
import Icon from '@/components/ui/Icon'

const UNITS = [
  { label: 'SAC', sub: 'Atendimento ao cliente', phone: '558592183654', icon: '📋' },
  { label: 'Caucaia — Loja', sub: 'Jurema · Matriz', phone: '5585994257643', icon: '🏪' },
  { label: 'Caucaia — Clínica 24h', sub: 'Emergências veterinárias', phone: '5585991575287', icon: '🏥' },
  { label: 'Pecém', sub: 'São Gonçalo do Amarante', phone: '5585981173322', icon: '📍' },
  { label: 'São Gonçalo', sub: 'Centro', phone: '5585991976216', icon: '📍' },
  { label: 'Taíba', sub: 'São Gonçalo do Amarante', phone: '5585992231172', icon: '📍' },
]

export default function WAFloat() {
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
    <div ref={ref} className="wa-float-wrap">
      {open && (
        <div className="wa-menu">
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
      )}
      <button
        className="wa-float"
        onClick={() => setOpen(o => !o)}
        aria-label="WhatsApp"
      >
        <Icon name="wa" size={28} />
      </button>
    </div>
  )
}
