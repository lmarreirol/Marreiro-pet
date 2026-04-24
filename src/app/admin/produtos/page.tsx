'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { id: 'produto', label: 'Produto geral', icon: '📦' },
  { id: 'alimento', label: 'Alimento', icon: '🍖' },
  { id: 'medicamento', label: 'Medicamento', icon: '💊' },
  { id: 'acessorio', label: 'Acessório', icon: '🎀' },
  { id: 'servico', label: 'Serviço avulso', icon: '🛠️' },
]

const UNITS = [
  { id: 'caucaia', name: 'Caucaia' },
  { id: 'pecem', name: 'Pecém' },
  { id: 'saogoncalo', name: 'São Gonçalo' },
  { id: 'taiba', name: 'Taíba' },
]

type Product = {
  id: string; name: string; description: string | null; price: string; costPrice: string | null
  category: string; barcode: string | null; stock: number; trackStock: boolean; active: boolean; unitId: string | null
}

type ProductForm = {
  name: string; description: string; price: string; costPrice: string
  category: string; barcode: string; stock: string; trackStock: boolean; unitId: string | null
}

const EMPTY: ProductForm = {
  name: '', description: '', price: '', costPrice: '', category: 'produto',
  barcode: '', stock: '0', trackStock: true, unitId: null,
}

function fmt(n: string | number) {
  return `R$ ${Number(n).toFixed(2).replace('.', ',')}`
}

const catIcon = (c: string) => CATEGORIES.find(x => x.id === c)?.icon ?? '📦'

