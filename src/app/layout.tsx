import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Marreiro Pet — Clínica Veterinária e Pet Shop no Ceará',
  description: 'Clínica veterinária, banho e tosa, vacinação e delivery de ração em 4 unidades no Ceará: Caucaia, Pecém, São Gonçalo e Taíba.',
  keywords: ['clínica veterinária', 'pet shop', 'banho e tosa', 'vacinação', 'Caucaia', 'Ceará'],
  openGraph: {
    title: 'Marreiro Pet — Clínica Veterinária e Pet Shop no Ceará',
    description: 'Clínica veterinária, banho e tosa, vacinação e delivery de ração em 4 unidades no Ceará.',
    url: 'https://marreiropet.com.br',
    siteName: 'Marreiro Pet',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marreiro Pet — Clínica Veterinária e Pet Shop no Ceará',
    description: 'Clínica veterinária, banho e tosa, vacinação e delivery de ração em 4 unidades no Ceará.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'VeterinaryCare',
            name: 'Marreiro Pet',
            description: 'Clínica veterinária, banho e tosa, vacinação e delivery de ração no Ceará.',
            url: 'https://marreiropet.com.br',
            telephone: '+558592183654',
            email: 'petshopmarreiro@gmail.com',
            openingHours: 'Mo-Sa 08:00-18:00',
            sameAs: [
              'https://www.instagram.com/marreiropet/',
              'https://www.facebook.com/marreiropet/',
            ],
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Av. Dom Almeida Lustosa, 2537',
              addressLocality: 'Caucaia',
              addressRegion: 'CE',
              postalCode: '61650-000',
              addressCountry: 'BR',
            },
            priceRange: '$$',
            hasMap: 'https://www.google.com/maps/search/Marreiro+Pet+Caucaia+CE',
          })}}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
