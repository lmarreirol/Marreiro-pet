import Icon from '@/components/ui/Icon'

const services = [
  { icon: 'stethoscope' as const, title: 'Clínica Veterinária', desc: 'Consultas, diagnósticos e acompanhamento com veterinários especialistas.', items: ['Consulta geral', 'Cardiologia & dermatologia', 'Emergência 24h'] },
  { icon: 'bath' as const, title: 'Banho & Tosa', desc: 'Higiene, estética e cuidado com profissionais treinados em bem-estar animal.', items: ['Banho terapêutico', 'Tosa higiênica e estética', 'Hidratação de pelos'], highlight: true },
  { icon: 'syringe' as const, title: 'Vacinação & Exames', desc: 'Vacinas importadas e exames laboratoriais com resultado rápido.', items: ['V8, V10, antirrábica', 'Hemograma & bioquímico', 'Microchipagem'] },
  { icon: 'truck' as const, title: 'Delivery de Ração', desc: 'Receba a ração do seu pet em casa, sem sair do sofá.', items: ['Entrega em até 2h', 'Ração premium', 'Assinatura mensal'] },
  { icon: 'pill' as const, title: 'Farmácia Veterinária', desc: 'Medicamentos manipulados e prescritos com orientação profissional.', items: ['Manipulação especial', 'Antipulgas e vermífugos', 'Fitoterápicos'] },
  { icon: 'bone' as const, title: 'Pet Shop', desc: 'Rações, acessórios e brinquedos selecionados para cães e gatos.', items: ['Rações premium', 'Brinquedos & camas', 'Coleiras e guias'] },
]

export default function Services() {
  return (
    <section className="section" id="servicos">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">Nossos serviços</div>
          <h2 className="section-title">Tudo que seu pet precisa, <span className="it">em um só lugar</span></h2>
          <p className="section-sub">Da consulta veterinária à ração em casa — cuidamos de cada fase da vida do seu melhor amigo.</p>
        </div>
        <div className="services-grid">
          {services.map((s, i) => (
            <div key={i} className={`service-card ${s.highlight ? 'highlight' : ''}`}>
              <div className="service-icon"><Icon name={s.icon} size={26} /></div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <ul className="service-list">
                {s.items.map((it, j) => <li key={j}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
