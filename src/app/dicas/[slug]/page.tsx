'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Nav from '@/components/sections/Nav'
import Footer from '@/components/sections/Footer'

type Post = {
  id: string
  slug: string
  title: string
  tag: string
  excerpt: string
  content: string
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function ArtigoPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/blog?slug=${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setPost(d); setLoading(false) })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [slug])

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 80 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 100, color: '#888' }}>Carregando...</div>
        ) : notFound || !post ? (
          <div style={{ textAlign: 'center', padding: 100 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😿</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Artigo não encontrado</div>
            <a href="/dicas" style={{ color: '#004A99', fontWeight: 700 }}>← Voltar para Dicas</a>
          </div>
        ) : (
          <>
            {/* Cover */}
            <div style={{ position: 'relative', height: 360, background: COVER_GRADIENT[post.coverColor] ?? COVER_GRADIENT.orange, overflow: 'hidden' }}>
              {post.imageUrl && (
                <>
                  {/* fundo desfocado */}
                  <img src={post.imageUrl} alt="" aria-hidden style={{ position: 'absolute', inset: -10, width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', objectFit: 'cover', objectPosition: 'center 20%', filter: 'blur(10px) brightness(1.3) saturate(0.4) hue-rotate(190deg)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(140,200,230,0.55)' }} />
                  {/* imagem nítida por cima */}
                  <img src={post.imageUrl} alt={post.title} style={{ position: 'absolute', inset: 0, height: '100%', width: '100%', objectFit: 'cover', objectPosition: '42% 15%' }} />
                </>
              )}
              {!post.imageUrl && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 14px)' }} />}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,50,100,0.65) 0%, rgba(0,80,140,0.1) 50%, transparent 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px 40px' }}>
                <div style={{ maxWidth: 760, width: '100%' }}>
                  <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 20, marginBottom: 12, letterSpacing: 0.5 }}>
                    {post.tag}
                  </span>
                  <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.25, textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>{post.title}</h1>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div style={{ background: '#f0f4f8', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ maxWidth: 760, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#666' }}>
                <a href="/dicas" style={{ color: '#004A99', fontWeight: 700, textDecoration: 'none' }}>← Dicas</a>
                <span>·</span>
                <span>Equipe Marreiro</span>
                <span>·</span>
                <span>{post.readTime} de leitura</span>
                <span>·</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>

            {/* Conteúdo */}
            <article style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
              <p style={{ fontSize: 18, color: '#444', lineHeight: 1.75, fontWeight: 500, marginBottom: 32, borderLeft: '4px solid #EF7720', paddingLeft: 20 }}>{post.excerpt}</p>
              <div style={{ fontSize: 16, color: '#333', lineHeight: 1.85 }} dangerouslySetInnerHTML={{ __html: post.content }} />

              {/* CTA */}
              {post.tag === 'Nutrição' ? (
                <div style={{ marginTop: 56, padding: '32px', background: 'linear-gradient(135deg, #EF7720 0%, #D35F0D 100%)', borderRadius: 20, textAlign: 'center', color: '#fff' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Delivery de ração direto na sua porta</div>
                  <p style={{ fontSize: 15, opacity: 0.92, marginBottom: 20 }}>Rações premium com entrega em até 2h. Sem sair do sofá!</p>
                  <a href="/#servicos" style={{ display: 'inline-block', background: '#fff', color: '#EF7720', fontWeight: 800, fontSize: 15, padding: '12px 28px', borderRadius: 12, textDecoration: 'none' }}>
                    Ver delivery de ração →
                  </a>
                </div>
              ) : (
                <div style={{ marginTop: 56, padding: '32px', background: 'linear-gradient(135deg, #004A99 0%, #0066cc 100%)', borderRadius: 20, textAlign: 'center', color: '#fff' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Cuide bem do seu pet com a Marreiro</div>
                  <p style={{ fontSize: 15, opacity: 0.88, marginBottom: 20 }}>Consultas, vacinas, banho & tosa — tudo em um só lugar.</p>
                  <a href="/#agendar" style={{ display: 'inline-block', background: '#EF7720', color: '#fff', fontWeight: 800, fontSize: 15, padding: '12px 28px', borderRadius: 12, textDecoration: 'none' }}>
                    Agendar agora
                  </a>
                </div>
              )}
            </article>
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
