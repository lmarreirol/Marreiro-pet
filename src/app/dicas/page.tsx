'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Nav from '@/components/sections/Nav'
import Footer from '@/components/sections/Footer'

type Post = {
  id: string
  slug: string
  title: string
  tag: string
  excerpt: string
  coverColor: string
  imageUrl: string | null
  readTime: string
  createdAt: string
}

const COVER_GRADIENT: Record<string, string> = {
  orange: 'linear-gradient(135deg, #EF7720, #F89C5F)',
  orangeDark: 'linear-gradient(135deg, #D35F0D, #EF7720)',
  blue: 'linear-gradient(135deg, #004A99, #0066CC)',
  green: 'linear-gradient(135deg, #16a34a, #22c55e)',
  purple: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
}

const TAGS = ['Todos', 'Nutrição', 'Saúde', 'Comportamento', 'Grooming', 'Bem-estar']

export default function DicasPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [tag, setTag] = useState('Todos')

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.json())
      .then(d => { setPosts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = tag === 'Todos' ? posts : posts.filter(p => p.tag === tag)
  const activeTags = ['Todos', ...Array.from(new Set(posts.map(p => p.tag)))]

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 80 }}>
        {/* Hero */}
        <section style={{ background: 'linear-gradient(135deg, #004A99 0%, #0066cc 100%)', color: '#fff', padding: '60px 24px 48px', textAlign: 'center' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, opacity: 0.7, textTransform: 'uppercase', marginBottom: 12 }}>Marreiro Pet · Blog</div>
            <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>Dicas para <span style={{ color: '#EF7720' }}>tutores</span></h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, opacity: 0.88 }}>
              Conteúdo escrito pela nossa equipe veterinária — nutrição, saúde, comportamento e muito mais.
            </p>
          </div>
        </section>

        {/* Filtros */}
        <section style={{ background: '#f0f4f8', padding: '24px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {activeTags.map(t => (
              <button key={t} onClick={() => setTag(t)} style={{
                padding: '8px 20px', borderRadius: 30, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                border: `2px solid ${tag === t ? '#004A99' : '#e5e7eb'}`,
                background: tag === t ? '#004A99' : '#fff',
                color: tag === t ? '#fff' : '#444',
              }}>{t}</button>
            ))}
          </div>
        </section>

        {/* Grid */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Carregando artigos...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                {tag === 'Todos' ? 'Nenhum artigo publicado ainda' : `Nenhum artigo em "${tag}"`}
              </div>
              <div style={{ fontSize: 14, marginBottom: 20 }}>Em breve novos conteúdos!</div>
              {tag !== 'Todos' && (
                <button onClick={() => setTag('Todos')} style={{ padding: '10px 24px', borderRadius: 30, background: '#004A99', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Ver todos os artigos
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 28 }}>
              {filtered.map(post => (
                <a key={post.id} href={`/dicas/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.13)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
                >
                  <div style={{ position: 'relative', height: 200, background: COVER_GRADIENT[post.coverColor] ?? COVER_GRADIENT.orange, overflow: 'hidden' }}>
                    {post.imageUrl && (
                      <Image src={post.imageUrl} alt={post.title} fill style={{ objectFit: 'cover' }} unoptimized />
                    )}
                    {!post.imageUrl && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 14px)' }} />}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)' }} />
                    <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, letterSpacing: 0.5 }}>
                      {post.tag}
                    </div>
                  </div>
                  <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F1B2D', marginBottom: 10, lineHeight: 1.35 }}>{post.title}</h2>
                    <p style={{ fontSize: 14, color: '#666', lineHeight: 1.65, flex: 1, marginBottom: 16 }}>{post.excerpt}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
                      <span>Equipe Marreiro · {post.readTime} de leitura</span>
                      <span style={{ color: '#004A99', fontWeight: 700, fontSize: 13 }}>Ler →</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
