import { motion } from 'motion/react';
import { InfoIcon } from './ui';

const TOPICS_DATA = [
  { id: 'migration', emoji: '🌍', name: 'Migration', desc: 'Flucht, Asyl, Einwanderung', color: 'amber', keywords: ['asyl', 'flüchtling', 'abschiebung', 'integration', 'grenzschutz'] },
  { id: 'klima', emoji: '🌱', name: 'Klima & Umwelt', desc: 'Klimaschutz, Energie, Nachhaltigkeit', color: 'green', keywords: ['klimaschutz', 'energiewende', 'emissionen', 'windkraft', 'nachhaltigkeit'] },
  { id: 'wirtschaft', emoji: '📈', name: 'Wirtschaft', desc: 'Unternehmen, Industrie, Handel', color: 'blue', keywords: ['unternehmen', 'wettbewerb', 'export', 'mittelstand', 'konjunktur'] },
  { id: 'soziales', emoji: '🤝', name: 'Soziales', desc: 'Rente, Familie, Armut', color: 'pink', keywords: ['rente', 'armut', 'familie', 'bürgergeld', 'wohnung'] },
  { id: 'sicherheit', emoji: '🛡️', name: 'Sicherheit', desc: 'Polizei, Verteidigung, Terrorismus', color: 'indigo', keywords: ['polizei', 'bundeswehr', 'terrorismus', 'nato', 'kriminalität'] },
  { id: 'gesundheit', emoji: '🏥', name: 'Gesundheit', desc: 'Krankenhaus, Pflege, Medizin', color: 'teal', keywords: ['krankenhaus', 'pflege', 'medikament', 'impfung', 'krankenkasse'] },
  { id: 'europa', emoji: '🇪🇺', name: 'Europa/Außen', desc: 'EU, Außenpolitik, Ukraine', color: 'violet', keywords: ['europa', 'ukraine', 'sanktion', 'außenpolitik', 'eu-kommission'] },
  { id: 'digital', emoji: '💻', name: 'Digitales & Medien', desc: 'Internet, Daten, Technologie', color: 'cyan', keywords: ['digitalisierung', 'datenschutz', 'künstliche-intelligenz', 'cybersicherheit', 'breitband'] },
  { id: 'bildung', emoji: '🎓', name: 'Bildung', desc: 'Schule, Universität, Forschung', color: 'orange', keywords: ['schule', 'universität', 'ausbildung', 'forschung', 'bafög'] },
  { id: 'finanzen', emoji: '💰', name: 'Finanzen', desc: 'Steuern, Haushalt, Schulden', color: 'yellow', keywords: ['steuer', 'haushalt', 'schulden', 'schuldenbremse', 'subvention'] },
  { id: 'justiz', emoji: '⚖️', name: 'Justiz/Recht', desc: 'Gerichte, Gesetze, Verfassung', color: 'stone', keywords: ['gericht', 'grundgesetz', 'strafrecht', 'verfassung', 'rechtsstaat'] },
  { id: 'arbeit', emoji: '👷', name: 'Arbeit', desc: 'Lohn, Gewerkschaft, Beschäftigung', color: 'lime', keywords: ['mindestlohn', 'gewerkschaft', 'arbeitslosigkeit', 'tarifvertrag', 'arbeitsplatz'] },
  { id: 'mobilitaet', emoji: '🚆', name: 'Mobilität', desc: 'Verkehr, Bahn, Auto, ÖPNV', color: 'sky', keywords: ['bahn', 'öpnv', 'autobahn', 'elektromobilität', 'deutschlandticket'] },
];

const MULTI_LABEL_EXAMPLES = [
  { word: 'pflege', topics: ['Gesundheit', 'Soziales'], reason: 'Überschneidung zwischen medizinischer Versorgung und sozialer Absicherung' },
  { word: 'ukraine', topics: ['Europa/Außen', 'Sicherheit'], reason: 'Außenpolitisches Thema mit sicherheitspolitischer Dimension' },
  { word: 'energie', topics: ['Klima', 'Wirtschaft'], reason: 'Energiewende als Klimaschutz und Wirtschaftsfaktor' },
  { word: 'kita', topics: ['Soziales', 'Bildung'], reason: 'Kinderbetreuung als soziale Unterstützung und frühkindliche Bildung' },
];

