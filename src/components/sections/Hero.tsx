import Image from 'next/image'
import Icon from '@/components/ui/Icon'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" />
      <svg className="paw-deco" style={{ top: 40, left: -40, width: 160, color: 'var(--blue)' }} viewBox="0 0 24 24" fill="currentColor"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><circle cx="7" cy="9" r="2"/><path d="M16.5 15.5c-1.5-1.5-3-3-4.5-3s-3 1.5-4.5 3-3 3-3 5 1.5 3 3.5 3 3-1 4-1 2 1 4 1 3.5-1 3.5-3-1.5-3.5-3-5z"/></svg>
      <svg className="paw-deco" style={{ bottom: 20, right: 40, width: 120, color: 'var(--orange)', transform: 'rotate(35deg)' }} viewBox="0 0 24 24" fill="currentColor"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><circle cx="7" cy="9" r="2"/><path d="M16.5 15.5c-1.5-1.5-3-3-4.5-3s-3 1.5-4.5 3-3 3-3 5 1.5 3 3.5 3 3-1 4-1 2 1 4 1 3.5-1 3.5-3-1.5-3.5-3-5z"/></svg>

      <div className="container hero-grid">
        <div>
          <div className="eyebrow"><span className="dot" /> 4 unidades no Ceará · atendimento humanizado</div>
          <h1>
            Cuidando de quem<br />
            <span className="accent-orange">te faz tão bem</span>
          </h1>
          <p className="hero-sub">
            Clínica veterinária, banho e tosa, vacinação e delivery de ração — tudo em um só lugar, com equipe especializada e apaixonada por cães e gatos.
          </p>
          <div className="hero-actions">
            <a href="#banho-tosa" className="btn btn-primary btn-lg">
              <Icon name="bath" size={18} /> Agendar Banho & Tosa
            </a>
            <a href="#agendar" className="btn btn-secondary btn-lg">
              <Icon name="calendar" size={18} /> Agendar consulta
            </a>
            <a href="#servicos" className="btn btn-ghost btn-lg">Ver serviços</a>
          </div>
          <div className="hero-meta">
            <div className="hero-meta-item">
              <div className="num">15+</div>
              <div className="lbl">anos de experiência</div>
            </div>
            <div className="hero-meta-item">
              <div className="num">4</div>
              <div className="lbl">unidades no Ceará</div>
            </div>
            <div className="hero-meta-item">
              <div className="num">12k+</div>
              <div className="lbl">pets atendidos</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-photo">
            <div className="hero-photo-inner">
              <Image src="/marreiro-logo.png" alt="" width={400} height={400} className="hero-logo-big" style={{ filter: 'brightness(1.5) contrast(0.9)' }} />
            </div>
          </div>
          <div className="hero-card" style={{ top: 30, left: -30 }}>
            <div className="hero-card-icon" style={{ background: 'var(--orange-soft)', color: 'var(--orange)' }}><Icon name="heart" size={22} /></div>
            <div>
              <div className="hero-card-title">Atendimento 24h</div>
              <div className="hero-card-sub">Emergências veterinárias</div>
            </div>
          </div>
          <div className="hero-card" style={{ bottom: 80, right: -30 }}>
            <div className="hero-card-icon" style={{ background: '#DFF7EA', color: '#0E9F6E' }}><Icon name="check" size={22} /></div>
            <div>
              <div className="hero-card-title">12.340 pets felizes</div>
              <div className="hero-card-sub">Avaliação 4.9 ★</div>
            </div>
          </div>
          <div className="hero-card" style={{ bottom: -20, left: 20 }}>
            <div className="hero-card-icon" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}><Icon name="truck" size={22} /></div>
            <div>
              <div className="hero-card-title">Delivery grátis</div>
              <div className="hero-card-sub">Em ração acima de R$ 150</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
