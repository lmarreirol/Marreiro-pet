import Icon from '@/components/ui/Icon'
import Image from 'next/image'

export default function About() {
  return (
    <section className="section about-section about" id="sobre">
      <div className="container about-grid">
        <div className="about-visual">
          <Image src="/equipe.jpg" alt="Equipe Marreiro Pet" width={600} height={500} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 20 }} />
        </div>
        <div>
          <div className="section-eyebrow">Sobre o Marreiro Pet</div>
          <h2>Nascemos do amor.<br />Crescemos com você.</h2>
          <p className="about-lead">
            Desde 2018, o Marreiro Pet cuida dos pets com carinho, estrutura completa e equipe especializada. Hoje somos referência em Caucaia, Pecém, São Gonçalo do Amarante e Taíba — porque seu pet merece o melhor.
          </p>
          <div className="about-features">
            <div className="about-feat">
              <div className="about-feat-icon"><Icon name="users" size={20} /></div>
              <div><strong>Equipe especializada</strong><span>Veterinários, auxiliares e tosadores certificados</span></div>
            </div>
            <div className="about-feat">
              <div className="about-feat-icon"><Icon name="heart" size={20} /></div>
              <div><strong>Atendimento humanizado</strong><span>Tratamos cada pet com o carinho que merecem</span></div>
            </div>
            <div className="about-feat">
              <div className="about-feat-icon"><Icon name="shield" size={20} /></div>
              <div><strong>Estrutura moderna</strong><span>Equipamentos de última geração e ambiente seguro</span></div>
            </div>
            <div className="about-feat">
              <div className="about-feat-icon"><Icon name="star" size={20} /></div>
              <div><strong>Avaliação 4.9 ★</strong><span>Milhares de tutores já confiaram no nosso trabalho</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
