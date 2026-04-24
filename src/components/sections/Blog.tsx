'use client'
import { useEffect, useState } from 'react'

type Post = {
  id: string
  slug: string
  title: string
  tag: string
  excerpt: string
  coverColor: string
  readTime: string
  imageUrl?: string | null
}

const COVER_GRADIENT: Record<string, string> = {
  orange: 'linear-gradient(135deg, #EF7720, #F89C5F)',
  orangeDark: 'linear-gradient(135deg, #D35F0D, #EF7720)',
  blue: 'linear-gradient(135deg, #004A99, #0066CC)',
  green: 'linear-gradient(135deg, #16a34a, #22c55e)',
  purple: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/blog')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => {
        if (Array.isArray(d) && d.length > 0) { setPosts(d.slice(0, 3)) } else { setError(true) }
      })
      .catch(() => setError(true))
  }, [])

  return (
    <section className="section" id="blog" style={{ background: 'var(--bg)' }}>
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">Dicas Marreiro</div>
          <h2 className="section-title">Conteúdo útil <span className="it">para tutores como você</span></h2>
          <p className="section-sub">Artigos escritos pela nossa equipe veterinária, sem mistério e direto ao ponto.</p>
        </div>

        {error || posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#444', marginBottom: 8 }}>Em breve novos artigos</div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Nossa equipe está preparando conteúdo especial para você.</div>
            <a href="/dicas" style={{ display: 'inline-block', background: '#004A99', color: '#fff', fontWeight: 800, fontSize: 15, padding: '13px 32px', borderRadius: 12, textDecoration: 'none' }}>
              Ver todos os artigos →
            </a>
          </div>
        ) : (
          <>
            <div className="blog-grid">
              {posts.map((p) => (
                <a
                  href={`/dicas/${p.slug}`}
                  key={p.id}
                  className="blog-card"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
                >
                  <div className="blog-cover" style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: COVER_GRADIENT[p.coverColor] ?? COVER_GRADIENT.orange }}>
                    {!p.imageUrl && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 14px)' }} />}
                  </div>
                  <div className="blog-body">
                    <span className="blog-tag">{p.tag}</span>
                    <h3>{p.title}</h3>
                    <p>{p.excerpt}</p>
                    <div className="blog-meta">
                      <span>Equipe Marreiro · {p.readTime} de leitura</span>
                      <span style={{ color: '#004A99', fontWeight: 700 }}>Ler →</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 36 }}>
              <a href="/dicas" style={{ display: 'inline-block', background: '#004A99', color: '#fff', fontWeight: 800, fontSize: 15, padding: '13px 32px', borderRadius: 12, textDecoration: 'none' }}>
                Ver todos os artigos →
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