export default function ProdutosPage() {
  const { status } = useSession()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(false)

  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])

  const load = useCallback(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    const p = new URLSearchParams({ active: showInactive ? 'false' : 'true' })
    if (q) p.set('q', q)
    if (catFilter !== 'all') p.set('category', catFilter)
    fetch(`/api/admin/products?${p}`)
      .then(r => r.json())
      .then(d => setProducts(d.products ?? []))
      .finally(() => setLoading(false))
  }, [status, q, catFilter, showInactive])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setForm({ ...EMPTY })
    setEditing(null)
    setError('')
    setModal('add')
  }
  const openEdit = (p: Product) => {
    setForm({
      name: p.name, description: p.description ?? '', price: String(Number(p.price).toFixed(2)),
      costPrice: p.costPrice ? String(Number(p.costPrice).toFixed(2)) : '',
      category: p.category, barcode: p.barcode ?? '', stock: String(p.stock),
      trackStock: p.trackStock, unitId: p.unitId,
    })
    setEditing(p)
    setError('')
    setModal('edit')
  }

  const save = async () => {
    if (!form.name?.trim()) { setError('Nome é obrigatório.'); return }
    if (!form.price || isNaN(Number(form.price))) { setError('Preço inválido.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name, description: form.description || null,
        price: Number(form.price), costPrice: form.costPrice ? Number(form.costPrice) : null,
        category: form.category, barcode: form.barcode || null,
        stock: Number(form.stock ?? 0), trackStock: form.trackStock,
        unitId: form.unitId || null,
      }
      const res = await fetch(
        editing ? `/api/admin/products/${editing.id}` : '/api/admin/products',
        { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      )
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erro ao salvar.'); return }
      setModal(null)
      load()
    } finally { setSaving(false) }
  }

  const toggleActive = async (p: Product) => {
    await fetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !p.active }),
    })
    load()
  }

  const adjustStock = async (p: Product, delta: number) => {
    await fetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: Math.max(0, p.stock + delta) }),
    })
    load()
  }

  // Group by category
  const byCategory: Record<string, Product[]> = {}
  for (const p of products) {
    if (!byCategory[p.category]) byCategory[p.category] = []
    byCategory[p.category].push(p)
  }

  const inp: React.CSSProperties = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: '0.875rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }
  const half: React.CSSProperties = { width: 'calc(50% - 6px)' }

  return (
    <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Produtos</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 2 }}>{products.length} itens cadastrados</p>
        </div>
        <button onClick={openAdd} style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
          + Novo produto
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar produto..." style={{ ...inp, width: 220, flex: 'none' }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...inp, width: 'auto', cursor: 'pointer' }}>
          <option value="all">Todas as categorias</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#6b7280', cursor: 'pointer' }}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
          Mostrar inativos
        </label>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '4rem' }}>Carregando...</p>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p>Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {CATEGORIES.filter(c => byCategory[c.id]?.length).map(cat => (
            <div key={cat.id}>
              <h2 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: 8, letterSpacing: '0.05em' }}>
                {cat.icon} {cat.label.toUpperCase()}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {byCategory[cat.id].map(p => (
                  <div key={p.id} style={{
                    background: 'white', borderRadius: 12, padding: '14px 16px',
                    border: '1px solid #f3f4f6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    opacity: p.active ? 1 : 0.5, display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        {p.description && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                      </div>
                      <div style={{ fontWeight: 800, color: '#111827', fontSize: '1rem', marginLeft: 8, flexShrink: 0 }}>{fmt(p.price)}</div>
                    </div>

                    {/* Stock */}
                    {p.trackStock && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>Estoque:</span>
                        <button onClick={() => adjustStock(p, -1)} style={stockBtn}>−</button>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: p.stock <= 3 ? '#ef4444' : '#111827', minWidth: 28, textAlign: 'center' }}>{p.stock}</span>
                        <button onClick={() => adjustStock(p, 1)} style={stockBtn}>+</button>
                        {p.stock <= 3 && <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700 }}>⚠ baixo</span>}
                      </div>
                    )}

                    {p.barcode && <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>📊 {p.barcode}</div>}

                    <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                      <button onClick={() => openEdit(p)} style={actionBtn('#6366f1')}>Editar</button>
                      <button onClick={() => toggleActive(p)} style={actionBtn(p.active ? '#f59e0b' : '#10b981')}>
                        {p.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Products in unknown categories */}
          {products.filter(p => !CATEGORIES.find(c => c.id === p.category)).length > 0 && (
            <div>
              <h2 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: 8 }}>OUTROS</h2>
              {products.filter(p => !CATEGORIES.find(c => c.id === p.category)).map(p => (
                <div key={p.id} style={{ fontWeight: 600, color: '#374151', padding: 12, background: 'white', borderRadius: 10, marginBottom: 6 }}>{p.name}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem' }}>
              {modal === 'add' ? '+ Novo produto' : 'Editar produto'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Nome *">
                <input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} placeholder="Ex: Ração Premium 15kg" />
              </Field>

              <Field label="Categoria">
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </Field>

              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Preço de venda (R$) *" style={half}>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={inp} placeholder="0,00" />
                </Field>
                <Field label="Custo (R$)" style={half}>
                  <input type="number" step="0.01" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} style={inp} placeholder="0,00" />
                </Field>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Estoque inicial" style={half}>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} style={inp} />
                </Field>
                <Field label="Código de barras" style={half}>
                  <input value={form.barcode ?? ''} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} style={inp} placeholder="EAN-13" />
                </Field>
              </div>

              <Field label="Descrição">
                <textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp, resize: 'vertical', minHeight: 60 }} placeholder="Detalhes do produto..." />
              </Field>

              <Field label="Unidade (opcional)">
                <select value={form.unitId ?? ''} onChange={e => setForm(f => ({ ...f, unitId: e.target.value || null }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">Todas as unidades</option>
                  {UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.trackStock ?? true} onChange={e => setForm(f => ({ ...f, trackStock: e.target.checked }))} />
                Controlar estoque
              </label>

              {error && <p style={{ color: '#ef4444', fontSize: '0.82rem' }}>{error}</p>}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setModal(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                Cancelar
              </button>
              <button onClick={save} disabled={saving} style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.875rem', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

const stockBtn: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 6, border: '1px solid #e5e7eb',
  background: '#f9fafb', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

function actionBtn(color: string): React.CSSProperties {
  return {
    background: `${color}12`, color, border: `1px solid ${color}25`,
    borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem',
  }
}
