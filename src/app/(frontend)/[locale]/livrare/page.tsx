import type { Metadata } from 'next'
import React from 'react'

import { Breadcrumbs } from '@/components/ui'
import { DELIVERY_CHISINAU_MDL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Livrare și plată',
  description:
    'Condiții de livrare LiderConstruct: zone, costuri, termene și modalități de plată pentru materiale de construcție în Moldova.',
  alternates: { canonical: '/livrare' },
}

/**
 * General store information (change request §15): delivery belongs here, not
 * repeated on every product page.
 */
export default function LivrarePage(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
      <Breadcrumbs items={[{ label: 'Acasă', href: '/' }, { label: 'Livrare și plată' }]} />
      <h1 className="mt-3 font-display text-2xl font-bold text-fg md:text-3xl">Livrare și plată</h1>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-base font-medium text-fg">Zone și costuri</h2>
          <p className="mt-2">
            Livrare în Chișinău — <span className="font-mono text-fg">{DELIVERY_CHISINAU_MDL} lei</span>.
            În alte localități din Moldova costul se stabilește la înțelegere, în funcție de volumul
            comenzii, greutate și distanță. Pentru comenzi mari, transportul poate fi negociat separat.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-fg">Termene</h2>
          <p className="mt-2">
            După plasarea comenzii, un operator vă contactează telefonic pentru a confirma
            disponibilitatea, prețul final și intervalul de livrare. Termenul concret depinde de stocul
            produselor și de localitatea de livrare.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-fg">Modalități de plată</h2>
          <p className="mt-2">
            Nu există plată online pe site. Plata se face la livrare sau prin transfer bancar, conform
            înțelegerii stabilite telefonic cu operatorul. Pentru persoane juridice se emit documentele
            contabile necesare.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-fg">Confirmarea comenzii</h2>
          <p className="mt-2">
            Prețurile și disponibilitatea afișate pe site au caracter informativ și se confirmă la
            momentul procesării comenzii. Dacă un produs nu mai este disponibil sau prețul s-a modificat,
            veți fi anunțat înainte de livrare.
          </p>
        </section>
      </div>
    </div>
  )
}
