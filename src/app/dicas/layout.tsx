import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dicas para Tutores — Marreiro Pet',
  description: 'Artigos sobre nutrição, saúde, comportamento e bem-estar animal escritos pela equipe veterinária da Marreiro Pet.',
  openGraph: {
    title: 'Dicas para Tutores — Marreiro Pet',
    description: 'Artigos sobre nutrição, saúde, comportamento e bem-estar animal.',
    url: 'https://marreiropet.com.br/dicas',
    siteName: 'Marreiro Pet',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function DicasLayout({ children }: { children: React.ReactNode }) {
  return children
}
