'use client'
import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import UnitModal from '@/components/ui/UnitModal'

const services = [
  {
    icon: 'stethoscope' as const,
    title: 'Clínica Veterinária',
    desc: 'Consultas, diagnósticos e acompanhamento com veterinários especialistas.',
    items: ['Consulta geral', 'Cardiologia & dermatologia', 'Emergência 24h'],
    message: 'Olá, gostaria de agendar uma consulta veterinária!',
  },
  {
    icon: 'bath' as const,
    title: 'Banho & Tosa',
    desc: 'Higiene, estética e cuidado com profissionais treinados em bem-estar animal.',
    items: ['Banho terapêutico', 'Tosa higiênica e estética', 'Hidratação de pelos'],
    highlight: true,
    message: 'Olá, gostaria de agendar um banho e tosa!',
  },
  {
    icon: 'syringe' as const,
    title: 'Vacinação & Exames',
    desc: 'Vacinas importadas e exames laboratoriais com resultado rápido.',
    items: ['V8, V10, antirrábica', 'Hemograma & bioquímico', 'Microchipagem'],
    message: 'Olá, gostaria de agendar vacinação ou exames para meu pet!',
  },
  {
    icon: 'truck' as const,
    title: 'Delivery de Ração',
    desc: 'Receba a ração do seu pet em casa, sem sair do sofá.',
    items: ['Entrega em até 2h', 'Ração premium', 'Assinatura mensal'],
    message: 'Olá, gostaria de pedir delivery de ração!',
  },
  {
    icon: 'pill' as const,
    title: 'Farmácia Veterinária',
    desc: 'Medicamentos manipulados e prescritos com orientação profissional.',
    items: ['Manipulação especial', 'Antipulgas e vermífugos', 'Fitoterápicos'],
    message: 'Olá, preciso de informações sobre a farmácia veterinária!',
  },
  {
    icon: 'bone' as const,
    title: 'Pet Shop',
    desc: 'Rações, acessórios e brinquedos selecionados para cães e gatos.',
    items: ['Rações premium', 'Brinquedos & camas', 'Coleiras e guias'],
    message: 'Olá, gostaria de saber mais sobre o pet shop!',
  },
]

export default function Services() {
  const [activeService, setActiveService] = useState<{ message: string; isClinic: boolean } | null>(null)

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
            <div
              key={i}
              className={`service-card ${s.highlight ? 'highlight' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (s.title === 'Banho & Tosa') {
                  sessionStorage.setItem('preselect-package', 'banho-tosa')
                  document.getElementById('banho-tosa')?.scrollIntoView({ behavior: 'smooth' })
                } else if (s.title === 'Vacinação & Exames') {
                  sessionStorage.setItem('preselect-service', 'vacina')
                  document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' })
                } else {
                  setActiveService({ message: s.message, isClinic: s.title === 'Clínica Veterinária' || s.title === 'Farmácia Veterinária' })
                }
              }}
            >
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

      {activeService && (
        <UnitModal
          message={activeService.message}
          isClinic={activeService.isClinic}
          onClose={() => setActiveService(null)}
        />
      )}
    </section>
  )
}
