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

const FALLBACK_POSTS = [
  { tag: 'Nutrição', title: 'Como escolher a ração ideal para o seu cão', excerpt: 'Conheça os critérios que veterinários usam para indicar a alimentação certa em cada fase da vida.', coverColor: 'orange', readTime: '4 min', slug: '', id: 'f1' },
  { tag: 'Saúde', title: 'Vacinação de gatos: tudo que você precisa saber', excerpt: 'Da V4 à antirrábica, entenda quando vacinar e como manter o protocolo em dia.', coverColor: 'blue', readTime: '6 min', slug: '', id: 'f2' },
  { tag: 'Comportamento', title: 'Seu pet tem medo de banho? Veja o que fazer', excerpt: 'Dicas práticas para transformar a hora do banho em um momento tranquilo e positivo.', coverColor: 'orangeDark', readTime: '3 min', slug: '', id: 'f3' },
]

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setPosts(d.slice(0, 3)) })
      .catch(() => {})
  }, [])

  const displayPosts = posts.length > 0 ? posts : FALLBACK_POSTS

  return (
    <section className="section" id="blog" style={{ background: 'var(--bg)' }}>
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">Dicas Marreiro</div>
          <h2 className="section-title">Conteúdo útil <span className="it">para tutores como você</span></h2>
          <p className="section-sub">Artigos escritos pela nossa equipe veterinária, sem mistério e direto ao ponto.</p>
        </div>
        <div className="blog-grid">
          {displayPosts.map((p) => (
            <article className="blog-card" key={p.id} style={{ cursor: p.slug ? 'pointer' : 'default' }} onClick={() => p.slug && (window.location.href = `/dicas/${p.slug}`)}>
              <div className="blog-cover" style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: COVER_GRADIENT[p.coverColor] ?? COVER_GRADIENT.orange }}>
                {!p.imageUrl && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 14px)' }} />}
              </div>
              <div className="blog-body">
                <span className="blog-tag">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
                <div className="blog-meta">
                  <span>Equipe Marreiro · {p.readTime} de leitura</span>
                  {p.slug && <span style={{ color: '#004A99', fontWeight: 700 }}>Ler →</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <a href="/dicas" style={{ display: 'inline-block', background: '#004A99', color: '#fff', fontWeight: 800, fontSize: 15, padding: '13px 32px', borderRadius: 12, textDecoration: 'none' }}>
            Ver todos os artigos →
          </a>
        </div>
      </div>
    </section>
  )
}
