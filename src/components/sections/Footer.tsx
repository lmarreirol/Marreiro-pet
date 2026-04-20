import Image from 'next/image'
import Icon from '@/components/ui/Icon'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <Image src="/marreiro-logo.png" alt="Marreiro Pet" width={48} height={48} style={{ filter: 'brightness(1.1)' }} />
              <span className="footer-logo-text">MARREIRO<span className="pet"> PET</span></span>
            </div>
            <p>Clínica veterinária e pet shop com atendimento humanizado. Cuidando de cães e gatos no Ceará há mais de 15 anos.</p>
            <div className="footer-social">
              <a href="#" aria-label="Instagram"><Icon name="ig" size={18} /></a>
              <a href="#" aria-label="Facebook"><Icon name="fb" size={18} /></a>
              <a href="#" aria-label="WhatsApp"><Icon name="wa" size={18} /></a>
            </div>
          </div>
          <div>
            <h4>Serviços</h4>
            <ul>
              <li><a href="#servicos">Clínica veterinária</a></li>
              <li><a href="#servicos">Banho & tosa</a></li>
              <li><a href="#servicos">Vacinação</a></li>
              <li><a href="#servicos">Delivery de ração</a></li>
              <li><a href="#servicos">Farmácia veterinária</a></li>
            </ul>
          </div>
          <div>
            <h4>Institucional</h4>
            <ul>
              <li><a href="#sobre">Sobre nós</a></li>
              <li><a href="#unidades">Unidades</a></li>
              <li><a href="#blog">Dicas</a></li>
              <li><a href="#contato">Contato</a></li>
              <li><a href="#agendar">Agendar</a></li>
            </ul>
          </div>
          <div>
            <h4>Contato</h4>
            <ul>
              <li><a href="tel:+5585888888888">(85) 8 8888-8888</a></li>
              <li><a href="mailto:contato@marreiropet.com.br">contato@marreiropet.com.br</a></li>
              <li>Caucaia · Pecém · S. Gonçalo · Taíba</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Marreiro Pet · Todos os direitos reservados</span>
          <span>CNPJ 00.000.000/0001-00</span>
        </div>
      </div>
    </footer>
  )
}
