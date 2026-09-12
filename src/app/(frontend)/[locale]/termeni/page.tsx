import type { Metadata } from 'next'
import React from 'react'

import { LocaleLink as Link } from '@/components/nav/LocaleLink'
import { Breadcrumbs } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Termeni și condiții',
  description:
    'Termenii și condițiile de utilizare a site-ului LiderConstruct: plasarea comenzilor, prețuri, disponibilitate, specificații și date de contact.',
  alternates: { canonical: '/termeni' },
}

/**
 * Centralized legal information (change request §17). Deliberately factual and
 * narrow: it states how the site actually works instead of asserting legal
 * positions.
 *
 * IMPORTANT: legal-entity identification renders ONLY when the corresponding
 * environment variables are configured — no company name, registration number
 * or address is ever invented. This text should be reviewed by a lawyer before
 * launch.
 */
export default function TermeniPage(): React.JSX.Element {
  const entity = process.env.NEXT_PUBLIC_LEGAL_ENTITY
  const idno = process.env.NEXT_PUBLIC_LEGAL_IDNO
  const address = process.env.NEXT_PUBLIC_LEGAL_ADDRESS
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE
  const hasEntity = Boolean(entity || idno || address)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
      <Breadcrumbs items={[{ label: 'Acasă', href: '/' }, { label: 'Termeni și condiții' }]} />
      <h1 className="mt-3 font-display text-2xl font-bold text-fg md:text-3xl">Termeni și condiții</h1>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted">
        <p>
          Acești termeni descriu modul în care funcționează site-ul LiderConstruct și condițiile în care
          pot fi plasate comenzile. Prin utilizarea site-ului, confirmați că ați luat cunoștință de
          informațiile de mai jos.
        </p>

        {hasEntity && (
          <section>
            <h2 className="font-display text-base font-medium text-fg">Identificarea vânzătorului</h2>
            <ul className="mt-2 space-y-1">
              {entity && <li>Denumire: {entity}</li>}
              {idno && <li>IDNO: {idno}</li>}
              {address && <li>Adresă: {address}</li>}
            </ul>
          </section>
        )}

        <section>
          <h2 className="font-display text-base font-medium text-fg">Prețuri și disponibilitate</h2>
          <p className="mt-2">
            Prețurile și stocurile afișate pe site au caracter informativ și pot fi actualizate fără
            notificare prealabilă, în funcție de informațiile primite de la furnizori. Prețul final și
            disponibilitatea se confirmă la procesarea comenzii, înainte de livrare. Dacă un produs nu
            mai este disponibil sau prețul s-a modificat, veți fi informat și puteți renunța la comandă
            fără costuri.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-fg">Specificațiile produselor</h2>
          <p className="mt-2">
            Descrierile, specificațiile tehnice, imaginile și informațiile despre producător provin de la
            furnizori și producători și pot fi modificate de aceștia. Pot exista diferențe între
            informațiile afișate și produsul livrat (de exemplu ambalaj, revizie a produsului sau
            toleranțe dimensionale). Pentru lucrări unde o caracteristică este determinantă, vă
            recomandăm să solicitați confirmarea acesteia înainte de comandă.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-fg">Plasarea comenzilor</h2>
          <p className="mt-2">
            Comenzile se plasează fără cont de utilizator și fără plată online. Trimiterea unei comenzi
            reprezintă o solicitare de ofertă: comanda devine fermă după confirmarea telefonică a
            disponibilității, prețului final și a condițiilor de livrare. Pentru a procesa comanda avem
            nevoie de nume, telefon și localitate.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-fg">Livrare și plată</h2>
          <p className="mt-2">
            Condițiile de livrare, costurile și modalitățile de plată sunt descrise pe pagina{' '}
            <Link href="/livrare" className="text-accent hover:underline">
              Livrare și plată
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-fg">Datele cu caracter personal</h2>
          <p className="mt-2">
            Datele transmise prin formularul de comandă (nume, telefon, localitate și, opțional, email și
            adresă) sunt utilizate exclusiv pentru procesarea și livrarea comenzii. Nu sunt folosite în
            scopuri de marketing fără acordul dumneavoastră. Puteți solicita informații despre datele
            deținute sau ștergerea acestora folosind datele de contact de mai jos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-fg">Contact</h2>
          <p className="mt-2">
            Pentru întrebări legate de o comandă, de un produs sau de acești termeni, ne puteți contacta
            {phone && (
              <>
                {' '}
                telefonic la <span className="font-mono text-fg">{phone}</span>
              </>
            )}
            {email && (
              <>
                {' '}
                sau prin email la{' '}
                <a href={`mailto:${email}`} className="text-accent hover:underline">
                  {email}
                </a>
              </>
            )}
            . Detalii suplimentare pe pagina{' '}
            <Link href="/contact" className="text-accent hover:underline">
              Contact
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
