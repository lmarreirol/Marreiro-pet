'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <a href="#" className="nav-logo">
          <Image src="/marreiro-logo.png" alt="Marreiro Pet" width={44} height={44} style={{ height: 44, width: 'auto' }} />
          <span className="nav-logo-text">MARREIRO<span className="pet"> PET</span></span>
        </a>
        <nav className="nav-links">
          <a href="#servicos">Serviços</a>
          <a href="#sobre">Sobre</a>
          <a href="#unidades">Unidades</a>
          <a href="#blog">Dicas</a>
          <a href="#contato">Contato</a>
        </nav>
        <div className="nav-cta">
          <a href="tel:+5585888888888" className="nav-phone">
            <Icon name="phone" size={14} /> 24h (85) 8 8888-8888
          </a>
          <a href="#agendar" className="btn btn-primary" style={{ padding: '10px 18px', fontSize: 14 }}>Agendar</a>
        </div>
      </div>
    </header>
  )
}
