'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type AdoptionPet = {
  id: string; name: string; species: string; breed: string | null; age: string | null
  gender: string; size: string | null; description: string | null; imageUrl: string | null; unitId: string | null; available: boolean; status: string
}

const ADOPTION_UNITS = [
  { id: 'caucaia', name: 'Caucaia' }, { id: 'pecem', name: 'Pecém' },
  { id: 'saogoncalo', name: 'São Gonçalo' }, { id: 'taiba', name: 'Taíba' },
]

const emptyPet = { name: '', species: 'cachorro', breed: '', age: '', gender: 'macho', size: 'pequeno', description: '', imageUrl: '', unitId: '', status: 'disponivel' }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  disponivel:   { label: 'Disponível',    color: '#16a34a', bg: '#dcfce7' },
  adotado:      { label: 'Adotado',       color: '#6366f1', bg: '#ede9fe' },
  indisponivel: { label: 'Indisponível',  color: '#dc2626', bg: '#fee2e2' },
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', outline: 'none' }

function resizeImage(file: File, maxW = 800, maxH = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function AdocaoPage() {
  const { status } = useSession()
  const router = useRouter()
  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])

  const [pets, setPets] = useState<AdoptionPet[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyPet)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/adoption?all=1').then(r => r.json()).then(d => { setPets(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => { if (status === 'authenticated') load() }, [status])

  const openNew = () => { setForm(emptyPet); setEditingId(null); setSaveError(null); setShowForm(true) }
  const openEdit = (pet: AdoptionPet) => {
    setForm({ name: pet.name, species: pet.species, breed: pet.breed ?? '', age: pet.age ?? '', gender: pet.gender, size: pet.size ?? 'pequeno', description: pet.description ?? '', imageUrl: pet.imageUrl ?? '', unitId: pet.unitId ?? '', status: pet.status ?? 'disponivel' })
    setEditingId(pet.id); setSaveError(null); setShowForm(true)
  }
  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm(emptyPet) }

  const save = async () => {
    setSaving(true); setSaveError(null)
    try {
      const payload = { ...form, unitId: form.unitId || null }
      const res = editingId
        ? await fetch(`/api/adoption/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'marreiro@admin2024' }, body: JSON.stringify(payload) })
        : await fetch('/api/adoption', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'marreiro@admin2024' }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? `Erro ${res.status}`) }
      cancelForm(); load()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  const updateStatus = async (id: string, st: string) => {
    await fetch(`/api/adoption/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'marreiro@admin2024' }, body: JSON.stringify({ status: st }) })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Remover este pet permanentemente?')) return
    await fetch(`/api/adoption/${id}`, { method: 'DELETE', headers: { 'x-admin-key': 'marreiro@admin2024' } })
    load()
  }

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try { const base64 = await resizeImage(file); setForm(f => ({ ...f, imageUrl: base64 })) }
    finally { setUploading(false) }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Adoção</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 2 }}>{pets.length} pet{pets.length !== 1 ? 's' : ''} cadastrado{pets.length !== 1 ? 's' : ''}</p>
        </div>
        {!showForm && (
          <button onClick={openNew} style={{ padding: '10px 20px', borderRadius: 10, background: '#f97316', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', border: 'none' }}>
            + Cadastrar pet
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>{editingId ? 'Editar pet' : 'Novo pet para adoção'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Nome *</label><input style={inputStyle} value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Ex: Bolinha" /></div>
            <div><label style={labelStyle}>Espécie *</label>
              <select style={inputStyle} value={form.species} onChange={e => upd('species', e.target.value)}>
                <option value="cachorro">Cachorro</option><option value="gato">Gato</option>
              </select>
            </div>
            <div><label style={labelStyle}>Raça</label><input style={inputStyle} value={form.breed} onChange={e => upd('breed', e.target.value)} placeholder="Ex: SRD, Labrador" /></div>
            <div><label style={labelStyle}>Idade</label><input style={inputStyle} value={form.age} onChange={e => upd('age', e.target.value)} placeholder="Ex: 2 anos, 6 meses" /></div>
            <div><label style={labelStyle}>Sexo *</label>
              <select style={inputStyle} value={form.gender} onChange={e => upd('gender', e.target.value)}>
                <option value="macho">Macho</option><option value="femea">Fêmea</option>
              </select>
            </div>
            <div><label style={labelStyle}>Porte</label>
              <select style={inputStyle} value={form.size} onChange={e => upd('size', e.target.value)}>
                <option value="pequeno">Pequeno</option><option value="medio">Médio</option><option value="grande">Grande</option>
              </select>
            </div>
            <div><label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => upd('status', e.target.value)}>
                <option value="disponivel">Disponível</option>
                <option value="adotado">Adotado</option>
                <option value="indisponivel">Indisponível</option>
              </select>
            </div>
            <div><label style={labelStyle}>Unidade</label>
              <select style={inputStyle} value={form.unitId} onChange={e => upd('unitId', e.target.value)}>
                <option value="">Sem unidade específica</option>
                {ADOPTION_UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Foto do pet</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div style={{ width: 80, height: 80, borderRadius: 10, border: '2px dashed #e5e7eb', background: '#f8fafc', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {form.imageUrl ? <img src={form.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28 }}>📷</span>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f97316' }}>{uploading ? 'Processando...' : form.imageUrl ? 'Clique para trocar' : 'Clique para selecionar'}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>JPG, PNG · redimensionada automaticamente</div>
                </div>
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Descrição</label>
            <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.description} onChange={e => upd('description', e.target.value)} placeholder="Personalidade, comportamento, observações..." />
          </div>
          {saveError && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>Erro: {saveError}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={!form.name || saving} style={{ padding: '12px 24px', borderRadius: 10, background: '#f97316', color: '#fff', fontWeight: 800, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', border: 'none' }}>
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar pet'}
            </button>
            <button onClick={cancelForm} style={{ padding: '12px 20px', borderRadius: 10, background: '#f3f4f6', color: '#555', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none' }}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Carregando...</div>
      ) : pets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888', background: '#fff', borderRadius: 16 }}>Nenhum pet cadastrado ainda.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {pets.map(pet => {
            const st = STATUS_CONFIG[pet.status ?? 'disponivel'] ?? STATUS_CONFIG.disponivel
            return (
              <div key={pet.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', opacity: pet.status === 'adotado' ? 0.7 : 1 }}>
                <div style={{ height: 160, background: '#f0f4f8', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {pet.imageUrl ? <img src={pet.imageUrl} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 48 }}>{pet.species === 'cachorro' ? '🐕' : '🐈'}</span>}
                  <div style={{ position: 'absolute', top: 10, left: 10, background: st.bg, color: st.color, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>{st.label}</div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 4 }}>{pet.name}</div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                    {pet.breed ?? pet.species} · {pet.gender === 'macho' ? '♂ Macho' : '♀ Fêmea'}{pet.age ? ` · ${pet.age}` : ''}{pet.unitId ? ` · ${ADOPTION_UNITS.find(u => u.id === pet.unitId)?.name}` : ''}
                  </div>
                  {pet.description && <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 12 }}>{pet.description}</p>}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ ...labelStyle, marginBottom: 4 }}>Status</label>
                    <select value={pet.status ?? 'disponivel'} onChange={e => updateStatus(pet.id, e.target.value)}
                      style={{ ...inputStyle, fontSize: 12, padding: '6px 10px', fontWeight: 700, color: st.color, background: st.bg, border: `1.5px solid ${st.color}` }}>
                      <option value="disponivel">Disponível</option>
                      <option value="adotado">Adotado</option>
                      <option value="indisponivel">Indisponível</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(pet)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#f97316', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', border: 'none' }}>✏️ Editar</button>
                    <button onClick={() => remove(pet.id)} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', border: '1.5px solid #dc2626' }}>Remover</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
