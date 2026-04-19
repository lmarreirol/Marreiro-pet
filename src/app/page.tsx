import Nav from '@/components/sections/Nav'
import Hero from '@/components/sections/Hero'
import TrustBar from '@/components/sections/TrustBar'
import Services from '@/components/sections/Services'
import About from '@/components/sections/About'
import GroomingSection from '@/components/scheduling/GroomingSection'
import Scheduler from '@/components/scheduling/Scheduler'
import Units from '@/components/sections/Units'
import Blog from '@/components/sections/Blog'
import CTABand from '@/components/sections/CTABand'
import Contact from '@/components/sections/Contact'
import Footer from '@/components/sections/Footer'
import WAFloat from '@/components/sections/WAFloat'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TrustBar />
        <Services />
        <About />
        <GroomingSection />
        <section className="section schedule-section">
          <div className="container">
            <div className="section-head">
              <div className="section-eyebrow">Agendamento online</div>
              <h2 className="section-title">Marque atendimento <span className="it">em 1 minuto</span></h2>
              <p className="section-sub">Sem filas, sem ligações. Escolha o serviço, o horário e nossa equipe confirma por WhatsApp.</p>
            </div>
            <div className="schedule-wrap">
              <div className="schedule-side">
                <div style={{ position: 'relative' }}>
                  <h3>Rápido, fácil e sem burocracia.</h3>
                  <p>Todo o cuidado para seu pet a alguns cliques de distância.</p>
                </div>
                <ul className="schedule-bullets">
                  <li>4 unidades para escolher</li>
                  <li>Confirmação em até 2 horas</li>
                  <li>Lembretes automáticos por WhatsApp</li>
                  <li>Histórico de atendimentos</li>
                </ul>
              </div>
              <Scheduler />
            </div>
          </div>
        </section>
        <Units />
        <Blog />
        <CTABand />
        <Contact />
      </main>
      <Footer />
      <WAFloat />
    </>
  )
}
