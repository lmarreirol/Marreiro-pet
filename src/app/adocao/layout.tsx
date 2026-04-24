import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Adoção Responsável — Marreiro Pet',
  description: 'Adote um pet resgatado pela Marreiro Pet. Todos os animais são vacinados, castrados e avaliados por veterinários antes da adoção.',
  openGraph: {
    title: 'Adoção Responsável — Marreiro Pet',
    description: 'Adote um pet resgatado. Todos vacinados, castrados e avaliados por veterinários.',
    url: 'https://marreiropet.com.br/adocao',
    siteName: 'Marreiro Pet',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function AdocaoLayout({ children }: { children: React.ReactNode }) {
  return children
}
