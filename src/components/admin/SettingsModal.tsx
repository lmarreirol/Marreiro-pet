'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type UserRow = { id: string; username: string; name: string; role: string; unitId: string | null }
type PriceRule = { id: string; type: string; value: string; multiplier: number; label: string | null; active: boolean; unitId: string | null }

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  RECEPTIONIST: 'Recepcionista',
  GROOMER: 'Tosador',
}

function pctLabel(m: number) {
  const p = Math.round((m - 1) * 100)
  return (p >= 0 ? '+' : '') + p + '%'
}

function formatType(type: string, value: string) {
  if (type === 'dow') {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    return value.split(',').map(d => days[Number(d)]).join(', ')
  }
  if (type === 'date') return value
  if (type === 'range') { const [s, e] = value.split(','); return `${s} → ${e}` }
  return value
}

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'users' | 'precos'>('users')
  const [users, setUsers] = useState<UserRow[]>([])
  const [rules, setRules] = useState<PriceRule[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingRules, setLoadingRules] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => setUsers(d.users ?? d ?? []))
      .catch(() => {})
      .finally(() => setLoadingUsers(false))
  }, [])

  useEffect(() => {
    fetch('/api/admin/price-rules')
      .then(r => r.json())
      .then(d => setRules(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingRules(false))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '90%', maxWidth: 640,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#111827' }}>Configurações</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 24px 0', borderBottom: '2px solid #f3f4f6' }}>
          {([
            { id: 'users', icon: '👥', label: 'Usuários' },
            { id: 'precos', icon: '⚙', label: 'Preços' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 14,
              color: tab === t.id ? '#004A99' : '#6b7280',
              borderBottom: tab === t.id ? '2px solid #004A99' : '2px solid transparent',
              marginBottom: -2,
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>

          {tab === 'users' && (
            loadingUsers ? <p style={{ color: '#9ca3af', fontSize: 14 }}>Carregando...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Usuário', 'Nome', 'Cargo', 'Unidade'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700, color: '#6b7280', borderBottom: '1.5px solid #f3f4f6', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '8px 8px', fontWeight: 600, color: '#111827' }}>{u.username}</td>
                      <td style={{ padding: '8px 8px', color: '#374151' }}>{u.name}</td>
                      <td style={{ padding: '8px 8px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 6 }}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </td>
                      <td style={{ padding: '8px 8px', color: '#6b7280' }}>{u.unitId ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {tab === 'precos' && (
            loadingRules ? <p style={{ color: '#9ca3af', fontSize: 14 }}>Carregando...</p> : rules.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 14 }}>Nenhuma regra cadastrada. Acesse <strong>/admin/precos</strong> para criar.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Tipo', 'Valor', 'Ajuste', 'Label', 'Ativo'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700, color: '#6b7280', borderBottom: '1.5px solid #f3f4f6', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rules.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '8px 8px', fontWeight: 600, color: '#111827', textTransform: 'capitalize' }}>{r.type}</td>
                      <td style={{ padding: '8px 8px', color: '#374151' }}>{formatType(r.type, r.value)}</td>
                      <td style={{ padding: '8px 8px' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: r.multiplier >= 1 ? '#dc2626' : '#16a34a' }}>
                          {pctLabel(r.multiplier)}
                        </span>
                      </td>
                      <td style={{ padding: '8px 8px', color: '#6b7280' }}>{r.label ?? '—'}</td>
                      <td style={{ padding: '8px 8px' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.active ? '#16a34a' : '#d1d5db', display: 'inline-block' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}
