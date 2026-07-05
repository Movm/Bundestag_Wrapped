import { Link } from 'react-router';
import { motion } from 'motion/react';
import { SEO } from '@/components/seo/SEO';
import { PAGE_META } from '@/components/seo/constants';
import { DocSection } from '@/components/dokumentation/ui';
import { docLink, SectionLabel, ToolChip, EndpointBar, CONNECT_INTRO } from '@/components/mcp/mcpShared';

const FACTS: { label: string; value: string; sub?: string }[] = [
  { label: 'Transport', value: 'Streamable HTTP' },
  { label: 'Zugang', value: 'keine Anmeldung' },
  { label: 'Werkzeuge', value: '38', sub: 'nur lesend' },
  { label: 'Such-Index', value: '~101.700', sub: 'Vektoren' },
  { label: 'Wahlperiode', value: '21', sub: 'zurück bis WP19' },
];

const CAPABILITIES: { title: string; badge: string; purpose: string; tools: string[] }[] = [
  {
    title: 'Dokumente & Protokolle',
    badge: '6 Tools · DIP',
    purpose:
      'Drucksachen und Plenarprotokolle nach Titel, Typ, Datum, Urheber oder Wahlperiode finden, einzeln abrufen und den Volltext gezielt laden — mit Größencheck vorab, weil Protokolle 50k–200k Tokens umfassen.',
    tools: [
      'search_drucksachen',
      'get_drucksache',
      'search_drucksachen_text',
      'search_plenarprotokolle',
      'get_plenarprotokoll',
      'search_plenarprotokolle_text',
    ],
  },
  {
    title: 'Vorgänge & Gesetzgebung',
    badge: '4 Tools',
    purpose:
      'Gesetzgebungsverfahren von der Einbringung bis zum Beschluss verfolgen — als kompakte Timeline mit Beratungen, Ausschüssen, Beschlusstenor und den beteiligten Dokumenten.',
    tools: ['search_vorgaenge', 'get_vorgang', 'search_vorgangspositionen', 'vorgang_timeline'],
  },
  {
    title: 'Personen & Aktivitäten',
    badge: '4 Tools',
    purpose:
      'Abgeordnete, Ministerinnen und Minister suchen und ihre parlamentarische Arbeit nachvollziehen — Reden, Anfragen und weitere Aktivitäten, gefiltert nach Person, Zeitraum oder Wahlperiode.',
    tools: ['search_personen', 'get_person', 'search_aktivitaeten', 'get_aktivitaet'],
  },
  {
    title: 'Semantische Suche',
    badge: '4 Tools · KI-Embeddings',
    purpose:
      'Vektorsuche über Reden und Dokumentabschnitte (Qdrant + Mistral-Embeddings): findet Inhalte nach Bedeutung, auch wenn der genaue Wortlaut unbekannt ist — die DIP-API selbst kann keine Volltextsuche. Ergebnisse nach Relevanz oder Aktualität sortierbar und auf einen Zeitraum eingrenzbar; einzelne Reden strukturiert extrahieren.',
    tools: ['semantic_search', 'search_speeches', 'search_document_sections', 'extract_speeches'],
  },
  {
    title: 'Sprach- & Rhetorik-Analyse',
    badge: '5 Tools · NLP',
    purpose:
      'Tonalität, Themenfelder, Partei-Vergleiche und Sprachprofile einzelner Abgeordneter — dieselbe spaCy-Pipeline, die Bundestag Wrapped antreibt: Aggression, Kooperation, Lösungsorientierung, Lieblingswörter.',
    tools: ['analyze_text', 'analyze_tone', 'classify_topics', 'speaker_profile', 'compare_parties'],
  },
  {
    title: 'Statistik & Zählung',
    badge: '1 Tool',
    purpose:
      'Treffer zählen und gruppieren, ohne jede Zeile in den Kontext zu laden — Summen, Zeitreihen (pro Monat/Jahr) oder Aufschlüsselungen nach Dokumenttyp, Vorgangstyp oder Fraktion.',
    tools: ['count'],
  },
  {
    title: 'Transparenz',
    badge: '6 Tools · Abgeordnetenwatch',
    purpose:
      'Namentliches Abstimmungsverhalten, gemeldete Nebentätigkeiten und kombinierte Transparenzprofile einzelner Abgeordneter — inklusive Suche nach namentlichen Abstimmungen und aggregierten Ergebnissen. Präfix abgeordnetenwatch_…',
    tools: [
      'search_politicians',
      'voting_record',
      'sidejobs',
      'search_polls',
      'poll_tally',
      'politician_profile',
    ],
  },
];

