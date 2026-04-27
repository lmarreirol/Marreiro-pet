'use client'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type UserRow = { id: string; username: string; name: string; role: string; unitId: string | null }

const UNITS = [
  { id: '',           label: '— Sem unidade (Admin) —' },
  { id: 'caucaia',    label: 'Caucaia' },
  { id: 'pecem',      label: 'Pecém' },
  { id: 'saogoncalo', label: 'São Gonçalo' },
  { id: 'taiba',      label: 'Taíba' },
]

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  RECEPTIONIST: 'Recepcionista',
  GROOMER: 'Tosador',
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const user = session?.user as Record<string, unknown> | undefined

  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [editForm, setEditForm] = useState({ name: '', role: 'RECEPTIONIST', unitId: '', password: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ username: '', name: '', password: '', role: 'RECEPTIONIST', unitId: '' })
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])
  useEffect(() => { if (status === 'authenticated' && user?.role !== 'ADMIN') router.push('/admin/overview') }, [status, user, router])

  const load = () => {
    setLoading(true)
    fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(d); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => { if (status === 'authenticated') load() }, [status])

  const openEdit = (u: UserRow) => {
    setEditingUser(u)
    setEditForm({ name: u.name, role: u.role, unitId: u.unitId ?? '', password: '' })
  }

  const saveEdit = async () => {
    if (!editingUser) return
    setEditSaving(true)
    const body: Record<string, string> = { name: editForm.name, role: editForm.role, unitId: editForm.unitId }
    if (editForm.password) body.password = editForm.password
    await fetch(`/api/admin/users/${editingUser.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    setEditSaving(false)
    setEditingUser(null)
    load()
  }

  const deleteUser = async (u: UserRow) => {
    if (!window.confirm(`Deletar "${u.username}"? Esta ação não pode ser desfeita.`)) return
    await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
    load()
  }

  const saveCreate = async () => {
    setCreateError('')
    if (!createForm.username || !createForm.password) { setCreateError('Usuário e senha são obrigatórios.'); return }
    setCreateSaving(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...createForm, unitId: createForm.unitId || null }),
    })
    const data = await res.json()
    setCreateSaving(false)
    if (!res.ok) { setCreateError(data.error ?? 'Erro ao criar usuário'); return }
    setCreating(false)
    setCreateForm({ username: '', name: '', password: '', role: 'RECEPTIONIST', unitId: '' })
    load()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }

  const [activeTab] = useState<'users'>('users')

  if (status === 'loading') return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>Configurações</h1>
        <button onClick={() => signOut({ callbackUrl: '/admin/login' })} style={{ padding: '8px 18px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1.5px solid #fecaca' }}>
          ← Sair
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #f3f4f6' }}>
        <button style={{
          padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: 14,
          color: activeTab === 'users' ? '#004A99' : '#6b7280',
          borderBottom: activeTab === 'users' ? '2px solid #004A99' : '2px solid transparent',
          marginBottom: -2,
        }}>
          👥 Usuários
        </button>
      </div>

      {activeTab === 'users' && (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={() => setCreating(true)} style={{ background: '#004A99', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
          + Novo usuário
        </button>
      </div>
      )}

      {activeTab === 'users' && (loading ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '4rem' }}>Carregando...</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                {['Usuário', 'Nome', 'Função', 'Unidade', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#888' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#111827' }}>{u.username}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>{u.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: u.role === 'ADMIN' ? '#eff6ff' : '#f0fdf4', color: u.role === 'ADMIN' ? '#1d4ed8' : '#15803d' }}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                    {UNITS.find(un => un.id === (u.unitId ?? ''))?.label ?? u.unitId ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(u)} style={{ padding: '5px 12px', borderRadius: 7, background: '#f1f5f9', border: 'none', fontWeight: 700, fontSize: 12, color: '#374151', cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => deleteUser(u)} style={{ padding: '5px 12px', borderRadius: 7, background: '#fff', border: '1.5px solid #fca5a5', fontWeight: 700, fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Modal editar */}
      {editingUser && (
        <div onClick={() => setEditingUser(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem' }}>Editar usuário</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={lbl}>Nome</label><input style={inp} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div>
                <label style={lbl}>Função</label>
                <select style={inp} value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                  {Object.entries(ROLE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Unidade</label>
                <select style={inp} value={editForm.unitId} onChange={e => setEditForm(f => ({ ...f, unitId: e.target.value }))}>
                  {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Nova senha (deixe em branco para manter)</label><input style={inp} type="password" placeholder="••••••••" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem' }}>
              <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#f3f4f6', border: 'none', fontWeight: 600, fontSize: 14, color: '#374151', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveEdit} disabled={editSaving} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#004A99', border: 'none', fontWeight: 700, fontSize: 14, color: '#fff', cursor: 'pointer', opacity: editSaving ? 0.7 : 1 }}>{editSaving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal criar */}
      {creating && (
        <div onClick={() => setCreating(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem' }}>Novo usuário</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={lbl}>Usuário (login) *</label><input style={inp} placeholder="ex: joao.silva" value={createForm.username} onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))} /></div>
              <div><label style={lbl}>Nome completo</label><input style={inp} placeholder="Ex: João Silva" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label style={lbl}>Senha *</label><input style={inp} type="password" placeholder="••••••••" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} /></div>
              <div>
                <label style={lbl}>Função</label>
                <select style={inp} value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}>
                  {Object.entries(ROLE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Unidade</label>
                <select style={inp} value={createForm.unitId} onChange={e => setCreateForm(f => ({ ...f, unitId: e.target.value }))}>
                  {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
              </div>
              {createError && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{createError}</p>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem' }}>
              <button onClick={() => { setCreating(false); setCreateError('') }} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#f3f4f6', border: 'none', fontWeight: 600, fontSize: 14, color: '#374151', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveCreate} disabled={createSaving} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#004A99', border: 'none', fontWeight: 700, fontSize: 14, color: '#fff', cursor: 'pointer', opacity: createSaving ? 0.7 : 1 }}>{createSaving ? 'Criando...' : 'Criar usuário'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
