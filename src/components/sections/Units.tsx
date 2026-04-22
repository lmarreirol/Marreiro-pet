import Icon from '@/components/ui/Icon'

const UNIT_DATA = [
  { name: 'Marreiro Caucaia', badge: 'Matriz', address: 'Av. Dom Almeida Lustosa, 2537\nJurema (Jurema), Caucaia - CE, 61650-000', phone: '(85) 99425-7643', wa: 'https://wa.me/5585994257643?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20a%20unidade%20Caucaia!', phoneClinica: '(85) 99157-5287', waClinica: 'https://wa.me/5585991575287?text=Ol%C3%A1%2C%20preciso%20de%20atendimento%20de%20emerg%C3%AAncia%20na%20cl%C3%ADnica%20Caucaia!', mapsUrl: 'https://www.google.com/maps/search/Marreiro+Pet+Av+Dom+Almeida+Lustosa+2537+Parque+Guadalajara+Caucaia+CE' },
  { name: 'Marreiro Pecém', badge: null, address: 'Av. Antônio Brasileiro, 572\nPecém, São Gonçalo do Amarante - CE, 62674-000', phone: '(85) 98117-3322', wa: 'https://wa.me/5585981173322?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20a%20unidade%20Pec%C3%A9m!', mapsUrl: 'https://www.google.com/maps/search/Marreiro+Pet+Av+Antonio+Brasileiro+572+Pecem+Sao+Goncalo+do+Amarante+CE' },
  { name: 'Marreiro São Gonçalo', badge: null, address: 'R. Santos Dumont, 415\nCentro, São Gonçalo do Amarante - CE, 62670-000', phone: '(85) 99197-6216', wa: 'https://wa.me/5585991976216?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20a%20unidade%20S%C3%A3o%20Gon%C3%A7alo!', mapsUrl: 'https://www.google.com/maps/search/Marreiro+Pet+Rua+Santos+Dumont+415+Centro+Sao+Goncalo+do+Amarante+CE' },
  { name: 'Marreiro Taíba', badge: 'Novo', address: 'R. Cap. Inácio Prata, s/n\nTaíba, São Gonçalo do Amarante - CE, 62670-000', phone: '(85) 99223-1172', wa: 'https://wa.me/5585992231172?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20a%20unidade%20Ta%C3%ADba!', mapsUrl: 'https://www.google.com/maps/search/Marreiro+Pet+Taiba+Sao+Goncalo+do+Amarante+CE' },
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
              {'phoneClinica' in u && u.phoneClinica ? (
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <a href={u.wa} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                      <Icon name="phone" size={14} /> <span>{u.phone}</span><span style={{ color: 'var(--muted)', fontSize: 12 }}>· Loja, Banho e Tosa e Delivery</span>
                    </a>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <a href={u.waClinica} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--orange)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      <Icon name="phone" size={14} /> <span>{u.phoneClinica}</span><span style={{ fontSize: 12 }}>· Clínica 24h</span>
                    </a>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <a href={u.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)' }}><Icon name="pin" size={14} /> Ver no mapa</a>
                    <a href="#agendar" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)' }}><Icon name="calendar" size={14} /> Agendar</a>
                  </div>
                </div>
              ) : (
                <div className="unit-foot">
                  <a href={u.wa} target="_blank" rel="noopener noreferrer"><Icon name="phone" size={14} /> {u.phone}</a>
                  <a href={u.mapsUrl} target="_blank" rel="noopener noreferrer"><Icon name="pin" size={14} /> Ver no mapa</a>
                  <a href="#agendar"><Icon name="calendar" size={14} /> Agendar</a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
