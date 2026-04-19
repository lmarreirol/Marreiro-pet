import Icon from '@/components/ui/Icon'

export default function CTABand() {
  return (
    <section className="cta-band">
      <div className="container cta-inner">
        <h2>Seu pet merece o melhor.<br />Vamos cuidar juntos?</h2>
        <p>Agende agora mesmo uma consulta, banho ou vacinação em qualquer uma das nossas 4 unidades.</p>
        <div className="cta-actions">
          <a href="#agendar" className="btn btn-primary btn-lg">
            <Icon name="calendar" size={18} /> Agendar atendimento
          </a>
          <a href="#" className="btn btn-white btn-lg">
            <Icon name="wa" size={18} /> Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
