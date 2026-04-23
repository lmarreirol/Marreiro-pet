'use client'
import { useState } from 'react'
import Icon from '@/components/ui/Icon'

const FAQS = [
  { q: 'Vocês atendem emergências 24h?', a: 'Sim! A unidade de Caucaia conta com plantão veterinário 24 horas, todos os dias. Para as demais unidades, atendemos até às 18h e direcionamos emergências para a matriz.' },
  { q: 'Quais formas de pagamento aceitam?', a: 'Aceitamos dinheiro, PIX, cartões de crédito e débito (todas as bandeiras), e parcelamos em até 6x sem juros em consultas e procedimentos.' },
  { q: 'É necessário agendar com antecedência?', a: 'Recomendamos agendar com pelo menos 24h de antecedência, especialmente para banho e tosa. Consultas de urgência são encaixadas no mesmo dia conforme disponibilidade.' },
  { q: 'Como funciona a entrega de ração?', a: 'Fazemos entrega em Caucaia, Pecém, São Gonçalo e Taíba. Pedidos acima de R$ 50 têm frete grátis. Entregamos no mesmo dia para pedidos até 14h.' },
]

export default function Contact() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section" id="contato" style={{ background: '#fff' }}>
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">Contato</div>
          <h2 className="section-title">Fale com a gente</h2>
        </div>
        <div className="contact-grid">
          <div>
            <div className="contact-item">
              <div className="contact-item-icon"><Icon name="wa" size={22} /></div>
              <div><strong>SAC Marreiro</strong><span>(85) 92183-6547 — seg a sáb, 8h às 18h</span></div>
            </div>
            <div className="contact-item">
              <div className="contact-item-icon"><Icon name="phone" size={22} /></div>
              <div><strong>Plantão 24h</strong><span>(85) 99157-5287 — Marreiro Clínica Vet 24h</span></div>
            </div>
            <div className="contact-item">
              <div className="contact-item-icon"><Icon name="mail" size={22} /></div>
              <div><strong>E-mail</strong><span>petshopmarreiro@gmail.com</span></div>
            </div>
            <div className="contact-item">
              <div className="contact-item-icon"><Icon name="clock" size={22} /></div>
              <div><strong>Horário de atendimento</strong><span>Seg a Sáb: 8h às 18h · Clínica Vet: 24 horas</span></div>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 18 }}>Perguntas frequentes</h3>
            {FAQS.map((f, i) => (
              <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
                <div className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                  {f.q}
                  <span className="plus"><Icon name="plus" size={14} /></span>
                </div>
                <div className="faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
