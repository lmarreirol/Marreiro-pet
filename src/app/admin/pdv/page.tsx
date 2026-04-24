'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const UNITS = [
  { id: 'caucaia', name: 'Caucaia' },
  { id: 'pecem', name: 'Pecém' },
  { id: 'saogoncalo', name: 'São Gonçalo' },
  { id: 'taiba', name: 'Taíba' },
]

const CATEGORIES = [
  { id: 'all', label: 'Tudo', icon: '🔍' },
  { id: 'alimento', label: 'Alimento', icon: '🍖' },
  { id: 'medicamento', label: 'Medicamento', icon: '💊' },
  { id: 'acessorio', label: 'Acessório', icon: '🎀' },
  { id: 'produto', label: 'Produto', icon: '📦' },
  { id: 'servico', label: 'Serviço', icon: '🛠️' },
]

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Dinheiro', icon: '💵' },
  { id: 'card_debit', label: 'Débito', icon: '💳' },
  { id: 'card_credit', label: 'Crédito', icon: '💳' },
  { id: 'pix', label: 'PIX', icon: '📲' },
]

type Product = {
  id: string; name: string; price: string; category: string
  stock: number; trackStock: boolean; description: string | null
}

type CartItem = {
  productId: string; name: string; price: number; quantity: number
}

