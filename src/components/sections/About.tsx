import Icon from '@/components/ui/Icon'

export default function About() {
  return (
    <section className="section about-section about" id="sobre">
      <div className="container about-grid">
        <div className="about-visual">
          <div className="about-visual-label">[ foto da equipe Marreiro Pet ]</div>
        </div>
        <div>
          <div className="section-eyebrow">Sobre o Marreiro Pet</div>
          <h2>Uma família cuidando<br />da sua família.</h2>
          <p className="about-lead">
            Há mais de 15 anos, o Marreiro Pet nasceu do amor por animais e do desejo de oferecer atendimento veterinário acessível, humano e de qualidade no Ceará. Hoje, somos referência em Caucaia, Pecém, São Gonçalo do Amarante e Taíba.
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
