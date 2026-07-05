import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { SEO } from '@/components/seo/SEO';
import { PAGE_META } from '@/components/seo/constants';
import { DocSection } from '@/components/dokumentation/ui';

const MCP_ENDPOINT = 'https://mcp.bundestag-wrapped.de/mcp';

const FACTS: { label: string; value: string; sub?: string }[] = [
  { label: 'Transport', value: 'Streamable HTTP' },
  { label: 'Zugang', value: 'keine Anmeldung' },
  { label: 'Werkzeuge', value: '38', sub: 'nur lesend' },
  { label: 'Such-Index', value: '~101.700', sub: 'Vektoren' },
  { label: 'Wahlperiode', value: '21', sub: 'zurück bis WP19' },
];

const CAPABILITIES: {
  title: string;
  badge: string;
  purpose: string;
  tools: string[];
  example: string;
}[] = [
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
    example: 'Welche Gesetzentwürfe zur Krankenhausreform gibt es in dieser Wahlperiode?',
  },
  {
    title: 'Vorgänge & Gesetzgebung',
    badge: '4 Tools',
    purpose:
      'Gesetzgebungsverfahren von der Einbringung bis zum Beschluss verfolgen — als kompakte Timeline mit Beratungen, Ausschüssen, Beschlusstenor und den beteiligten Dokumenten.',
    tools: ['search_vorgaenge', 'get_vorgang', 'search_vorgangspositionen', 'vorgang_timeline'],
    example: 'Verfolge das Energieeffizienzgesetz von der Einbringung bis zum Beschluss.',
  },
  {
    title: 'Personen & Aktivitäten',
    badge: '4 Tools',
    purpose:
      'Abgeordnete, Ministerinnen und Minister suchen und ihre parlamentarische Arbeit nachvollziehen — Reden, Anfragen und weitere Aktivitäten, gefiltert nach Person, Zeitraum oder Wahlperiode.',
    tools: ['search_personen', 'get_person', 'search_aktivitaeten', 'get_aktivitaet'],
    example: 'Was hat Katharina Dröge zuletzt im Plenum eingebracht?',
  },
  {
    title: 'Semantische Suche',
    badge: '4 Tools · KI-Embeddings',
    purpose:
      'Vektorsuche über Reden und Dokumentabschnitte (Qdrant + Mistral-Embeddings): findet Inhalte nach Bedeutung, auch wenn der genaue Wortlaut unbekannt ist — die DIP-API selbst kann keine Volltextsuche. Ergebnisse lassen sich nach Relevanz oder Aktualität sortieren und auf einen Zeitraum eingrenzen; einzelne Reden strukturiert extrahieren.',
    tools: ['semantic_search', 'search_speeches', 'search_document_sections', 'extract_speeches'],
    example: 'Finde Redepassagen zum Windkraft-Ausbau an Land — auch ohne exakten Wortlaut.',
  },
  {
    title: 'Sprach- & Rhetorik-Analyse',
    badge: '5 Tools · NLP',
    purpose:
      'Tonalität, Themenfelder, Partei-Vergleiche und Sprachprofile einzelner Abgeordneter — dieselbe spaCy-Pipeline, die Bundestag Wrapped antreibt: Aggression, Kooperation, Lösungsorientierung, Lieblingswörter.',
    tools: ['analyze_text', 'analyze_tone', 'classify_topics', 'speaker_profile', 'compare_parties'],
    example: 'Vergleiche SPD und CDU/CSU rhetorisch beim Thema Migration.',
  },
  {
    title: 'Statistik & Zählung',
    badge: '1 Tool',
    purpose:
      'Treffer zählen und gruppieren, ohne jede Zeile in den Kontext zu laden — Summen, Zeitreihen (pro Monat/Jahr) oder Aufschlüsselungen nach Dokumenttyp, Vorgangstyp oder Fraktion.',
    tools: ['count'],
    example: 'Wie viele Kleine Anfragen hat die AfD in dieser Wahlperiode gestellt?',
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
    example: 'Wie hat diese Abgeordnete namentlich abgestimmt — und welche Nebentätigkeiten meldet sie?',
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

const docLink = 'text-pink-400 hover:text-pink-300 underline underline-offset-2';

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-white/40 border-b border-white/10 pb-3 mb-6">
      {children}
    </h2>
  );
}

function ToolChip({ name }: { name: string }) {
  return (
    <span className="font-mono text-xs text-white/80 bg-white/5 border border-white/10 rounded-md px-2 py-1">
      {name}
    </span>
  );
}

function EndpointBar() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(MCP_ENDPOINT).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  };
  return (
    <div className="flex items-stretch gap-2">
      <code className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-mono overflow-x-auto flex items-center">
        {MCP_ENDPOINT}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-white/80 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-400"
        aria-label="Endpoint-URL kopieren"
      >
        {copied ? 'Kopiert ✓' : 'Kopieren'}
      </button>
    </div>
  );
}