function fmt(n: number) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`
}

export default function PdvPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const user = session?.user as Record<string, unknown> | undefined
  const [unitId, setUnitId] = useState('')

  const [products, setProducts] = useState<Product[]>([])
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [lastSale, setLastSale] = useState<{ id: string; total: number; change: number | null } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])
  useEffect(() => {
    if (user?.unitId) setUnitId(String(user.unitId))
    else setUnitId('caucaia')
  }, [user])

  const loadProducts = useCallback(() => {
    if (status !== 'authenticated') return
    const p = new URLSearchParams({ active: 'true' })
    if (q) p.set('q', q)
    if (catFilter !== 'all') p.set('category', catFilter)
    fetch(`/api/admin/products?${p}`)
      .then(r => r.json())
      .then(d => setProducts(d.products ?? []))
  }, [status, q, catFilter])

  useEffect(() => { loadProducts() }, [loadProducts])

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === p.id)
      if (existing) return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: p.id, name: p.name, price: Number(p.price), quantity: 1 }]
    })
    searchRef.current?.focus()
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.productId !== productId))
    else setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i))
  }

  const removeItem = (productId: string) => setCart(prev => prev.filter(i => i.productId !== productId))

  const clearCart = () => {
    setCart([])
    setDiscount(0)
    setAmountPaid('')
    setClientName('')
    setClientPhone('')
    setNotes('')
    setLastSale(null)
    searchRef.current?.focus()
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const total = Math.max(0, subtotal - discount)
  const change = paymentMethod === 'cash' && amountPaid ? Math.max(0, Number(amountPaid) - total) : null

  const finishSale = async () => {
    if (!cart.length || !unitId) return
    setFinishing(true)
    try {
      const res = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          sellerId: user?.id ?? null,
          sellerName: user?.name ?? null,
          clientName: clientName || null,
          clientPhone: clientPhone || null,
          items: cart.map(i => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity })),
          discount,
          paymentMethod,
          amountPaid: amountPaid ? Number(amountPaid) : null,
          notes: notes || null,
        }),
      })
      if (res.ok) {
        const sale = await res.json()
        setLastSale({ id: sale.id, total: Number(sale.total), change: sale.change ? Number(sale.change) : null })
        loadProducts() // refresh stock
        setCart([])
        setDiscount(0)
        setAmountPaid('')
        setClientName('')
        setClientPhone('')
        setNotes('')
      }
    } finally {
      setFinishing(false)
    }
  }

  const canFinish = cart.length > 0 && unitId

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f9fafb' }}>

      {/* === LEFT: Product grid === */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #e5e7eb' }}>
        {/* Toolbar */}
        <div style={{ background: 'white', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            ref={searchRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="🔍 Buscar produto ou usar leitor de código..."
            autoFocus
            style={{ flex: 1, minWidth: 200, border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: '0.875rem', color: '#111827', outline: 'none' }}
          />
          <select value={unitId} onChange={e => setUnitId(e.target.value)} style={selStyle}>
            {UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        {/* Category tabs */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 16px', display: 'flex', gap: 2, overflowX: 'auto' }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCatFilter(c.id)} style={{
              border: 'none', background: 'none', padding: '10px 14px',
              fontWeight: catFilter === c.id ? 700 : 400,
              color: catFilter === c.id ? '#f97316' : '#6b7280',
              borderBottom: catFilter === c.id ? '2px solid #f97316' : '2px solid transparent',
              cursor: 'pointer', fontSize: '0.82rem', whiteSpace: 'nowrap',
            }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Products */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <div style={{ fontSize: 40 }}>📦</div>
              <p style={{ marginTop: 8 }}>Nenhum produto encontrado.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
              {products.map(p => {
                const inCart = cart.find(i => i.productId === p.id)
                const outOfStock = p.trackStock && p.stock <= 0
                return (
                  <button
                    key={p.id}
                    onClick={() => !outOfStock && addToCart(p)}
                    disabled={outOfStock}
                    style={{
                      background: 'white', border: inCart ? '2px solid #f97316' : '1px solid #e5e7eb',
                      borderRadius: 12, padding: '14px 12px', cursor: outOfStock ? 'not-allowed' : 'pointer',
                      textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6,
                      opacity: outOfStock ? 0.4 : 1,
                      boxShadow: inCart ? '0 0 0 3px #f9731615' : '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'all 0.1s',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                      {CATEGORIES.find(c => c.id === p.category)?.icon ?? '📦'}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#111827', lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f97316' }}>{fmt(Number(p.price))}</div>
                    {p.trackStock && (
                      <div style={{ fontSize: '0.65rem', color: p.stock <= 3 ? '#ef4444' : '#9ca3af', fontWeight: p.stock <= 3 ? 700 : 400 }}>
                        {outOfStock ? '⚠ Sem estoque' : `${p.stock} em estoque`}
                      </div>
                    )}
                    {inCart && (
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f97316' }}>✓ {inCart.quantity} no carrinho</div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* === RIGHT: Cart === */}
      <div style={{ width: 360, background: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Sale complete message */}
        {lastSale && (
          <div style={{ background: '#dcfce7', padding: '1rem', borderBottom: '1px solid #bbf7d0', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem' }}>✅</div>
            <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.9rem' }}>Venda concluída!</div>
            <div style={{ fontSize: '0.82rem', color: '#15803d', marginTop: 2 }}>Total: {fmt(lastSale.total)}</div>
            {lastSale.change != null && lastSale.change > 0 && (
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#15803d', marginTop: 4 }}>Troco: {fmt(lastSale.change)}</div>
            )}
            <button onClick={clearCart} style={{ marginTop: 8, background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
              Nova venda
            </button>
          </div>
        )}

        {/* Cart header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
            🛒 Carrinho {cart.length > 0 && <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.85rem' }}>({cart.length} iten{cart.length > 1 ? 's' : ''})</span>}
          </h2>
          {cart.length > 0 && (
            <button onClick={clearCart} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Limpar</button>
          )}
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#d1d5db' }}>
              <div style={{ fontSize: 40 }}>🛒</div>
              <p style={{ marginTop: 8, fontSize: '0.875rem' }}>Selecione produtos para iniciar uma venda</p>
            </div>
          ) : cart.map(item => (
            <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #f9fafb' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#f97316', fontWeight: 700 }}>{fmt(item.price)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => updateQty(item.productId, item.quantity - 1)} style={qtyBtn}>−</button>
                <input
                  type="number" min="1" value={item.quantity}
                  onChange={e => updateQty(item.productId, parseInt(e.target.value) || 1)}
                  style={{ width: 36, textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 0', fontSize: '0.875rem', fontWeight: 700 }}
                />
                <button onClick={() => updateQty(item.productId, item.quantity + 1)} style={qtyBtn}>+</button>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#111827', width: 70, textAlign: 'right' }}>
                {fmt(item.price * item.quantity)}
              </div>
              <button onClick={() => removeItem(item.productId)} style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: 16, padding: 2, flexShrink: 0 }}>×</button>
            </div>
          ))}
        </div>

        {/* Bottom area */}
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Client */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Cliente (opcional)" style={{ ...inpSm, flex: 1 }} />
            <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Telefone" style={{ ...inpSm, width: 120 }} />
          </div>

          {/* Discount */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', color: '#6b7280', flexShrink: 0 }}>Desconto R$</span>
            <input type="number" min="0" step="0.01" value={discount || ''} onChange={e => setDiscount(Number(e.target.value) || 0)}
              style={{ ...inpSm, width: 80 }} placeholder="0,00" />
          </div>

          {/* Payment method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {PAYMENT_METHODS.map(m => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)} style={{
                border: paymentMethod === m.id ? '2px solid #f97316' : '1px solid #e5e7eb',
                borderRadius: 8, padding: '8px 6px', cursor: 'pointer',
                background: paymentMethod === m.id ? '#fff7ed' : 'white',
                color: paymentMethod === m.id ? '#f97316' : '#6b7280',
                fontWeight: paymentMethod === m.id ? 700 : 400,
                fontSize: '0.8rem',
              }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Cash: amount paid */}
          {paymentMethod === 'cash' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', color: '#6b7280', flexShrink: 0 }}>Valor pago R$</span>
              <input type="number" min="0" step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                style={{ ...inpSm, flex: 1 }} placeholder="0,00" />
              {change != null && change > 0 && (
                <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.9rem', flexShrink: 0 }}>Troco: {fmt(change)}</div>
              )}
            </div>
          )}

          {/* Notes */}
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações (opcional)" style={inpSm} />

          {/* Totals */}
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#6b7280' }}>
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#ef4444' }}>
                <span>Desconto</span><span>− {fmt(discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#111827', marginTop: 4, paddingTop: 6, borderTop: '1px solid #e5e7eb' }}>
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>

          {/* Finish button */}
          <button
            onClick={finishSale}
            disabled={!canFinish || finishing}
            style={{
              background: canFinish && !finishing ? '#f97316' : '#e5e7eb',
              color: canFinish && !finishing ? 'white' : '#9ca3af',
              border: 'none', borderRadius: 10, padding: '14px', cursor: canFinish && !finishing ? 'pointer' : 'not-allowed',
              fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em',
            }}
          >
            {finishing ? 'Processando...' : `✅ Finalizar venda — ${fmt(total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

const selStyle: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: '0.82rem', color: '#374151', background: 'white' }
const qtyBtn: React.CSSProperties = { width: 26, height: 26, borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }
const inpSm: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: '0.82rem', color: '#374151', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' }
