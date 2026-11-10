import { motion } from 'motion/react';

export function GenderAnalysisSection() {
  return (
    <section className="border-t border-track" id="geschlechteranalyse">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
        >
          <h2 className="text-xs font-mono text-on-muted uppercase tracking-wider mb-4">
            Geschlechteranalyse
          </h2>
          <h3 className="text-2xl font-heading text-on mb-6">
            Redezeit und Unterbrechungen nach Geschlecht
          </h3>
          <p className="text-on-muted leading-relaxed mb-8">
            Das Geschlecht wird anhand der Vornamen erkannt (100% Erkennungsrate durch
            kuratierte Namenslisten). Dies ermöglicht Analysen zu Redebeteiligung,
            Wortlängen und Unterbrechungsmustern.
          </p>
        </motion.div>

        {/* Speech Length */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.87, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Durchschnittliche Redelänge</h4>
          <p className="text-sm text-on-muted mb-4">
            Gemessen in Wörtern pro Rede. Berechnung: Gesamtzahl aller Wörter eines
            Geschlechts geteilt durch Anzahl der Reden.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-track bg-wr-card rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-medium text-on">Männliche Redner:innen</span>
              </div>
              <div className="text-3xl font-mono text-on mb-1">416</div>
              <div className="text-sm text-on-muted">Wörter pro Rede (Durchschnitt)</div>
            </div>
            <div className="border border-track bg-wr-card rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-wr-pink" />
                <span className="font-medium text-on">Weibliche Redner:innen</span>
              </div>
              <div className="text-3xl font-mono text-on-accent mb-1">395</div>
              <div className="text-sm text-on-muted">Wörter pro Rede (Durchschnitt)</div>
            </div>
          </div>
          <div className="mt-4 bg-wr-card rounded-lg p-4">
            <p className="text-sm text-on-muted">
              <strong>Differenz:</strong> Männliche Redner:innen sprechen im Schnitt ~5% länger
              (21 Wörter mehr pro Rede).
            </p>
          </div>
        </motion.div>

        {/* Interruption Patterns - Simplified */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.89, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Unterbrechungsmuster</h4>
          <p className="text-sm text-on-muted mb-4">
            Gezählt werden Zwischenrufe aus dem Plenum. Jeder dokumentierte Zwischenruf
            im Protokoll wird der:dem Unterbrecher:in und der:dem unterbrochenen Redner:in zugeordnet.
          </p>

          {/* Key Finding */}
          <div className="bg-wr-card border border-track rounded-lg p-5">
            <h5 className="font-medium text-on mb-2">Zentrale Erkenntnis</h5>
            <p className="text-sm text-on">
              Frauen machen etwa <strong>30%</strong> der Zwischenrufe, erhalten aber einen höheren
              Anteil der Unterbrechungen relativ zu ihrer Redebeteiligung. Männer unterbrechen
              häufiger als sie selbst unterbrochen werden.
            </p>
          </div>
        </motion.div>

        {/* Methodology */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.91, duration: 0.6 }}
        >
          <h4 className="font-medium text-on mb-4">Methodik</h4>
          <div className="bg-wr-ink border border-track rounded-xl p-6 text-on font-mono text-sm">
            <p className="text-on-muted mb-2"># Redelänge pro Geschlecht</p>
            <p className="text-emerald-400">avg_words[gender] = total_words[gender] / total_speeches[gender]</p>
            <p className="text-on-muted mt-4 mb-2"># Unterbrechungsrate</p>
            <p className="text-emerald-400">interruption_ratio[gender] = made[gender] / received[gender]</p>
            <p className="text-on-muted mt-4 mb-2"># Geschlechtserkennung</p>
            <p className="text-amber-400">detect(vorname) → Lookup in FEMALE_NAMES, MALE_NAMES, OVERRIDES</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
