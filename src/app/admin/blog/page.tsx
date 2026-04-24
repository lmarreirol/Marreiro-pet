'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type BlogPost = {
  id: string; slug: string; title: string; tag: string; excerpt: string
  content: string; coverColor: string; imageUrl: string | null
  readTime: string; published: boolean; createdAt: string
}

const COVER_OPTIONS = [
  { id: 'orange',     label: 'Laranja',       gradient: 'linear-gradient(135deg, #EF7720, #F89C5F)' },
  { id: 'orangeDark', label: 'Laranja Escuro', gradient: 'linear-gradient(135deg, #D35F0D, #EF7720)' },
  { id: 'blue',       label: 'Azul',          gradient: 'linear-gradient(135deg, #004A99, #0066CC)' },
  { id: 'green',      label: 'Verde',         gradient: 'linear-gradient(135deg, #16a34a, #22c55e)' },
  { id: 'purple',     label: 'Roxo',          gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)' },
]

const emptyPost = { title: '', slug: '', tag: 'Saúde', excerpt: '', content: '', coverColor: 'blue', imageUrl: '', readTime: '5 min', published: false }

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', outline: 'none' }

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function BlogPage() {
  const { status } = useSession()
  const router = useRouter()
  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])

  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ...emptyPost })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/blog?all=1').then(r => r.json()).then(d => { setPosts(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => { if (status === 'authenticated') load() }, [status])

  const openNew = () => { setForm({ ...emptyPost }); setEditingId(null); setSaveError(null); setShowForm(true) }
  const openEdit = (post: BlogPost) => {
    setForm({ title: post.title, slug: post.slug, tag: post.tag, excerpt: post.excerpt, content: post.content, coverColor: post.coverColor, imageUrl: post.imageUrl ?? '', readTime: post.readTime, published: post.published })
    setEditingId(post.id); setSaveError(null); setShowForm(true)
  }
  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm({ ...emptyPost }) }
  const upd = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true); setSaveError(null)
    try {
      const res = editingId
        ? await fetch(`/api/blog/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'marreiro@admin2024' }, body: JSON.stringify(form) })
        : await fetch('/api/blog', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'marreiro@admin2024' }, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? `Erro ${res.status}`) }
      cancelForm(); load()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Remover este artigo permanentemente?')) return
    await fetch(`/api/blog/${id}`, { method: 'DELETE', headers: { 'x-admin-key': 'marreiro@admin2024' } })
    load()
  }

  const togglePublish = async (post: BlogPost) => {
    await fetch(`/api/blog/${post.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'marreiro@admin2024' }, body: JSON.stringify({ published: !post.published }) })
    load()
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Blog</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 2 }}>
            {posts.length} artigo{posts.length !== 1 ? 's' : ''} ·{' '}
            <a href="/dicas" target="_blank" style={{ color: '#f97316', fontWeight: 700, textDecoration: 'none' }}>ver página pública →</a>
          </p>
        </div>
        {!showForm && (
          <button onClick={openNew} style={{ padding: '10px 20px', borderRadius: 10, background: '#f97316', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', border: 'none' }}>
            + Novo artigo
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>{editingId ? 'Editar artigo' : 'Novo artigo'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Título *</label>
              <input style={inputStyle} value={form.title} onChange={e => { upd('title', e.target.value); if (!editingId) upd('slug', slugify(e.target.value)) }} placeholder="Ex: Como escolher a ração ideal" />
            </div>
            <div>
              <label style={labelStyle}>Slug (URL) *</label>
              <input style={inputStyle} value={form.slug} onChange={e => upd('slug', e.target.value)} placeholder="como-escolher-a-racao" />
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select style={inputStyle} value={form.tag} onChange={e => upd('tag', e.target.value)}>
                {['Nutrição', 'Saúde', 'Comportamento', 'Grooming', 'Bem-estar'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tempo de leitura</label>
              <input style={inputStyle} value={form.readTime} onChange={e => upd('readTime', e.target.value)} placeholder="5 min" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>URL da foto de capa (opcional)</label>
              <input style={inputStyle} value={form.imageUrl} onChange={e => upd('imageUrl', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label style={labelStyle}>Cor de capa (quando sem foto)</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {COVER_OPTIONS.map(c => (
                  <div key={c.id} onClick={() => upd('coverColor', c.id)} title={c.label}
                    style={{ width: 32, height: 32, borderRadius: 8, background: c.gradient, cursor: 'pointer', border: form.coverColor === c.id ? '3px solid #111827' : '3px solid transparent', flexShrink: 0 }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ ...labelStyle, margin: 0 }}>Publicado</label>
              <input type="checkbox" checked={form.published} onChange={e => upd('published', e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#f97316' }} />
              <span style={{ fontSize: 12, color: form.published ? '#16a34a' : '#888', fontWeight: 700 }}>{form.published ? 'Visível no site' : 'Rascunho'}</span>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Resumo (excerpt) *</label>
            <textarea style={{ ...inputStyle, height: 70, resize: 'vertical' }} value={form.excerpt} onChange={e => upd('excerpt', e.target.value)} placeholder="Breve descrição que aparece nos cards..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Conteúdo * (separe parágrafos com linha em branco)</label>
            <textarea style={{ ...inputStyle, height: 260, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} value={form.content} onChange={e => upd('content', e.target.value)} placeholder={'Parágrafo 1...\n\nParágrafo 2...'} />
          </div>
          {saveError && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>Erro: {saveError}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={!form.title || !form.slug || saving} style={{ padding: '12px 24px', borderRadius: 10, background: '#f97316', color: '#fff', fontWeight: 800, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', border: 'none' }}>
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Publicar artigo'}
            </button>
            <button onClick={cancelForm} style={{ padding: '12px 20px', borderRadius: 10, background: '#f3f4f6', color: '#555', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none' }}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Carregando...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888', background: '#fff', borderRadius: 16 }}>Nenhum artigo ainda. Clique em "+ Novo artigo" para começar.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map(post => (
            <div key={post.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: COVER_OPTIONS.find(c => c.id === post.coverColor)?.gradient ?? COVER_OPTIONS[0].gradient, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: '#f3f4f6', color: '#555' }}>{post.tag}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: post.published ? '#dcfce7' : '#fef9c3', color: post.published ? '#16a34a' : '#854d0e' }}>
                    {post.published ? '● Publicado' : '○ Rascunho'}
                  </span>
                  <span style={{ fontSize: 11, color: '#999' }}>{post.readTime} de leitura</span>
                </div>
                <div style={{ fontWeight: 900, fontSize: 15, color: '#111827', marginBottom: 3 }}>{post.title}</div>
                <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.excerpt}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button onClick={() => togglePublish(post)} style={{ padding: '6px 12px', borderRadius: 8, background: post.published ? '#fef9c3' : '#dcfce7', color: post.published ? '#854d0e' : '#16a34a', fontWeight: 700, fontSize: 12, cursor: 'pointer', border: 'none' }}>
                  {post.published ? 'Despublicar' : 'Publicar'}
                </button>
                <a href={`/dicas/${post.slug}`} target="_blank" style={{ padding: '6px 12px', borderRadius: 8, background: '#f3f4f6', color: '#f97316', fontWeight: 700, fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}>Ver →</a>
                <button onClick={() => openEdit(post)} style={{ padding: '6px 12px', borderRadius: 8, background: '#f97316', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', border: 'none' }}>✏️ Editar</button>
                <button onClick={() => remove(post.id)} style={{ padding: '6px 12px', borderRadius: 8, background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', border: '1.5px solid #dc2626' }}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
