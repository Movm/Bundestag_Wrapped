import { Link } from 'react-router';
import { motion } from 'motion/react';
import { SEO } from '@/components/seo/SEO';
import { PAGE_META } from '@/components/seo/constants';
import { DocSection } from '@/components/dokumentation/ui';
import { MCP_ENDPOINT, docLink, SectionLabel, EndpointBar, CONNECT_INTRO } from '@/components/mcp/mcpShared';

const CAN_ASK: { title: string; plain: string; example: string }[] = [
  {
    title: 'Dokumente & Protokolle',
    plain:
      'Durchsucht die offiziellen Dokumente und Sitzungsprotokolle des Bundestags und liest dir die relevanten Stellen heraus.',
    example: 'Welche Gesetzentwürfe zur Krankenhausreform gibt es in dieser Wahlperiode?',
  },
  {
    title: 'Gesetzgebung nachverfolgen',
    plain:
      'Zeigt den Weg eines Gesetzes — von der Einbringung über die Ausschüsse bis zur Abstimmung.',
    example: 'Verfolge das Energieeffizienzgesetz von der Einbringung bis zum Beschluss.',
  },
  {
    title: 'Abgeordnete & ihre Arbeit',
    plain:
      'Was einzelne Abgeordnete im Parlament tun: Reden, Anfragen und weitere Aktivitäten.',
    example: 'Was hat Katharina Dröge zuletzt im Plenum eingebracht?',
  },
  {
    title: 'Reden nach Bedeutung finden',
    plain:
      'Findet Reden und Passagen nach Sinn — auch wenn du nicht die genauen Worte kennst — und kann dir die neuesten zuerst zeigen.',
    example: 'Finde Redepassagen zum Windkraft-Ausbau an Land — auch ohne exakten Wortlaut.',
  },
  {
    title: 'Sprache & Rhetorik vergleichen',
    plain:
      'Vergleicht, wie Parteien und Abgeordnete reden: Ton, Themen und Lieblingswörter — dieselbe Analyse, die Bundestag Wrapped antreibt.',
    example: 'Vergleiche SPD und CDU/CSU rhetorisch beim Thema Migration.',
  },
  {
    title: 'Zahlen & Statistik',
    plain:
      'Zählt und schlüsselt auf — etwa wie oft eine Fraktion etwas eingebracht hat, auch als Zeitreihe.',
    example: 'Wie viele Kleine Anfragen hat die AfD in dieser Wahlperiode gestellt?',
  },
  {
    title: 'Transparenz',
    plain:
      'Namentliches Abstimmungsverhalten und gemeldete Nebentätigkeiten einzelner Abgeordneter (über Abgeordnetenwatch).',
    example: 'Wie hat diese Abgeordnete namentlich abgestimmt — und welche Nebentätigkeiten meldet sie?',
  },
];

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
              Bundestag Wrapped · für KI-Assistenten
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.05] mb-5 text-balance">
              Frag deine KI über den echten Bundestag
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-2xl">
              Verbinde <strong className="text-white font-semibold">Claude</strong>,{' '}
              <strong className="text-white font-semibold">ChatGPT</strong> oder{' '}
              <strong className="text-white font-semibold">Mistral</strong> mit der amtlichen
              Parlamentsdokumentation des Bundestags. Statt zu raten, sucht dein Assistent die
              passende Drucksache, liest die Rede und nennt die Quelle.
            </p>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.1em] text-white/40">
              kostenlos · keine Anmeldung · für alle gängigen KI-Assistenten
            </p>
          </motion.header>

          {/* What you can ask */}
          <DocSection delay={0.1} className="mt-14">
            <SectionLabel>Das kannst du fragen</SectionLabel>
            <div className="grid gap-4">
              {CAN_ASK.map(cap => (
                <div
                  key={cap.title}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 transition-colors hover:border-white/20"
                >
                  <h3 className="text-xl font-bold text-white tracking-tight mb-2">{cap.title}</h3>
                  <p className="text-[15px] text-white/70 leading-relaxed mb-4 max-w-2xl">{cap.plain}</p>
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
            <p className="text-sm text-white/50 mb-2">{CONNECT_INTRO}</p>
            <div className="mb-6">
              <EndpointBar />
            </div>

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
            </div>
          </DocSection>

          {/* Link to technical page */}
          <DocSection delay={0.15} className="mt-14">
            <Link
              to="/mcp/technik"
              className="group flex items-center justify-between gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-6 transition-colors hover:border-pink-400/40"
            >
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Technische Details →</h3>
                <p className="text-sm text-white/60 leading-relaxed max-w-xl">
                  Alle 38 Werkzeuge, Filter &amp; Sortierung, Endpoint, Datenquellen und Hinweise für
                  Entwickler:innen.
                </p>
              </div>
              <span className="text-pink-400 text-2xl shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true">
                →
              </span>
            </Link>
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