export function McpPage() {
  return (
    <>
      <SEO
        title={PAGE_META.mcp.title}
        description={PAGE_META.mcp.description}
        canonicalUrl="/mcp"
      />
      <div className="min-h-screen page-bg px-6 pt-24 pb-24">
        <div className="w-full max-w-4xl mx-auto">
          {/* Hero */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-pink-400 mb-5 flex items-center gap-3">
              <span className="inline-block w-6 h-px bg-pink-400" aria-hidden="true" />
              MCP-Server · Bundestag Wrapped
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.05] mb-5 text-balance">
              Was kann der Bundestag-MCP-Server?
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-2xl">
              Ein offener <strong className="text-white font-semibold">Model-Context-Protocol-Server</strong>,
              der die amtliche Parlamentsdokumentation des Deutschen Bundestages, einen semantischen
              KI-Suchindex, eine NLP-Sprachanalyse und Transparenzdaten von Abgeordnetenwatch als{' '}
              <strong className="text-white font-semibold">38 Werkzeuge</strong> für KI-Assistenten
              bereitstellt. Statt zu raten, sucht der Assistent die passende Drucksache, liest die Rede
              und zitiert mit Quelle.
            </p>
          </motion.header>

          {/* Endpoint + facts */}
          <DocSection delay={0.1} className="mt-10">
            <p className="text-sm text-white/50 mb-2">Ein Endpoint, überall gleich — öffentlich, ohne Anmeldung:</p>
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

          {/* Capabilities */}
          <DocSection delay={0.15} className="mt-14">
            <SectionLabel>Sieben Fähigkeiten</SectionLabel>
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
                  <div className="flex flex-wrap gap-2 mb-5">
                    {cap.tools.map(t => (
                      <ToolChip key={t} name={t} />
                    ))}
                  </div>
                  <div className="bg-white/[0.04] rounded-xl px-4 py-3.5">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-pink-400 mb-1.5">
                      Frag z.&nbsp;B.
                    </span>
                    <p className="text-base text-white/85 leading-relaxed">„{cap.example}"</p>
                  </div>
                </div>
              ))}
            </div>
          </DocSection>

          {/* Connect */}
          <DocSection delay={0.15} className="mt-14">
            <SectionLabel>In wenigen Minuten verbinden</SectionLabel>

            <div className="grid gap-4">
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">Claude</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-3">
                  <strong className="text-white/90">claude.ai &amp; Claude Desktop</strong> (Free, Pro, Max,
                  Team, Enterprise): <strong className="text-white/90">Einstellungen → Connectors</strong> →
                  „+" → <strong className="text-white/90">„Eigenen Connector hinzufügen"</strong> → Endpoint
                  eintragen → <strong className="text-white/90">Hinzufügen</strong>. Danach pro Chat über das
                  „+"-Menü aktivieren.
                </p>
                <p className="text-sm text-white/50 mb-2">Oder in Claude Code (CLI):</p>
                <code className="block bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-xs text-white/90 font-mono overflow-x-auto mb-3">
                  claude mcp add --transport http bundestag {MCP_ENDPOINT}
                </code>
                <p className="text-xs text-white/50">
                  Ausführlich:{' '}
                  <a className={docLink} href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" target="_blank" rel="noopener noreferrer">
                    Custom Connectors (Claude Help Center)
                  </a>{' '}
                  ·{' '}
                  <a className={docLink} href="https://code.claude.com/docs/en/mcp" target="_blank" rel="noopener noreferrer">
                    Claude Code MCP-Doku
                  </a>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-2">ChatGPT</h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-3">
                    Zuerst den <strong className="text-white/90">Entwicklermodus</strong> einschalten:{' '}
                    <strong className="text-white/90">Einstellungen → Connectors → Erweiterte Einstellungen</strong>.
                    Dann <strong className="text-white/90">Connectors → „Erstellen"</strong> → Name, Beschreibung
                    und Endpoint als MCP-Server-URL. Auf allen Plänen verfügbar.
                  </p>
                  <p className="text-xs text-white/50">
                    Ausführlich:{' '}
                    <a className={docLink} href="https://developers.openai.com/apps-sdk/deploy/connect-chatgpt" target="_blank" rel="noopener noreferrer">
                      Remote MCP in ChatGPT verbinden (OpenAI Docs)
                    </a>
                  </p>
                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-2">Mistral / Le&nbsp;Chat</h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-3">
                    <strong className="text-white/90">Connectors</strong> →{' '}
                    <strong className="text-white/90">„+ Add Connector"</strong> → Reiter{' '}
                    <strong className="text-white/90">„Custom MCP Connector"</strong> → Name und Endpoint als
                    Server-URL → <strong className="text-white/90">Connect</strong>. Auth:{' '}
                    <strong className="text-white/90">„No authentication"</strong>.
                  </p>
                  <p className="text-xs text-white/50">
                    Ausführlich:{' '}
                    <a className={docLink} href="https://docs.mistral.ai/vibe/work/connectors/mcp-connectors" target="_blank" rel="noopener noreferrer">
                      MCP Connectors (Mistral Docs)
                    </a>
                  </p>
                </div>
              </div>

              <p className="text-sm text-white/50">
                Grundsätzlich funktioniert jeder MCP-fähige Client mit Streamable-HTTP-Unterstützung — auch
                Cursor, VS&nbsp;Code u.&nbsp;a. Mehr zum Standard:{' '}
                <a className={docLink} href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">
                  modelcontextprotocol.io
                </a>
                .
              </p>
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
                Diagnose — <code className="font-mono text-xs text-white/70">get_filters</code> listet der KI die
                gültigen Filterwerte, dazu Größencheck vor dem Volltextabruf, Status- und Health-Endpunkte,
                Cache-Statistik und fertige Client-Konfiguration:
              </p>
              <div className="flex flex-wrap gap-2">
                {META_TOOLS.map(t => (
                  <ToolChip key={t} name={t} />
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm text-white/50">
              Server, Analyse-Pipeline und diese Website sind Open Source:{' '}
              <a className={docLink} href="https://github.com/Movm/Bundestag_Wrapped" target="_blank" rel="noopener noreferrer">
                github.com/Movm/Bundestag_Wrapped
              </a>
            </p>
          </DocSection>
        </div>
      </div>
    </>
  );
}
