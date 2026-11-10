import { motion } from 'motion/react';
import { CodeBlock } from './ui';

export function BefragungSection() {
  return (
    <section className="border-t border-track" id="befragung-klassifikation">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
        >
          <h2 className="text-xs font-mono text-on-muted uppercase tracking-wider mb-4">
            Regierungsbefragung
          </h2>
          <h3 className="text-2xl font-heading text-on mb-6">
            Session-basierte Klassifikation
          </h3>
          <p className="text-on-muted leading-relaxed mb-8">
            Um formelle Reden von Antworten in der Regierungsbefragung zu unterscheiden, erkennt
            der Algorithmus <strong>Session-Grenzen</strong> im Protokolltext. Regierungsmitglieder
            (Bundeskanzler, Minister, Staatssekretäre) werden nur dann als "Befragung" klassifiziert,
            wenn sie innerhalb einer erkannten Q&A-Session sprechen.
          </p>
        </motion.div>

        {/* Problem Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.56, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Das Problem</h4>
          <div className="bg-wr-card border border-track rounded-lg p-4 mb-4">
            <p className="text-sm text-on">
              <strong>Beispiel:</strong> Friedrich Merz hatte ursprünglich 98 "Reden" – aber nur
              12 davon waren tatsächliche Plenarvorträge. Die restlichen 86 waren Antworten auf
              Abgeordnetenfragen in der Regierungsbefragung.
            </p>
          </div>
          <p className="text-sm text-on-muted">
            Regierungsmitglieder sprechen im Format <code className="px-1.5 py-0.5 bg-wr-card rounded text-xs">Name, Rolle:</code> statt
            <code className="px-1.5 py-0.5 bg-wr-card rounded text-xs mx-1">Name (Partei):</code> –
            ohne Session-Erkennung würden alle ihre Beiträge als formelle Reden gezählt.
          </p>
        </motion.div>

        {/* Session Detection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.57, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Session-Erkennung</h4>
          <div className="bg-wr-ink border border-track rounded-xl p-6 text-on font-mono text-sm mb-4">
            <div className="space-y-2">
              <p className="text-on-muted"># Erkannte Session-Typen</p>
              <p className="text-emerald-400">BEFRAGUNG_START: <span className="text-on">"Befragung der Bundesregierung"</span></p>
              <p className="text-emerald-400">REGIERUNGSBEFRAGUNG: <span className="text-on">"Regierungsbefragung"</span></p>
              <p className="text-red-400">SESSION_END: <span className="text-on">"schließe ich die Befragung"</span></p>
              <p className="text-on-muted mt-4"># Position-basierte Zuordnung</p>
              <p className="text-amber-400">IF <span className="text-on">speech_position</span> BETWEEN <span className="text-on">session_start</span> AND <span className="text-on">session_end</span>:</p>
              <p className="pl-4 text-on-muted">→ type = <span className="text-emerald-400">"befragung"</span></p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-wr-card border border-track rounded-lg p-4">
              <div className="text-xs font-mono text-on-muted uppercase tracking-wider mb-2">
                Session-Start (Beispiel)
              </div>
              <p className="text-sm text-on-muted font-mono">
                "Ich rufe auf den Tagesordnungspunkt 1:<br/>
                <span className="text-on font-semibold">Befragung der Bundesregierung</span>"
              </p>
            </div>
            <div className="bg-wr-card border border-track rounded-lg p-4">
              <div className="text-xs font-mono text-on-muted uppercase tracking-wider mb-2">
                Session-Ende (Beispiel)
              </div>
              <p className="text-sm text-on-muted font-mono">
                "Hiermit <span className="text-on font-semibold">schließe ich die Befragung</span><br/>
                der Bundesregierung."
              </p>
            </div>
          </div>
        </motion.div>

        {/* Classification Logic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Klassifikationslogik</h4>
          <CodeBlock note="Formelle Reden und Befragungsantworten werden separat gezählt und in den Speaker-Profilen unterschieden.">
            <p className="text-on-muted"># Für Regierungsmitglieder</p>
            <p className="text-emerald-400">IF <span className="text-on">is_government_official</span> AND <span className="text-on">in_qa_session</span>:</p>
            <p className="pl-4 text-on-muted">→ type = <span className="text-sky-400">"befragung"</span> <span className="text-on-muted"># Q&A-Antwort</span></p>
            <p className="text-amber-400">ELIF <span className="text-on">is_government_official</span>:</p>
            <p className="pl-4 text-on-muted">→ type = <span className="text-emerald-400">"rede"</span> <span className="text-on-muted"># Formelle Rede</span></p>
          </CodeBlock>
        </motion.div>

        {/* Data Fields */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.59, duration: 0.6 }}
        >
          <h4 className="font-medium text-on mb-4">Neue Datenfelder</h4>
          <p className="text-sm text-on-muted mb-4">
            Im Speaker-JSON werden beide Metriken separat ausgewiesen:
          </p>
          <div className="bg-wr-card border border-track rounded-lg overflow-hidden">
            <div className="bg-wr-card px-4 py-2 border-b border-track">
              <span className="text-xs font-mono text-on-muted">friedrich-merz.json</span>
            </div>
            <div className="p-4 font-mono text-sm">
              <p className="text-on-muted">{'{'}</p>
              <p className="pl-4 text-on-muted">"name": <span className="text-on">"Friedrich Merz"</span>,</p>
              <p className="pl-4 text-on-muted">"speeches": <span className="text-on">12</span>, <span className="text-on-muted">// Formelle Reden</span></p>
              <p className="pl-4 text-on-muted">"befragungResponses": <span className="text-on">86</span>, <span className="text-on-muted">// Q&A-Antworten</span></p>
              <p className="pl-4 text-on-muted">"totalWords": <span className="text-on">37752</span></p>
              <p className="text-on-muted">{'}'}</p>
            </div>
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <a
              href="/wrapped.json"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-wr-card border border-track rounded-lg hover:border-track hover:bg-bg-elevated transition-colors group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-sky-500" />
                  <span className="font-medium text-on">Top Befragung-Responder</span>
                </div>
                <p className="text-xs text-on-muted">topBefragungResponders in wrapped.json</p>
              </div>
              <div className="flex items-center gap-2 text-on-muted group-hover:text-on">
                <span className="text-xs font-mono">JSON</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
            <div className="bg-wr-card border border-track rounded-lg p-4">
              <div className="text-xs font-mono text-on-muted uppercase tracking-wider mb-2">
                Top 3 Befragung-Responder
              </div>
              <ol className="text-sm text-on-muted space-y-1">
                <li>1. Friedrich Merz (CDU/CSU) – 86</li>
                <li>2. Lars Klingbeil (SPD) – 79</li>
                <li>3. Frank Schwabe (SPD) – 62</li>
              </ol>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
