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
                <strong className="text-white">keine Anmeldung</strong>. Überall dieselbe
                URL eintragen:
              </p>
              <pre className="bg-black/40 border border-white/10 rounded-lg p-4 text-xs text-white/90 font-mono overflow-x-auto mb-5">
                {MCP_ENDPOINT}
              </pre>

              <h3 className="text-white font-semibold mt-4 mb-1">Claude</h3>
              <p className="mb-2">
                <strong className="text-white">claude.ai &amp; Claude Desktop</strong>{' '}
                (Free, Pro, Max, Team, Enterprise):{' '}
                <strong className="text-white">Einstellungen → Connectors</strong> → „+" →{' '}
                <strong className="text-white">„Eigenen Connector hinzufügen"</strong> → obige URL
                eintragen → <strong className="text-white">Hinzufügen</strong>. Danach pro Chat über
                das „+"-Menü aktivieren. Claude verbindet sich aus der Anthropic-Cloud, der Server
                muss also öffentlich erreichbar sein — ist er.
              </p>
              <p className="mb-1">
                <strong className="text-white">Claude Code</strong> (CLI):
              </p>
              <pre className="bg-black/40 border border-white/10 rounded-lg p-4 text-xs text-white/90 font-mono overflow-x-auto mb-2">
                claude mcp add --transport http bundestag {MCP_ENDPOINT}
              </pre>
              <p className="mb-5 text-white/50">
                Ausführlich:{' '}
                <a
                  href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline"
                >
                  Custom Connectors (Claude Help Center)
                </a>{' '}
                ·{' '}
                <a
                  href="https://code.claude.com/docs/en/mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline"
                >
                  Claude Code MCP-Doku
                </a>
              </p>

              <h3 className="text-white font-semibold mt-4 mb-1">ChatGPT</h3>
              <p className="mb-2">
                Zuerst den <strong className="text-white">Entwicklermodus</strong> einschalten:{' '}
                <strong className="text-white">
                  Einstellungen → Connectors → Erweiterte Einstellungen → Entwicklermodus
                </strong>
                . Dann <strong className="text-white">Einstellungen → Connectors → „Erstellen"</strong>{' '}
                → Name und Beschreibung vergeben, obige URL als MCP-Server-URL eintragen →{' '}
                <strong className="text-white">Erstellen</strong>. Verfügbar auf allen Plänen (Plus,
                Pro, Business, Enterprise, Edu).
              </p>
              <p className="mb-5 text-white/50">
                Ausführlich:{' '}
                <a
                  href="https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline"
                >
                  Developer Mode &amp; MCP (OpenAI Help Center)
                </a>
              </p>

              <h3 className="text-white font-semibold mt-4 mb-1">Mistral / Le&nbsp;Chat</h3>
              <p className="mb-2">
                <strong className="text-white">Connectors</strong> →{' '}
                <strong className="text-white">„+ Add Connector"</strong> → Reiter{' '}
                <strong className="text-white">„Custom MCP Connector"</strong> → Name (ohne Leer- und
                Sonderzeichen) und obige URL als Server-URL → <strong className="text-white">Connect</strong>.
                Als Authentifizierung <strong className="text-white">„No authentication"</strong> wählen.
                Das Anlegen ist Admin-Sache; auf Free-/Pro-Konten bist du automatisch Admin.
              </p>
              <p className="mb-5 text-white/50">
                Ausführlich:{' '}
                <a
                  href="https://docs.mistral.ai/le-chat/knowledge-integrations/connectors/mcp-connectors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline"
                >
                  MCP Connectors (Mistral Docs)
                </a>
              </p>

              <p className="text-white/50">
                Grundsätzlich funktioniert jeder MCP-fähige Client mit
                Streamable-HTTP-Unterstützung — auch Cursor, VS Code u.&nbsp;a. Mehr zum Standard:{' '}
                <a
                  href="https://modelcontextprotocol.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline"
                >
                  modelcontextprotocol.io
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">
                Funktionen — über 30 Tools
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
                <li>„Fasse zusammen, was Robert Habeck zuletzt zum Klimaschutz gesagt hat."</li>
                <li>„Wer hat in der 87. Sitzung gesprochen — und worum ging es?"</li>
                <li>„Wie viele Gesetzentwürfe hat die AfD in dieser Wahlperiode eingebracht?"</li>
                <li>„Finde Passagen zum Ausbau der Windenergie an Land in aktuellen Gesetzentwürfen."</li>
                <li>„Erstelle ein Sprachprofil von Katharina Dröge — Themen, Ton und Lieblingswörter."</li>
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
