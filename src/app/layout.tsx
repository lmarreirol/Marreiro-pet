import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Marreiro Pet — Clínica Veterinária e Pet Shop',
  description: 'Clínica veterinária, banho e tosa, vacinação e delivery de ração em 4 unidades no Ceará.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
