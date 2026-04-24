'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Nav from '@/components/sections/Nav'
import Footer from '@/components/sections/Footer'

type Pet = {
  id: string
  name: string
  species: string
  breed: string | null
  age: string | null
  gender: string
  size: string | null
  description: string | null
  imageUrl: string | null
  unitId: string | null
}

const UNITS: Record<string, string> = {
  caucaia: 'Marreiro Caucaia',
  pecem: 'Marreiro Pecém',
  saogoncalo: 'Marreiro São Gonçalo',
  taiba: 'Marreiro Taíba',
}

const WA_PHONES: Record<string, string> = {
  caucaia: '5585991575287',
  pecem: '5585981173322',
  saogoncalo: '5585991976216',
  taiba: '5585992231172',
}

const SIZE_LABELS: Record<string, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
}

export default function AdocaoPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | 'cachorro' | 'gato'>('todos')
  const [lightbox, setLightbox] = useState<Pet | null>(null)

  useEffect(() => {
    fetch('/api/adoption')
      .then(r => r.json())
      .then(d => { setPets(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'todos' ? pets : pets.filter(p => p.species === filter)

  const waMsg = (pet: Pet) => encodeURIComponent(
    `Olá! Vi no site da Marreiro Pet e tenho interesse em adotar o(a) *${pet.name}* (${pet.species === 'cachorro' ? '🐕' : '🐈'} ${pet.breed ?? pet.species}). Poderia me passar mais informações?`
  )

  return (
    <>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: 560, width: '100%' }}>
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: -16, right: -16, width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, lineHeight: 1 }}>×</button>
            {lightbox.imageUrl ? (
              <img src={lightbox.imageUrl} alt={lightbox.name} loading="lazy" style={{ width: '100%', borderRadius: 16, display: 'block', maxHeight: '80vh', objectFit: 'contain' }} />
            ) : (
              <div style={{ background: '#1a1a2e', borderRadius: 16, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>{lightbox.species === 'cachorro' ? '🐕' : '🐈'}</div>
            )}
            <div style={{ background: '#fff', borderRadius: '0 0 16px 16px', padding: '14px 20px', textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{lightbox.name}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{lightbox.breed ?? lightbox.species} · {lightbox.gender === 'macho' ? '♂ Macho' : '♀ Fêmea'}{lightbox.age ? ` · ${lightbox.age}` : ''}</div>
            </div>
          </div>
        </div>
      )}
      <Nav />
      <main style={{ paddingTop: 80 }}>
        {/* Hero */}
        <section style={{ background: 'linear-gradient(135deg, #004A99 0%, #0066cc 100%)', color: '#fff', padding: '60px 24px 48px', textAlign: 'center' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, opacity: 0.7, textTransform: 'uppercase', marginBottom: 12 }}>Rede de Adoção Marreiro Pet</div>
            <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>Adote um amor<br /><span style={{ color: '#EF7720' }}>resgatado</span></h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, opacity: 0.88, marginBottom: 0 }}>
              A Marreiro Pet acolhe e cuida de animais resgatados até encontrarem um lar definitivo. Todos os pets passam por avaliação veterinária, vacinação e castração antes da adoção.
            </p>
          </div>
        </section>

        {/* Info pills */}
        <section style={{ background: '#f0f4f8', padding: '28px 24px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { icon: '💉', text: 'Vacinados em dia' },
              { icon: '✂️', text: 'Castrados' },
              { icon: '🩺', text: 'Avaliação veterinária' },
              { icon: '❤️', text: 'Adoção responsável' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 30, padding: '10px 18px', fontSize: 14, fontWeight: 700, color: '#004A99', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: 18 }}>{icon}</span> {text}
              </div>
            ))}
          </div>
        </section>

        {/* Filtros + grid */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
            {(['todos', 'cachorro', 'gato'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '9px 22px', borderRadius: 30, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                border: `2px solid ${filter === f ? '#004A99' : '#e5e7eb'}`,
                background: filter === f ? '#004A99' : '#fff',
                color: filter === f ? '#fff' : '#444',
              }}>
                {f === 'todos' ? 'Todos' : f === 'cachorro' ? '🐕 Cachorros' : '🐈 Gatos'}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888', fontSize: 15 }}>Carregando pets disponíveis...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                {filter === 'todos' ? 'Nenhum pet disponível no momento' : `Nenhum ${filter} disponível no momento`}
              </div>
              <div style={{ fontSize: 14, marginBottom: 20 }}>Volte em breve — novos resgates chegam com frequência!</div>
              {filter !== 'todos' && (
                <button onClick={() => setFilter('todos')} style={{ padding: '10px 24px', borderRadius: 30, background: '#004A99', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Ver todos os pets
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {filtered.map(pet => (
                <div key={pet.id} style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
                  {/* Foto */}
                  <div onClick={() => setLightbox(pet)} style={{ position: 'relative', height: 220, background: '#f0f4f8', cursor: 'zoom-in' }}>
                    {pet.imageUrl ? (
                      <Image src={pet.imageUrl} alt={pet.name} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
                        {pet.species === 'cachorro' ? '🐕' : '🐈'}
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 12, left: 12, background: pet.gender === 'macho' ? '#dbeafe' : '#fce7f3', color: pet.gender === 'macho' ? '#1d4ed8' : '#be185d', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
                      {pet.gender === 'macho' ? '♂ Macho' : '♀ Fêmea'}
                    </div>
                    {pet.unitId && (
                      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,74,153,0.85)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 20 }}>
                        {UNITS[pet.unitId]?.replace('Marreiro ', '') ?? pet.unitId}
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 900, fontSize: 20, color: '#0F1B2D', marginBottom: 4 }}>{pet.name}</div>
                    <div style={{ fontSize: 13, color: '#888', marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {pet.breed && <span>{pet.breed}</span>}
                      {pet.age && <span>· {pet.age}</span>}
                      {pet.size && <span>· {SIZE_LABELS[pet.size] ?? pet.size}</span>}
                    </div>
                    {pet.description && (
                      <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{pet.description}</p>
                    )}
                    <a
                      href={`https://wa.me/${pet.unitId ? WA_PHONES[pet.unitId] : '5585991575287'}?text=${waMsg(pet)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, background: '#25D366', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none', marginTop: 'auto' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Quero adotar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