const META_TOOLS = [
  'get_filters',
  'estimate_size',
  'cache_stats',
  'semantic_search_status',
  'protocol_search_status',
  'document_search_status',
  'analysis_health',
  'get_client_config',
];

const code = 'font-mono text-xs bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/85';

export function McpTechnikPage() {
  return (
    <>
      <SEO
        title={PAGE_META.mcpTechnik.title}
        description={PAGE_META.mcpTechnik.description}
        canonicalUrl="/mcp/technik"
      />
      <div className="min-h-screen page-bg px-6 pt-24 pb-24">
        <div className="w-full max-w-4xl mx-auto">
          {/* Hero */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/mcp" className="inline-block font-mono text-xs uppercase tracking-[0.14em] text-white/40 hover:text-pink-400 transition-colors mb-5">
              ← Übersicht
            </Link>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-pink-400 mb-5 flex items-center gap-3">
              <span className="inline-block w-6 h-px bg-pink-400" aria-hidden="true" />
              MCP · Technische Referenz
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.05] mb-5 text-balance">
              Bundestag-MCP — technische Details
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-2xl">
              38 nur-lesende Werkzeuge über <strong className="text-white font-semibold">Streamable HTTP</strong>,
              ohne Anmeldung. Diese Seite listet den vollständigen Tool-Katalog, die Filter und die Sortierung —
              für die Einbindung in eigene MCP-Clients.
            </p>
          </motion.header>

          {/* Endpoint + facts */}
          <DocSection delay={0.1} className="mt-10">
            <p className="text-sm text-white/50 mb-2">{CONNECT_INTRO}</p>
            <EndpointBar />
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden mt-4">
              {FACTS.map(f => (
                <div key={f.label} className="bg-bg-card/60 px-4 py-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 mb-1.5">
                    {f.label}
                  </dt>
                  <dd className="text-white font-semibold tabular-nums">
                    {f.value}
                    {f.sub && <span className="text-white/40 font-normal"> · {f.sub}</span>}
                  </dd>
                </div>
              ))}
              <div className="bg-bg-card/60 px-4 py-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 mb-1.5">Aktualität</dt>
                <dd>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                    tagesaktuell
                  </span>
                </dd>
              </div>
            </dl>
          </DocSection>

          {/* Tool catalog */}
          <DocSection delay={0.15} className="mt-14">
            <SectionLabel>Werkzeuge · Tool-Katalog</SectionLabel>
            <div className="grid gap-4">
              {CAPABILITIES.map(cap => (
                <div
                  key={cap.title}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 transition-colors hover:border-white/20"
                >
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{cap.title}</h3>
                    <span className="font-mono text-xs text-white/40 whitespace-nowrap">{cap.badge}</span>
                  </div>
                  <p className="text-[15px] text-white/70 leading-relaxed mb-4 max-w-2xl">{cap.purpose}</p>
                  <div className="flex flex-wrap gap-2">
                    {cap.tools.map(t => (
                      <ToolChip key={t} name={t} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DocSection>

          {/* Filters & sorting */}
          <DocSection delay={0.15} className="mt-14">
            <SectionLabel>Filter & Sortierung</SectionLabel>
            <div className="grid gap-4">
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">Sortierung</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Die semantischen Tools (<code className={code}>semantic_search</code>,{' '}
                  <code className={code}>search_speeches</code>, <code className={code}>search_document_sections</code>)
                  nehmen <code className={code}>sort</code> = <code className={code}>relevance</code> (Standard) ·{' '}
                  <code className={code}>newest</code> · <code className={code}>oldest</code>. Für die neuesten
                  Treffer in einem Fenster mit <code className={code}>dateFrom</code>/<code className={code}>dateTo</code>{' '}
                  kombinieren.
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">Zeitraum</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Semantische Tools filtern per <code className={code}>dateFrom</code>/<code className={code}>dateTo</code>,
                  die DIP-Tools per <code className={code}>datum_start</code>/<code className={code}>datum_end</code>{' '}
                  (jeweils <code className={code}>YYYY-MM-DD</code>). DIP liefert grundsätzlich neueste zuerst.
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">Filterwerte entdecken</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-3">
                  <code className={code}>get_filters</code> liefert pro Such-Fläche die verfügbaren Filter und ihre
                  gültigen Werte (Parteien, Redetypen, Drucksachetypen, Sachgebiete, abgedeckte Wahlperioden). Die KI
                  ruft es einmal auf, statt Werte zu raten.
                </p>
                <p className="text-sm text-white/60 leading-relaxed border-l-2 border-pink-500 pl-4">
                  <strong className="text-white/90">Achtung — Parteinamen je Ebene:</strong> die Reden-Collection
                  speichert Kurznamen (<code className={code}>GRÜNE</code>), DIP-Tools und{' '}
                  <code className={code}>semantic_search</code> nutzen die langen Namen
                  (<code className={code}>BÜNDNIS 90/DIE GRÜNEN</code>). <code className={code}>CDU/CSU</code>,{' '}
                  <code className={code}>SPD</code>, <code className={code}>AfD</code>,{' '}
                  <code className={code}>DIE LINKE</code> sind in beiden gleich.
                </p>
              </div>
            </div>
          </DocSection>

          {/* Operations & data */}
          <DocSection delay={0.15} className="mt-14">
            <SectionLabel>Betrieb &amp; Daten</SectionLabel>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-sm text-white/60 leading-relaxed">
              <p className="mb-3">
                <strong className="text-white/90">Datenquellen:</strong> amtliche{' '}
                <a className={docLink} href="https://dip.bundestag.de" target="_blank" rel="noopener noreferrer">
                  DIP-API
                </a>{' '}
                des Bundestages (zurück bis Wahlperiode 19) · Abgeordnetenwatch · semantischer Index aus
                Qdrant&nbsp;+&nbsp;Mistral-Embeddings · spaCy-NLP von Bundestag Wrapped. Der Such-Index
                aktualisiert sich alle 15&nbsp;Minuten, die Wrapped-Auswertungen wöchentlich.
              </p>
              <p className="mb-3">
                <strong className="text-white/90">Acht Meta-Werkzeuge</strong> für Filter-Discovery, Betrieb &amp;
                Diagnose — <code className={code}>get_filters</code> für gültige Filterwerte, dazu Größencheck vor
                dem Volltextabruf, Status- und Health-Endpunkte, Cache-Statistik und fertige Client-Konfiguration:
              </p>
              <div className="flex flex-wrap gap-2">
                {META_TOOLS.map(t => (
                  <ToolChip key={t} name={t} />
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm text-white/50">
              Jeder MCP-fähige Client mit Streamable-HTTP funktioniert (Claude, ChatGPT, Mistral, Cursor,
              VS&nbsp;Code …). Mehr zum Standard:{' '}
              <a className={docLink} href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">
                modelcontextprotocol.io
              </a>
              . Quelltext:{' '}
              <a className={docLink} href="https://github.com/Movm/Bundestag_Wrapped" target="_blank" rel="noopener noreferrer">
                github.com/Movm/Bundestag_Wrapped
              </a>
            </p>
            <p className="mt-6">
              <Link to="/mcp" className="text-pink-400 hover:text-pink-300 text-sm font-medium">
                ← Zurück zur Übersicht
              </Link>
            </p>
          </DocSection>
        </div>
      </div>
    </>
  );
}
