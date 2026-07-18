/**
 * Internal business taxonomy — customer/SEO oriented, independent of any
 * supplier. RO titles (the storefront's primary language); RU added later.
 * `keywords` are RO hints used only by the supplier→internal mapping proposer;
 * they are NOT written to the DB as aliases (aliases are applied only after the
 * mapping is approved). Depth defines level: 0=Section, 1=Category, 2=Subcategory.
 */
export interface TaxNode {
  title: string
  en?: string
  keywords?: string[]
  children?: TaxNode[]
}

export const TAXONOMY: TaxNode[] = [
  {
    title: 'Gips-carton și sisteme interioare',
    en: 'Drywall & Interior Systems',
    children: [
      { title: 'Plăci de gips-carton', keywords: ['gips carton', 'placa gips', 'knauf', 'bandă gips carton'] },
      { title: 'Profile pentru gips-carton', keywords: ['profile', 'accesorii pentru profile'] },
      { title: 'Accesorii gips-carton', keywords: ['banda gips carton', 'adezivi pentru gips carton', 'chit rosturi gips carton'] },
      { title: 'Plăci și panouri', keywords: ['osb', 'placaj', 'pfl', 'lambriu din lemn', 'lambriu'] },
    ],
  },
  {
    title: 'Termoizolare și fonoizolare',
    en: 'Insulation',
    children: [
      { title: 'Vată minerală', keywords: ['vata minerala', 'vată minerală'] },
      { title: 'Polistiren', keywords: ['polistiren expandat', 'polistiren extrudat'] },
      { title: 'Accesorii termoizolare', keywords: ['dibluri pentru termoizolare', 'plasă din fibră de sticlă', 'fibră de sticlă', 'cheramzit'] },
    ],
  },
  {
    title: 'Acoperișuri',
    en: 'Roofing',
    children: [
      { title: 'Sisteme de jgheaburi și burlane', keywords: ['jgheab', 'burlan'] },
      { title: 'Membrane și folii pentru acoperiș', keywords: ['pelicule', 'membrane', 'accesorii acoperiș', 'membrane bituminoase', 'tehnonikoli'] },
      { title: 'Accesorii acoperiș', keywords: ['corniere și leațuri', 'leaț', 'recuperator de aer', 'lățimea'] },
    ],
  },
  {
    title: 'Fațade și sisteme exterioare',
    en: 'Facades & Exterior Systems',
    children: [
      { title: 'Tencuieli decorative', keywords: ['tencuială mozaicată', 'tencuială decorativă', 'tinc', 'structura tinc'] },
      { title: 'Sisteme termoizolante pentru fațade', keywords: ['adezivi pentru termoizolare', 'plasă din fibră de sticlă', 'adeziv pentru fibră de sticlă'] },
    ],
  },
  {
    title: 'Zidărie și materiale structurale',
    en: 'Masonry & Structural Materials',
    children: [
      { title: 'Cărămidă', keywords: ['caramidă', 'cărămidă'] },
      { title: 'Blocuri', keywords: ['blocuri bca', 'bca'] },
      { title: 'Lemn și cherestea', keywords: ['leaț', 'corniere și leațuri', 'lambriu din lemn'] },
    ],
  },
  {
    title: 'Beton, ciment și mortare',
    en: 'Concrete, Cement & Mortars',
    children: [
      { title: 'Ciment', keywords: ['ciment'] },
      { title: 'Mortare și șape', keywords: ['mortar pe bază de ciment', 'șape autonivelante', 'amescuri uscate', 'șapă'] },
      { title: 'Gleturi', keywords: ['gleturi', 'glet'] },
      { title: 'Chituri pentru rosturi', keywords: ['chituri pentru rosturi', 'chit rosturi'] },
      { title: 'Adezivi pentru construcții', keywords: ['adezivi pentru teracotă', 'adeziv pentru tapete', 'adeziv pentru parchet', 'adeziv pentru baghete', 'pva', 'coler'] },
      { title: 'Aditivi pentru beton', keywords: ['adaosuri în beton', 'antiinghet'] },
      { title: 'Agregate', keywords: ['nisip în saci', 'pietriș în saci', 'cheramzit'] },
    ],
  },
  {
    title: 'Hidroizolație și chimie pentru construcții',
    en: 'Waterproofing & Chemicals',
    children: [
      { title: 'Materiale hidroizolante', keywords: ['materiale hidroizolante', 'membrană pentru fundament', 'mastic bituminos'] },
      { title: 'Etanșanți (silicon, spumă)', keywords: ['silicon și spumă', 'silicon', 'spumă'] },
      { title: 'Soluții de protecție', keywords: ['soluiții antimucegai', 'antimucegai', 'peliculă de protecție'] },
    ],
  },
  {
    title: 'Profile metalice și schelete',
    en: 'Metal Profiles & Framing',
    children: [
      { title: 'Profile pentru construcții', keywords: ['profile', 'accesorii pentru profile'] },
      { title: 'Tablă și plasă metalică', keywords: ['tablă zincată', 'plasă sudată zincată', 'plasă sudată vr-1', 'plasă rabița', 'sârmă de legat'] },
    ],
  },
  {
    title: 'Elemente de fixare',
    en: 'Fasteners & Fixings',
    children: [
      { title: 'Șuruburi', keywords: ['șuruburi', 'holzșuruburi'] },
      { title: 'Cuie și nituri', keywords: ['cuie', 'nituri din aluminiu'] },
      { title: 'Dibluri și ancore', keywords: ['ancore', 'dibluri cu șurub', 'diblu din polipriopilenă', 'diblu cu șurub cap hexagonal', 'diblu cu șurub pentru schelă', 'dibluri'] },
      { title: 'Buloane, piulițe, șaibe', keywords: ['buloane', 'piulițe', 'șaibe'] },
    ],
  },
  {
    title: 'Scule și echipamente',
    en: 'Tools & Equipment',
    children: [
      { title: 'Burghii și accesorii', keywords: ['burghii', 'bituri', 'discuri pentru tăiat', 'lame', 'pânze'] },
      { title: 'Scule de tăiat', keywords: ['scule de tăiat', 'discuri pentru tăiat', 'lame, pânze'] },
      { title: 'Scule de mână', keywords: ['ciocane', 'topoare', 'clește', 'chei, tubulare', 'spacluri', 'driști', 'mistrii', 'șurubelnițe', 'capsatoare', 'pistoale pentru montare'] },
      { title: 'Scule de măsurare', keywords: ['scule de măsurare'] },
      { title: 'Abrazive', keywords: ['hârtie abrazivă', 'abraziv'] },
      { title: 'Accesorii pentru zugrăvit', keywords: ['rulouri', 'perii', 'vase pentru zugrăvit', 'accesorii pentru zugrăvit'] },
      { title: 'Consumabile pentru sudură', keywords: ['electrolizi', 'electrozi'] },
      { title: 'Scări', keywords: ['scări'] },
    ],
  },
  { title: 'Electrice', en: 'Electrical', children: [{ title: 'Materiale electrice', keywords: [] }] },
  { title: 'Instalații sanitare', en: 'Plumbing', children: [{ title: 'Materiale sanitare', keywords: [] }] },
  {
    title: 'Ventilație și climatizare',
    en: 'HVAC & Ventilation',
    children: [{ title: 'Accesorii ventilație', keywords: ['recuperator de aer', 'marley'] }],
  },
  {
    title: 'Uși și ferestre',
    en: 'Doors & Windows',
    children: [
      { title: 'Uși de interior', keywords: ['uși de interior', 'usi interior'] },
      { title: 'Uși metalice', keywords: ['uși metalice', 'usi metalice'] },
      {
        title: 'Feronerie pentru uși',
        keywords: ['mânere și rozete', 'lacăte și accesorii', 'balamale', 'element de stopare ușă', 'sisteme pentru uși glisante'],
      },
      { title: 'Jaluzele și rulouri', keywords: ['jaluzele'] },
    ],
  },
  {
    title: 'Pardoseli',
    en: 'Flooring',
    children: [
      { title: 'Laminat', keywords: ['laminat', 'substraturi pentru laminat'] },
      { title: 'Pardoseli vinil / SPC', keywords: ['pardoseli din vinil sps', 'vinil', 'spc'] },
      { title: 'Plinte', keywords: ['plinte'] },
      { title: 'Profile de trecere', keywords: ['profile pentru îmbinare'] },
    ],
  },
  {
    title: 'Tavane',
    en: 'Ceilings',
    children: [{ title: 'Tavane casetate', keywords: ['tavane casetate', 'armstrong'] }],
  },
  {
    title: 'Vopsele și finisaje',
    en: 'Paints & Finishes',
    children: [
      { title: 'Vopsele decorative', keywords: ['emailuri', 'vopsea interior', 'vopsea exterior', 'vopsea decorativă'] },
      { title: 'Lacuri și protecția lemnului', keywords: ['lacuri', 'protecția lemnului', 'chimie pentru lemn'] },
      { title: 'Grunduri', keywords: ['grunduri', 'grund'] },
      { title: 'Pigmenți și coloranți', keywords: ['pigmenți', 'coler'] },
      { title: 'Diluanți', keywords: ['diluant'] },
      { title: 'Baghete și elemente decorative', keywords: ['baghete fără ornament', 'baghete cu ornament', 'adeziv pentru baghete', 'baghete'] },
    ],
  },
  {
    title: 'Amenajări exterioare',
    en: 'Landscaping & Outdoor',
    children: [{ title: 'Combustibil solid', keywords: ['peleți', 'pelet'] }],
  },
  {
    title: 'Echipament de protecție',
    en: 'Safety Equipment',
    children: [{ title: 'Echipament individual de protecție', keywords: ['mănuși de lucru', 'mănuși'] }],
  },
  {
    title: 'Lichidări și promoții',
    en: 'Clearance & Promotions',
    children: [{ title: 'Promoții', keywords: [] }],
  },
]