export function TopicsSection() {
  return (
    <section className="border-t border-track bg-wr-card" id="topics">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
        >
          <h2 className="text-xs font-mono text-on-muted uppercase tracking-wider mb-4">
            Themenanalyse
          </h2>
          <h3 className="text-2xl font-heading text-on mb-6">
            13 Politische Themenfelder
          </h3>
          <p className="text-on-muted leading-relaxed mb-8">
            Die Themenanalyse (Scheme F) kategorisiert Bundestagsreden anhand von Substantiven
            in 13 politische Themenfelder. Jedes Thema wird durch ein Lexikon relevanter Begriffe
            definiert, die automatisch in den Redetexten erkannt werden.
          </p>
        </motion.div>

        {/* Method overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.86, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Methodik</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-wr-card rounded-lg p-4 border border-track">
              <div className="w-8 h-8 rounded-full bg-wr-ink border border-track text-on flex items-center justify-center text-sm font-mono mb-3">1</div>
              <div className="text-sm font-medium text-on mb-1">Substantive extrahieren</div>
              <p className="text-xs text-on-muted">
                spaCy identifiziert und lemmatisiert alle Substantive aus dem Redetext.
              </p>
            </div>
            <div className="bg-wr-card rounded-lg p-4 border border-track">
              <div className="w-8 h-8 rounded-full bg-wr-ink border border-track text-on flex items-center justify-center text-sm font-mono mb-3">2</div>
              <div className="text-sm font-medium text-on mb-1">Lexikon-Matching</div>
              <p className="text-xs text-on-muted">
                Jedes Substantiv wird gegen 13 themenspezifische Lexika abgeglichen.
              </p>
            </div>
            <div className="bg-wr-card rounded-lg p-4 border border-track">
              <div className="w-8 h-8 rounded-full bg-wr-ink border border-track text-on flex items-center justify-center text-sm font-mono mb-3">3</div>
              <div className="text-sm font-medium text-on mb-1">Normalisierung</div>
              <p className="text-xs text-on-muted">
                Scores werden pro 1.000 Wörter berechnet für Vergleichbarkeit zwischen Fraktionen.
              </p>
            </div>
          </div>
        </motion.div>

        {/* 13 Topics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.87, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Die 13 Themenfelder</h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TOPICS_DATA.map((topic) => (
              <div
                key={topic.id}
                className="border border-track rounded-lg p-4 hover:border-track transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{topic.emoji}</span>
                  <span className="font-medium text-on">{topic.name}</span>
                </div>
                <p className="text-xs text-on-muted mb-3">{topic.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {topic.keywords.slice(0, 3).map((kw) => (
                    <span
                      key={kw}
                      className="px-1.5 py-0.5 bg-wr-card text-on-muted text-xs rounded"
                    >
                      {kw}
                    </span>
                  ))}
                  <span className="px-1.5 py-0.5 text-on-muted text-xs">
                    +{topic.keywords.length > 3 ? '...' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-on-muted mt-4">
            Jedes Lexikon enthält 30-100+ relevante Begriffe. Die vollständige Liste ist in{' '}
            <code className="bg-wr-card px-1.5 py-0.5 rounded">src/noun_analysis/lexicons/topics.py</code> definiert.
          </p>
        </motion.div>

        {/* Lexicon structure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.88, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Lexikon-Struktur</h4>
          <p className="text-sm text-on-muted mb-4">
            Die Lexika sind kuratiert und enthalten sowohl Kernbegriffe als auch institutionelle
            und politikspezifische Termini:
          </p>
          <div className="bg-wr-ink border border-track rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <p className="text-on-muted"># Beispiel: Migration-Lexikon</p>
            <p className="text-emerald-400">TOPIC_LEXICONS<span className="text-on">[</span><span className="text-amber-400">TopicCategory.MIGRATION</span><span className="text-on">] = {'{'}</span></p>
            <p className="text-on-muted ml-4"># Kernbegriffe</p>
            <p className="text-sky-400 ml-4">"migration", "asyl", "flüchtling", "einwanderung",</p>
            <p className="text-on-muted ml-4"># Institutionen</p>
            <p className="text-sky-400 ml-4">"bamf", "frontex", "ankerzentrum",</p>
            <p className="text-on-muted ml-4"># Policy-Begriffe</p>
            <p className="text-sky-400 ml-4">"familiennachzug", "dublin", "abschiebung",</p>
            <p className="text-on-muted ml-4"># ~60 weitere Begriffe...</p>
            <p className="text-on">{'}'}</p>
          </div>
        </motion.div>

        {/* Multi-label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.89, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Multi-Label-Zuordnung</h4>
          <p className="text-sm text-on-muted mb-4">
            Einige Begriffe gehören zu mehreren Themenfeldern. Diese werden mit gewichteter
            Zuordnung erfasst:
          </p>

          <div className="space-y-3">
            {MULTI_LABEL_EXAMPLES.map((ex) => (
              <div key={ex.word} className="flex items-start gap-4 bg-wr-card rounded-lg p-3 border border-track">
                <code className="px-2 py-1 bg-wr-ink border border-track text-on text-xs rounded font-mono shrink-0">
                  {ex.word}
                </code>
                <div>
                  <div className="flex gap-2 mb-1">
                    {ex.topics.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-wr-card text-on-muted text-xs rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-on-muted">{ex.reason}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-wr-ink border border-track rounded-lg p-4 font-mono text-sm">
            <p className="text-on-muted"># Multi-Label mit Gewichtung</p>
            <p className="text-emerald-400">TOPIC_MULTI_LABEL<span className="text-on">[</span><span className="text-amber-400">"pflege"</span><span className="text-on">] = [</span></p>
            <p className="text-sky-400 ml-4">(TopicCategory.GESUNDHEIT, <span className="text-amber-400">1.0</span>),</p>
            <p className="text-sky-400 ml-4">(TopicCategory.SOZIALES, <span className="text-amber-400">0.7</span>),</p>
            <p className="text-on">]</p>
          </div>
        </motion.div>

        {/* Score calculation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.90, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Score-Berechnung</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-wr-card rounded-lg p-4 border border-track">
              <div className="text-xs font-mono text-on-muted uppercase tracking-wider mb-3">
                Absoluter Score
              </div>
              <code className="text-sm text-on">
                score = topic_nouns / total_words × 1000
              </code>
              <p className="text-xs text-on-muted mt-2">
                Anzahl themenrelevanter Substantive pro 1.000 Wörter Redetext.
              </p>
            </div>
            <div className="bg-wr-card rounded-lg p-4 border border-track">
              <div className="text-xs font-mono text-on-muted uppercase tracking-wider mb-3">
                Relativer Score
              </div>
              <code className="text-sm text-on">
                ratio = party_score / avg_score
              </code>
              <p className="text-xs text-on-muted mt-2">
                Wie stark fokussiert eine Fraktion ein Thema im Vergleich zum Durchschnitt?
              </p>
            </div>
          </div>
        </motion.div>

        {/* Interpretation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.91, duration: 0.6 }}
        >
          <h4 className="font-medium text-on mb-4">Interpretation</h4>
          <div className="bg-wr-card border border-track rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <InfoIcon />
              <div>
                <div className="text-sm font-medium text-on mb-1">Wichtiger Hinweis</div>
                <p className="text-sm text-on">
                  Die Themenanalyse zeigt, <strong>wie oft</strong> Fraktionen über Themen sprechen,
                  nicht <strong>wie</strong> sie darüber sprechen. Ein hoher Migrations-Score bedeutet
                  häufiges Thematisieren, nicht zwingend eine bestimmte Position.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-on-muted mb-4">
            Beispielhafte Schwerpunkte aus den Daten:
          </p>
          <ul className="text-sm text-on-muted space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-on">•</span>
              <span><strong>GRÜNE</strong> fokussieren auf Klima & Umwelt (1,4× über Durchschnitt)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-on">•</span>
              <span><strong>DIE LINKE</strong> fokussiert auf Soziales (1,8× über Durchschnitt)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-on">•</span>
              <span><strong>AfD</strong> fokussiert auf Justiz/Recht und Migration</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-on-muted">•</span>
              <span><strong>Finanzen</strong> ist das #1 Thema aller Fraktionen (Haushaltsdebatte)</span>
            </li>
          </ul>

          <p className="text-xs text-on-muted mt-6">
            Quelldatei: <code className="bg-wr-card px-1.5 py-0.5 rounded">src/noun_analysis/lexicons/topics.py</code>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
