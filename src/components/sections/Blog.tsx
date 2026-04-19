import Icon from '@/components/ui/Icon'

const BLOG_POSTS = [
  { tag: 'Nutrição', title: 'Como escolher a ração ideal para o seu cão', excerpt: 'Conheça os critérios que veterinários usam para indicar a alimentação certa em cada fase da vida.', time: '4 min', cover: 'orange' },
  { tag: 'Saúde', title: 'Vacinação de gatos: tudo que você precisa saber', excerpt: 'Da V4 à antirrábica, entenda quando vacinar e como manter o protocolo em dia.', time: '6 min', cover: 'blue' },
  { tag: 'Comportamento', title: 'Seu pet tem medo de banho? Veja o que fazer', excerpt: 'Dicas práticas para transformar a hora do banho em um momento tranquilo e positivo.', time: '3 min', cover: 'orangeDark' },
]

export default function Blog() {
  return (
    <section className="section" id="blog" style={{ background: 'var(--bg)' }}>
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">Dicas Marreiro</div>
          <h2 className="section-title">Conteúdo útil <span className="it">para tutores como você</span></h2>
          <p className="section-sub">Artigos escritos pela nossa equipe veterinária, sem mistério e direto ao ponto.</p>
        </div>
        <div className="blog-grid">
          {BLOG_POSTS.map((p, i) => (
            <article className="blog-card" key={i}>
              <div className="blog-cover" style={{
                background: p.cover === 'blue' ? 'linear-gradient(135deg, #004A99, #0066CC)' :
                            p.cover === 'orangeDark' ? 'linear-gradient(135deg, #D35F0D, #EF7720)' :
                            'linear-gradient(135deg, #EF7720, #F89C5F)'
              }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 14px)' }} />
                <span className="blog-cover-label">[ imagem do artigo ]</span>
              </div>
              <div className="blog-body">
                <span className="blog-tag">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
                <div className="blog-meta">
                  <span>Equipe Marreiro · {p.time} de leitura</span>
                  <Icon name="arrow-right" size={16} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
