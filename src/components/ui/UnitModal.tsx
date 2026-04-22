'use client'
import { useEffect } from 'react'

const UNITS = [
  { name: 'Marreiro Caucaia', sub: 'Jurema · Matriz', phone: '5585994257643', clinicOnly: false, lojaOnly: true },
  { name: 'Marreiro Caucaia', sub: 'Clínica 24 Horas · Emergências veterinárias', phone: '5585991575287', clinicOnly: true, lojaOnly: false },
  { name: 'Marreiro Pecém', sub: 'São Gonçalo do Amarante', phone: '5585981173322', clinicOnly: false, lojaOnly: false },
  { name: 'Marreiro São Gonçalo', sub: 'Centro', phone: '5585991976216', clinicOnly: false, lojaOnly: false },
  { name: 'Marreiro Taíba', sub: 'São Gonçalo do Amarante', phone: '5585992231172', clinicOnly: false, lojaOnly: false },
]

interface UnitModalProps {
  message: string
  onClose: () => void
  isClinic?: boolean
}

export default function UnitModal({ message, onClose, isClinic = false }: UnitModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleUnit = (phone: string) => {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Escolha a unidade</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--muted)', lineHeight: 1 }}>×</button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>Selecione a unidade mais próxima de você para continuar no WhatsApp.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {UNITS.filter(u => isClinic ? !u.lojaOnly : !u.clinicOnly).map(u => (
            <button
              key={u.name}
              onClick={() => handleUnit(u.phone)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: 'var(--bg)', border: '2px solid var(--line)',
                borderRadius: 14, padding: '14px 18px', cursor: 'pointer',
                textAlign: 'left', transition: 'border-color .15s, background .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--orange)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--orange-soft)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)' }}
            >
              <span style={{ width: 40, height: 40, borderRadius: 10, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{u.name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{u.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
