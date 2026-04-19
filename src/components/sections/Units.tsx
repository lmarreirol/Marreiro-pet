import Icon from '@/components/ui/Icon'

const UNIT_DATA = [
  { name: 'Marreiro Pet Caucaia', badge: 'Matriz', address: 'Av. Dom Almeida Lustosa, 2537\nParque Guadalajara (Jurema), Caucaia - CE, 61650-000', phone: '(85) 9 9999-0001' },
  { name: 'Marreiro Pet Pecém', badge: null, address: 'Av. Antônio Brasileiro, 572\nPecém, São Gonçalo do Amarante - CE, 62674-000', phone: '(85) 9 9999-0002' },
  { name: 'Marreiro Pet São Gonçalo', badge: null, address: 'R. Santos Dumont, 415\nCentro, São Gonçalo do Amarante - CE, 62670-000', phone: '(85) 9 9999-0003' },
  { name: 'Marreiro Pet Taíba', badge: 'Novo', address: 'R. Cap. Inácio Prata, s/n\nTaíba, São Gonçalo do Amarante - CE, 62670-000', phone: '(85) 9 9999-0004' },
]

export default function Units() {
  return (
    <section className="section units-section" id="unidades">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">Onde estamos</div>
          <h2 className="section-title">4 unidades prontas <span className="it">para receber você</span></h2>
          <p className="section-sub">Escolha a mais próxima e agende seu atendimento com a equipe Marreiro Pet.</p>
        </div>
        <div className="units-grid">
          {UNIT_DATA.map((u, i) => (
            <div className="unit-card" key={i}>
              <div className="unit-head">
                <div className="unit-pin"><Icon name="pin" size={22} /></div>
                <div>
                  <div className="unit-name">{u.name}</div>
                  {u.badge && <span className="unit-badge">{u.badge}</span>}
                </div>
              </div>
              <div className="unit-address">
                {u.address.split('\n').map((l, j) => <div key={j}>{l}</div>)}
              </div>
              <div className="unit-foot">
                <a href={`tel:${u.phone.replace(/\D/g, '')}`}><Icon name="phone" size={14} /> {u.phone}</a>
                <a href="#"><Icon name="pin" size={14} /> Ver no mapa</a>
                <a href="#agendar"><Icon name="calendar" size={14} /> Agendar</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
