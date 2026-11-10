import { motion } from 'motion/react';
import { CodeBlock, DownloadLink } from './ui';
import { sentimentKeywordsPositive, sentimentKeywordsNegative } from './data';

export function ZwischenrufeSection() {
  return (
    <section className="border-t border-track bg-wr-card" id="zwischenrufanalyse">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.86, duration: 0.6 }}
        >
          <h2 className="text-xs font-mono text-on-muted uppercase tracking-wider mb-4">
            Zwischenrufanalyse
          </h2>
          <h3 className="text-2xl font-heading text-on mb-6">
            Erkennung von Zwischenrufen
          </h3>
          <p className="text-on-muted leading-relaxed mb-8">
            Das System erkennt Zwischenrufe (Unterbrechungen) in den Plenarprotokollen und
            analysiert, wer am häufigsten unterbricht und wer am häufigsten unterbrochen wird.
            Dies ermöglicht Einblicke in die parlamentarische Debattenkultur.
          </p>
        </motion.div>

        {/* Detection Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.87, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Erkennungsablauf</h4>
          <CodeBlock>
            <p className="text-on-muted">detect_interruption(protokoll_text)</p>
            <p className="pl-4 text-on-muted">├─ Suche Pattern: <span className="text-amber-400">(Name [PARTEI]: Text)</span></p>
            <p className="pl-4 text-on-muted">├─ Filtere Rauschen: Beifall, Zuruf, Lachen, Heiterkeit</p>
            <p className="pl-4 text-on-muted">├─ Prüfe Selbst-Unterbrechung (gleicher Nachname)</p>
            <p className="pl-4 text-on-muted">├─ Zähle für <span className="text-on-accent">Unterbrecher</span> (interruptions_made)</p>
            <p className="pl-4 text-on-muted">└─ Zähle für <span className="text-blue-400">Unterbrochene</span> (interruptions_received)</p>
          </CodeBlock>
        </motion.div>

        {/* Regex Pattern */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.88, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Erkennungsmuster</h4>
          <p className="text-sm text-on-muted mb-4">
            Zwischenrufe werden im Protokoll in einem standardisierten Format erfasst:
          </p>
          <div className="bg-wr-card border border-track rounded-lg overflow-hidden mb-4">
            <div className="bg-wr-card px-4 py-2 border-b border-track">
              <span className="text-xs font-mono text-on-muted">Regex Pattern</span>
            </div>
            <div className="p-4 font-mono text-sm overflow-x-auto">
              <code className="text-on">
                \(([A-ZÄÖÜ][^\[\]]{'{'}2,40{'}'})\s*\[([A-ZÄÖÜa-zäöü/\s]+)\]:[^)]+\)
              </code>
            </div>
          </div>
          <div className="bg-wr-card border border-track rounded-lg overflow-hidden">
            <div className="bg-wr-card px-4 py-2 border-b border-track">
              <span className="text-xs font-mono text-on-muted">Beispiele aus Protokollen</span>
            </div>
            <div className="p-4 font-mono text-sm space-y-2">
              <p className="text-on-muted">
                <span className="text-on-muted">(</span>
                <span className="text-on-accent">Dr. Alice Weidel</span>
                <span className="text-on-muted"> [</span>
                <span className="text-on">AfD</span>
                <span className="text-on-muted">]:</span>
                <span className="text-on-muted"> Das ist doch Unsinn!</span>
                <span className="text-on-muted">)</span>
              </p>
              <p className="text-on-muted">
                <span className="text-on-muted">(</span>
                <span className="text-on-accent">Beatrix von Storch</span>
                <span className="text-on-muted"> [</span>
                <span className="text-on">AfD</span>
                <span className="text-on-muted">]:</span>
                <span className="text-on-muted"> Hört, hört!</span>
                <span className="text-on-muted">)</span>
              </p>
              <p className="text-on-muted">
                <span className="text-on-muted">(</span>
                <span className="text-on-accent">Friedrich Merz</span>
                <span className="text-on-muted"> [</span>
                <span className="text-on">CDU/CSU</span>
                <span className="text-on-muted">]:</span>
                <span className="text-on-muted"> Wie bitte?</span>
                <span className="text-on-muted">)</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Noise Filtering */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.89, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Rauschfilterung</h4>
          <p className="text-sm text-on-muted mb-4">
            Nicht alle Klammern im Protokoll sind Zwischenrufe. Folgende Muster werden herausgefiltert:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-wr-card border border-track rounded-lg p-4">
              <div className="text-xs font-mono text-on uppercase tracking-wider mb-2">
                Wird ignoriert
              </div>
              <ul className="text-sm text-on-muted space-y-1 font-mono">
                <li>• (Beifall bei der SPD)</li>
                <li>• (Zuruf von der CDU/CSU)</li>
                <li>• (Lachen bei den GRÜNEN)</li>
                <li>• (Heiterkeit)</li>
                <li>• (Widerspruch bei der AfD)</li>
              </ul>
            </div>
            <div className="bg-wr-card border border-track rounded-lg p-4">
              <div className="text-xs font-mono text-on uppercase tracking-wider mb-2">
                Wird gezählt
              </div>
              <ul className="text-sm text-on-muted space-y-1 font-mono">
                <li>• (Name [PARTEI]: Text)</li>
                <li>• Direkte Zwischenrufe</li>
                <li>• Namentlich zuordenbar</li>
                <li>• Mit Partei-Zuordnung</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Two Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.90, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Zwei Perspektiven</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-track bg-wr-card rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-wr-pink" />
                <span className="font-medium text-on">Top Zwischenrufer</span>
              </div>
              <p className="text-sm text-on-muted mb-3">
                Wer ruft am häufigsten dazwischen während anderer Reden?
              </p>
              <code className="text-xs bg-wr-card px-2 py-1 rounded text-on-muted border border-track">
                interruptions_made
              </code>
            </div>
            <div className="border border-track bg-wr-card rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-medium text-on">Meistens unterbrochen</span>
              </div>
              <p className="text-sm text-on-muted mb-3">
                Wer wird am häufigsten während der eigenen Rede von anderen unterbrochen?
              </p>
              <code className="text-xs bg-wr-card px-2 py-1 rounded text-on-muted border border-track">
                interruptions_received
              </code>
            </div>
          </div>
        </motion.div>

        {/* Sentiment Classification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.91, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Sentiment-Klassifikation</h4>
          <p className="text-sm text-on-muted mb-6">
            Jeder Zwischenruf wird anhand von Schlüsselwörtern als <strong className="text-on">Zustimmung</strong>,
            <strong className="text-on"> Kritik</strong> oder <strong className="text-on-muted">Neutral</strong> klassifiziert.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-wr-card border border-track rounded-lg p-4">
              <div className="text-xs font-mono text-on uppercase tracking-wider mb-3">
                Zustimmung (~18%)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sentimentKeywordsPositive.map(word => (
                  <span key={word} className="text-xs bg-wr-card text-on px-2 py-0.5 rounded font-mono">
                    {word}
                  </span>
                ))}
                <span className="text-xs text-emerald-500">+30 weitere</span>
              </div>
            </div>
            <div className="bg-wr-card border border-track rounded-lg p-4">
              <div className="text-xs font-mono text-on uppercase tracking-wider mb-3">
                Kritik (~12%)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sentimentKeywordsNegative.map(word => (
                  <span key={word} className="text-xs bg-wr-card text-on px-2 py-0.5 rounded font-mono">
                    {word}
                  </span>
                ))}
                <span className="text-xs text-red-500">+35 weitere</span>
              </div>
            </div>
          </div>

          <div className="bg-wr-card border border-track rounded-lg p-4 mb-6">
            <div className="text-xs font-mono text-on-muted uppercase tracking-wider mb-2">
              Neutral (~70%)
            </div>
            <p className="text-sm text-on-muted">
              Fragen ("Was?", "Wie bitte?"), Kommentare, thematische Einwürfe ("Infrastruktur!")
              und alles, was nicht eindeutig zugeordnet werden kann.
            </p>
          </div>

          <div className="bg-wr-card border border-track rounded-lg overflow-hidden">
            <div className="bg-wr-card px-4 py-2 border-b border-track">
              <span className="text-xs font-mono text-on-muted">Ranking-Formel (Quiz)</span>
            </div>
            <div className="p-4">
              <code className="text-sm font-mono text-on-muted">
                score = absolute_count × √(total_count)
              </code>
              <p className="text-xs text-on-muted mt-2">
                Gewichtet sowohl absolute Anzahl als auch Gesamtaktivität –
                nur Personen mit ≥50 Zwischenrufen werden berücksichtigt.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Download Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.92, duration: 0.6 }}
        >
          <h4 className="font-medium text-on mb-4">Daten herunterladen</h4>
          <p className="text-sm text-on-muted mb-4">
            Die JSON-Dateien enthalten pro Person: <code className="text-xs bg-wr-card px-1 rounded">count</code>,
            <code className="text-xs bg-wr-card text-on px-1 rounded">positive</code>,
            <code className="text-xs bg-wr-card text-on px-1 rounded">negative</code>,
            <code className="text-xs bg-wr-card px-1 rounded">neutral</code>
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <DownloadLink
              href="/zwischenrufer.json"
              title="Top Zwischenrufer"
              description="Personen mit Sentiment-Klassifikation (pos/neg/neutral)"
              color="pink"
            />
            <DownloadLink
              href="/interrupted.json"
              title="Meistens unterbrochen"
              description="Vollständige Rangliste aller Unterbrochenen"
              color="blue"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
