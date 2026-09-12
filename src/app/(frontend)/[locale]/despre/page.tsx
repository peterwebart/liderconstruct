import type { Metadata } from 'next'
import React from 'react'

import { LocaleLink as Link } from '@/components/nav/LocaleLink'
import { Breadcrumbs } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Despre noi',
  description:
    'LiderConstruct — furnizor de materiale de construcție în Moldova: catalog larg, branduri verificate, consultanță tehnică și livrare rapidă.',
  alternates: { canonical: '/despre' },
}

export default function DesprePage(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
      <Breadcrumbs items={[{ label: 'Acasă', href: '/' }, { label: 'Despre noi' }]} />
      <h1 className="mt-3 font-display text-2xl font-bold text-fg md:text-3xl">Despre LiderConstruct</h1>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted">
        <p>
          LiderConstruct furnizează materiale de construcție pentru echipe profesioniste și pentru
          proiecte de casă din toată Moldova. Lucrăm cu producători și distribuitori verificați, iar
          catalogul acoperă principalele etape ale unei lucrări — de la structură și termoizolare, până
          la finisaje, scule și accesorii.
        </p>

        <section>
          <h2 className="font-display text-base font-medium text-fg">Cum lucrăm</h2>
          <p className="mt-2">
            Comanda se plasează direct din catalog, fără cont și fără plată online. După trimiterea
            comenzii, un operator vă contactează pentru a confirma disponibilitatea, prețul final și
            intervalul de livrare. Pentru cantități mari sau liste de materiale, pregătim ofertă
            personalizată.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-fg">Consultanță tehnică</h2>
          <p className="mt-2">
            Alegerea materialului potrivit depinde de proiect: destinație, condiții de montaj, consum și
            compatibilitatea cu celelalte straturi. Echipa noastră vă poate ajuta să comparați variantele
            disponibile înainte de a comanda.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-fg">Informații utile</h2>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/livrare" className="text-accent hover:underline">
                Livrare și plată
              </Link>{' '}
              — zone, costuri și termene.
            </li>
            <li>
              <Link href="/termeni" className="text-accent hover:underline">
                Termeni și condiții
              </Link>{' '}
              — condițiile de utilizare a site-ului și de plasare a comenzilor.
            </li>
            <li>
              <Link href="/contact" className="text-accent hover:underline">
                Contact
              </Link>{' '}
              — program și date de contact.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
