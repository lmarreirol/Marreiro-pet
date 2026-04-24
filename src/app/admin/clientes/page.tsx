'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Pet = { id: string; name: string; species: string }
type Client = {
  id: string; name: string; cpf: string | null; phone: string
  email: string | null; notes: string | null; createdAt: string
  pets: Pet[]
}

const SPECIES_ICON: Record<string, string> = { cao: '🐕', gato: '🐈', outro: '🐾' }

export default function ClientesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', cpf: '', email: '', address: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null)

  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 6000)
  }

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])

  const fetchClients = useCallback(async (search: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clients?q=${encodeURIComponent(search)}`)
      const data = await res.json()
      setClients(data.clients ?? [])
      setTotal(data.total ?? 0)
    } catch {
      // silent — network issues on search
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return
    const t = setTimeout(() => fetchClients(q), 300)
    return () => clearTimeout(t)
  }, [q, status, fetchClients])

  const save = async () => {
    if (!form.name.trim()) { showToast('Nome é obrigatório.'); return }
    if (!form.phone.trim()) { showToast('WhatsApp é obrigatório.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          cpf: form.cpf.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          notes: form.notes.trim() || null,
        }),
      })

      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch { /* non-JSON response */ }

      if (res.ok && data.id) {
        setShowForm(false)
        setForm({ name: '', phone: '', cpf: '', email: '', address: '', notes: '' })
        fetchClients('')
        router.push(`/admin/clientes/${data.id}`)
      } else {
        const msg = (data.error as string) || `Erro ${res.status}: não foi possível criar o cliente.`
        showToast(msg)
      }
    } catch (e) {
      showToast('Erro de conexão. Verifique sua internet.')
      console.error('[save client]', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Clientes & Pets</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 2 }}>{total} clientes cadastrados</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
          + Novo cliente
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 16 }}>🔍</span>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nome, telefone ou CPF..."
          style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      {/* List */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>Carregando...</p>
      ) : clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
          <p>{q ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clients.map(c => (
            <Link key={c.id} href={`/admin/clientes/${c.id}`} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              background: 'white', borderRadius: 12, padding: '14px 18px',
              textDecoration: 'none', border: '1px solid #f3f4f6',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f97316', display: 'grid', placeItems: 'center', fontSize: '1.2rem', flexShrink: 0, color: 'white', fontWeight: 800 }}>
                {c.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                  📞 {c.phone}{c.email ? ` · ${c.email}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {c.pets.map(p => (
                  <span key={p.id} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20, background: '#f3f4f6', color: '#374151' }}>
                    {SPECIES_ICON[p.species] ?? '🐾'} {p.name}
                  </span>
                ))}
                {c.pets.length === 0 && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Sem pets</span>}
              </div>
              <span style={{ color: '#9ca3af', fontSize: 18, flexShrink: 0 }}>›</span>
            </Link>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? '#dc2626' : '#16a34a', color: 'white', borderRadius: 10, padding: '12px 20px', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', maxWidth: 360 }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      {/* Modal Novo Cliente */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#111827', marginBottom: '1.5rem' }}>Novo cliente</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'name', label: 'Nome completo *', placeholder: 'Ex: Ana Silva' },
                { key: 'phone', label: 'WhatsApp *', placeholder: '(85) 9 9999-9999' },
                { key: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
                { key: 'email', label: 'E-mail', placeholder: 'ana@email.com', type: 'email' },
                { key: 'address', label: 'Endereço', placeholder: 'Rua, número, bairro' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input type={f.type ?? 'text'} value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Observações</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Alergias, preferências..." rows={2}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: '1rem' }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>Cancelar</button>
              <button onClick={save} disabled={saving}
                style={{ flex: 2, background: saving ? '#d1d5db' : '#f97316', color: 'white', border: 'none', borderRadius: 8, padding: '10px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                {saving ? 'Salvando...' : 'Criar e abrir perfil →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
