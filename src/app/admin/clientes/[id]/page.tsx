'use client'
import { useEffect, useState, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SoapForm from '@/components/admin/SoapForm'

type Pet = {
  id: string; name: string; species: string; breed: string | null
  birthDate: string | null; gender: string | null; weight: string | null
  microchip: string | null; notes: string | null
  records: { id: string; date: string; avaliacao: string | null; vetName: string | null; status: string }[]
}
type Client = {
  id: string; name: string; cpf: string | null; phone: string
  email: string | null; address: string | null; notes: string | null
  pets: Pet[]
}

const SPECIES: Record<string, { label: string; icon: string }> = {
  cao: { label: 'Cão', icon: '🐕' },
  gato: { label: 'Gato', icon: '🐈' },
  outro: { label: 'Outro', icon: '🐾' },
}

export default function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { status } = useSession()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [showSoap, setShowSoap] = useState(false)
  const [showAddPet, setShowAddPet] = useState(false)
  const [petForm, setPetForm] = useState({ name: '', species: 'cao', breed: '', gender: 'macho', birthDate: '', weight: '', microchip: '', notes: '' })
  const [savingPet, setSavingPet] = useState(false)
  const [petError, setPetError] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'historico'>('info')

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])

  const load = () => {
    fetch(`/api/clients/${id}`)
      .then(r => r.json())
      .then(d => { setClient(d); if (d.pets?.[0]) setSelectedPetId(d.pets[0].id) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (status === 'authenticated') load() }, [status, id])

  const savePet = async () => {
    if (!petForm.name.trim()) { setPetError('Nome do pet é obrigatório.'); return }
    setSavingPet(true)
    setPetError('')
    try {
      const res = await fetch('/api/pets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: id,
          name: petForm.name,
          species: petForm.species,
          breed: petForm.breed || null,
          gender: petForm.gender || null,
          birthDate: petForm.birthDate || null,
          weight: petForm.weight ? parseFloat(petForm.weight) : null,
          microchip: petForm.microchip || null,
          notes: petForm.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setPetError(data.error ?? 'Erro ao salvar pet.'); return }
      setShowAddPet(false)
      setPetError('')
      setPetForm({ name: '', species: 'cao', breed: '', gender: 'macho', birthDate: '', weight: '', microchip: '', notes: '' })
      load()
    } catch {
      setPetError('Erro de conexão. Tente novamente.')
    } finally {
      setSavingPet(false)
    }
  }

  const selectedPet = client?.pets.find(p => p.id === selectedPetId)

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>Carregando...</div>
  if (!client) return <div style={{ padding: '4rem', textAlign: 'center', color: '#dc2626' }}>Cliente não encontrado.</div>

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        <Link href="/admin/clientes" style={{ color: '#9ca3af', textDecoration: 'none' }}>Clientes</Link>
        <span style={{ color: '#d1d5db' }}>›</span>
        <span style={{ color: '#374151', fontWeight: 600 }}>{client.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Coluna esquerda: tutor + pets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Card tutor */}
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f97316', display: 'grid', placeItems: 'center', fontSize: '1.5rem', color: 'white', fontWeight: 800, marginBottom: '1rem' }}>
              {client.name[0].toUpperCase()}
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', marginBottom: 4 }}>{client.name}</h2>
            {client.cpf && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 2 }}>CPF: {client.cpf}</div>}
            <div style={{ fontSize: '0.85rem', color: '#374151', marginBottom: 4 }}>📞 {client.phone}</div>
            {client.email && <div style={{ fontSize: '0.85rem', color: '#374151', marginBottom: 4 }}>✉️ {client.email}</div>}
            {client.address && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 4 }}>📍 {client.address}</div>}
            {client.notes && <div style={{ fontSize: '0.8rem', color: '#6b7280', background: '#f9fafb', padding: '8px 10px', borderRadius: 8, marginTop: 8 }}>📝 {client.notes}</div>}
            <a href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', marginTop: 12, background: '#dcfce7', color: '#16a34a', borderRadius: 8, padding: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
              💬 WhatsApp
            </a>
          </div>

          {/* Pets */}
          <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Pets ({client.pets.length})</h3>
              <button onClick={() => setShowAddPet(true)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem', color: '#374151', fontWeight: 600 }}>
                + Pet
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {client.pets.map(p => (
                <button key={p.id} onClick={() => { setSelectedPetId(p.id); setActiveTab('info') }}
                  style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${selectedPetId === p.id ? '#f97316' : '#e5e7eb'}`, background: selectedPetId === p.id ? '#fff7f0' : '#f9fafb', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 20 }}>{SPECIES[p.species]?.icon ?? '🐾'}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{SPECIES[p.species]?.label}{p.breed ? ` · ${p.breed}` : ''}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#9ca3af' }}>{p.records.length} consulta{p.records.length !== 1 ? 's' : ''}</span>
                </button>
              ))}
              {client.pets.length === 0 && <p style={{ fontSize: '0.85rem', color: '#9ca3af', textAlign: 'center', padding: '1rem 0' }}>Nenhum pet cadastrado.</p>}
            </div>
          </div>
        </div>

        {/* Coluna direita: detalhes do pet */}
        {selectedPet ? (
          <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
            {/* Header pet */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f9fafb', display: 'grid', placeItems: 'center', fontSize: '1.8rem', border: '1px solid #e5e7eb' }}>
                {SPECIES[selectedPet.species]?.icon ?? '🐾'}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>{selectedPet.name}</h2>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {SPECIES[selectedPet.species]?.label}{selectedPet.breed ? ` · ${selectedPet.breed}` : ''}
                  {selectedPet.gender ? ` · ${selectedPet.gender}` : ''}
                  {selectedPet.weight ? ` · ${selectedPet.weight} kg` : ''}
                </div>
              </div>
              <button onClick={() => setShowSoap(true)}
                style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                🩺 Nova consulta
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
              {(['info', 'historico'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: activeTab === t ? 700 : 400, color: activeTab === t ? '#f97316' : '#6b7280', borderBottom: activeTab === t ? '2px solid #f97316' : '2px solid transparent' }}>
                  {t === 'info' ? 'Informações' : `Histórico (${selectedPet.records.length})`}
                </button>
              ))}
            </div>

            <div style={{ padding: '1.5rem' }}>
              {activeTab === 'info' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: 'Espécie', value: SPECIES[selectedPet.species]?.label },
                    { label: 'Raça', value: selectedPet.breed || '—' },
                    { label: 'Gênero', value: selectedPet.gender || '—' },
                    { label: 'Peso', value: selectedPet.weight ? `${selectedPet.weight} kg` : '—' },
                    { label: 'Nascimento', value: selectedPet.birthDate ? new Date(selectedPet.birthDate).toLocaleDateString('pt-BR') : '—' },
                    { label: 'Microchip', value: selectedPet.microchip || '—' },
                  ].map(f => (
                    <div key={f.label} style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>{f.label}</div>
                      <div style={{ fontWeight: 600, color: '#111827', marginTop: 2 }}>{f.value}</div>
                    </div>
                  ))}
                  {selectedPet.notes && (
                    <div style={{ gridColumn: '1/-1', background: '#f9fafb', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500, marginBottom: 4 }}>Observações</div>
                      <div style={{ fontSize: '0.875rem', color: '#374151' }}>{selectedPet.notes}</div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'historico' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedPet.records.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Nenhuma consulta registrada.</p>
                  )}
                  {selectedPet.records.map(r => (
                    <Link key={r.id} href={`/admin/clinica/${r.id}`} style={{
                      display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px',
                      background: '#f9fafb', borderRadius: 10, textDecoration: 'none',
                      border: '1px solid #e5e7eb',
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: r.status === 'signed' ? '#dcfce7' : '#fef3c7', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>
                        {r.status === 'signed' ? '✅' : '📋'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                          {r.avaliacao ? r.avaliacao.substring(0, 60) + (r.avaliacao.length > 60 ? '...' : '') : 'Consulta sem diagnóstico'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                          {new Date(r.date).toLocaleDateString('pt-BR')} {r.vetName ? `· ${r.vetName}` : ''}
                        </div>
                      </div>
                      <span style={{ color: '#9ca3af', fontSize: 18 }}>›</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 14, padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
            Selecione um pet para ver detalhes.
          </div>
        )}
      </div>

      {/* Modal SOAP */}
      {showSoap && selectedPet && (
        <SoapForm
          pet={{ id: selectedPet.id, name: selectedPet.name, species: selectedPet.species, breed: selectedPet.breed, age: selectedPet.birthDate ? `${Math.floor((Date.now() - new Date(selectedPet.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))} anos` : null }}
          onClose={() => setShowSoap(false)}
          onSaved={(recordId) => { setShowSoap(false); router.push(`/admin/clinica/${recordId}`) }}
        />
      )}

      {/* Modal Add Pet */}
      {showAddPet && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={e => { if (e.target === e.currentTarget) { setShowAddPet(false); setPetError('') } }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 440 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.25rem', color: '#111827' }}>Adicionar pet</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'name', label: 'Nome do pet *', placeholder: 'Ex: Rex' },
                { key: 'breed', label: 'Raça', placeholder: 'Ex: Labrador' },
                { key: 'birthDate', label: 'Data de nascimento', placeholder: '', type: 'date' },
                { key: 'weight', label: 'Peso (kg)', placeholder: 'Ex: 8.5', type: 'number' },
                { key: 'microchip', label: 'Microchip', placeholder: '15 dígitos' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input type={f.type ?? 'text'} value={petForm[f.key as keyof typeof petForm]} onChange={e => setPetForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Espécie</label>
                  <select value={petForm.species} onChange={e => setPetForm(p => ({ ...p, species: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '0.875rem', background: 'white' }}>
                    <option value="cao">🐕 Cão</option>
                    <option value="gato">🐈 Gato</option>
                    <option value="outro">🐾 Outro</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Gênero</label>
                  <select value={petForm.gender} onChange={e => setPetForm(p => ({ ...p, gender: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '0.875rem', background: 'white' }}>
                    <option value="macho">Macho</option>
                    <option value="femea">Fêmea</option>
                  </select>
                </div>
              </div>
            </div>
            {petError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginTop: 8, fontSize: '0.875rem', color: '#dc2626' }}>
                ⚠️ {petError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: '1rem' }}>
              <button onClick={() => { setShowAddPet(false); setPetError('') }} style={{ flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>Cancelar</button>
              <button onClick={savePet} disabled={savingPet}
                style={{ flex: 2, background: savingPet ? '#d1d5db' : '#f97316', color: 'white', border: 'none', borderRadius: 8, padding: '10px', cursor: savingPet ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                {savingPet ? 'Salvando...' : 'Adicionar pet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
