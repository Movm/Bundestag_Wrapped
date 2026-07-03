import { motion } from 'motion/react';
import { SEO } from '@/components/seo/SEO';
import { PAGE_META } from '@/components/seo/constants';

const MCP_ENDPOINT = 'https://mcp.bundestag-wrapped.de/mcp';

const TOOL_GROUPS: { title: string; tools: string }[] = [
  {
    title: 'Dokumente & Protokolle (DIP)',
    tools:
      'Drucksachen, Plenarprotokolle, Vorgänge und Aktivitäten suchen und abrufen — nach Titel, Typ, Datum, Urheber oder Wahlperiode. Inklusive Treffer-Zählung und Größenschätzung vor dem Volltextabruf.',
  },
  {
    title: 'Volltextsuche',
    tools:
      'Stichwortsuche innerhalb von Drucksachen und Plenarprotokollen — findet die Passage, nicht nur das Dokument. Einzelne Reden lassen sich strukturiert aus Protokollen extrahieren.',
  },
  {
    title: 'Semantische Suche',
    tools:
      'Vektorsuche über Reden und Dokumentabschnitte (Qdrant + Mistral-Embeddings): findet Inhalte nach Bedeutung, auch wenn der genaue Wortlaut unbekannt ist.',
  },
  {
    title: 'Personen & Gesetzgebung',
    tools:
      'Abgeordnete suchen, ihre parlamentarische Arbeit nachvollziehen und Gesetzgebungsverfahren als Timeline verfolgen — vom Entwurf bis zur Abstimmung.',
  },
  {
    title: 'Sprachanalyse (NLP)',
    tools:
      'Tonalität, Themenfelder, Partei-Vergleiche und Sprachprofile einzelner Abgeordneter — dieselbe spaCy-Pipeline, die Bundestag Wrapped antreibt.',
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
      <div className="min-h-screen page-bg flex flex-col items-center justify-center px-6 py-12 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <h1 className="text-3xl md:text-4xl font-black text-white mb-8">
            Bundestag-MCP-Server
          </h1>

          <div className="space-y-6 text-white/70 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-white mb-2">Was ist das?</h2>
              <p>
                Ein offener MCP-Server, der die offizielle Parlamentsdokumentation des
                Deutschen Bundestages (DIP) für KI-Assistenten wie Claude nutzbar macht.
                Das <strong className="text-white">Model Context Protocol (MCP)</strong>{' '}
                ist ein offener Standard, über den Assistenten während eines Gesprächs
                externe Werkzeuge aufrufen können — statt zu raten, sucht der Assistent
                die passende Drucksache, liest die relevante Rede und zitiert mit Quelle.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">Verbinden</h2>
              <p className="mb-3">
                Der Server läuft öffentlich, spricht Streamable HTTP und benötigt{' '}
                <strong className="text-white">keine Anmeldung</strong>:
              </p>
              <pre className="bg-black/40 border border-white/10 rounded-lg p-4 text-xs text-white/90 font-mono overflow-x-auto mb-3">
                {MCP_ENDPOINT}
              </pre>
              <p className="mb-2">
                In <strong className="text-white">Claude Code</strong>:
              </p>
              <pre className="bg-black/40 border border-white/10 rounded-lg p-4 text-xs text-white/90 font-mono overflow-x-auto mb-3">
                claude mcp add --transport http bundestag {MCP_ENDPOINT}
              </pre>
              <p>
                Auf <strong className="text-white">claude.ai</strong>: Einstellungen →
                Connectors → „Custom Connector" → URL eintragen. Jeder MCP-fähige Client
                mit Streamable-HTTP-Unterstützung funktioniert.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">
                Funktionen — 35 Tools
              </h2>
              <ul className="space-y-3">
                {TOOL_GROUPS.map(group => (
                  <li key={group.title}>
                    <strong className="text-white">{group.title}:</strong> {group.tools}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">Beispielfragen</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>„Was wurde im Bundestag zuletzt zur Wärmepumpen-Förderung debattiert?"</li>
                <li>„Zeig mir den Stand des Gesetzgebungsverfahrens zur Krankenhausreform."</li>
                <li>„Wie unterscheiden sich SPD und CDU/CSU rhetorisch beim Thema Migration?"</li>
                <li>„Welche Kleinen Anfragen gab es 2026 zum Thema Bahninfrastruktur?"</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">Daten & Quelltext</h2>
              <p className="mb-3">
                Datenquelle ist die{' '}
                <a
                  href="https://dip.bundestag.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline"
                >
                  DIP-API des Deutschen Bundestages
                </a>{' '}
                (amtlich, zurück bis Wahlperiode 19), ergänzt um einen semantischen
                Suchindex und den NLP-Analysedienst von Bundestag Wrapped.
              </p>
              <p>
                Server, Analyse-Pipeline und diese Website sind Open Source:{' '}
                <a
                  href="https://github.com/Movm/Bundestag_Wrapped"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline"
                >
                  github.com/Movm/Bundestag_Wrapped
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </>
  );
}
