import { motion } from 'motion/react';
import { CodeBlock, InfoIcon } from './ui';

export function SignatureWordsSection() {
  return (
    <section className="border-t border-track bg-wr-card" id="signature-words">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.6 }}
        >
          <h2 className="text-xs font-mono text-on-muted uppercase tracking-wider mb-4">
            Wortanalyse
          </h2>
          <h3 className="text-2xl font-heading text-on mb-6">
            Signature Words
          </h3>
          <p className="text-on-muted leading-relaxed mb-8">
            Signature Words sind Begriffe, die ein Sprecher oder eine Fraktion
            signifikant häufiger verwendet als der Durchschnitt. Sie zeigen thematische
            Schwerpunkte und sprachliche Eigenheiten auf.
          </p>
        </motion.div>

        {/* Formula */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.96, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Berechnung</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-mono text-on-muted uppercase tracking-wider mb-3">
                Für Abgeordnete
              </div>
              <div className="bg-wr-card rounded-lg p-4 border border-track">
                <code className="text-sm text-on">
                  ratio = speaker_freq / party_freq
                </code>
                <p className="text-xs text-on-muted mt-2">
                  Wie oft nutzt der Sprecher ein Wort im Vergleich zum Fraktionsdurchschnitt?
                </p>
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-on-muted uppercase tracking-wider mb-3">
                Für Fraktionen
              </div>
              <div className="bg-wr-card rounded-lg p-4 border border-track">
                <code className="text-sm text-on">
                  ratio = party_freq / others_avg
                </code>
                <p className="text-xs text-on-muted mt-2">
                  Wie oft nutzt die Fraktion ein Wort im Vergleich zu allen anderen?
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Algorithm */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.97, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Algorithmus</h4>
          <p className="text-sm text-on-muted mb-4">
            Der Algorithmus kombiniert drei Mechanismen, um aussagekräftige Signature Words zu identifizieren:
          </p>

          <div className="space-y-4">
            <div className="bg-wr-card border border-track rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 rounded-full bg-wr-ink border border-track text-on flex items-center justify-center text-xs font-mono">1</div>
                <span className="font-medium text-on">Prozentualer Schwellenwert</span>
              </div>
              <p className="text-sm text-on-muted ml-9">
                Nur Wörter mit mindestens <strong>0,05%</strong> aller Wörter der Fraktion werden berücksichtigt.
                Dieser Schwellenwert skaliert automatisch mit der Redezeit (CDU: ~65 Nennungen, LINKE: ~25).
              </p>
            </div>

            <div className="bg-wr-card border border-track rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 rounded-full bg-wr-ink border border-track text-on flex items-center justify-center text-xs font-mono">2</div>
                <span className="font-medium text-on">Stopwort-Filter</span>
              </div>
              <p className="text-sm text-on-muted ml-9">
                Zwei Kategorien werden ausgeschlossen:
              </p>
              <div className="ml-9 mt-2 grid md:grid-cols-2 gap-3">
                <div className="bg-wr-card rounded p-3">
                  <div className="text-xs font-mono text-on-muted mb-1">Event-Stopwords</div>
                  <div className="text-xs text-on-muted">
                    afghanistan, ortskräfte, aufnahmezusage...
                  </div>
                </div>
                <div className="bg-wr-card rounded p-3">
                  <div className="text-xs font-mono text-on-muted mb-1">Partei-Stopwords</div>
                  <div className="text-xs text-on-muted">
                    spd-fraktion, sozialdemokrat, cdu-fraktion...
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-wr-card border border-track rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 rounded-full bg-wr-ink border border-track text-on flex items-center justify-center text-xs font-mono">3</div>
                <span className="font-medium text-on">Balanced Score</span>
              </div>
              <p className="text-sm text-on-muted ml-9 mb-2">
                Die Rangfolge basiert auf einem kombinierten Score:
              </p>
              <div className="ml-9 bg-wr-ink border border-track rounded p-3 font-mono text-sm">
                <span className="text-emerald-400">score</span>
                <span className="text-on"> = </span>
                <span className="text-amber-400">ratio</span>
                <span className="text-on"> × </span>
                <span className="text-blue-400">√</span>
                <span className="text-on-muted">(</span>
                <span className="text-amber-400">per1000</span>
                <span className="text-on-muted">)</span>
              </div>
              <p className="text-xs text-on-muted ml-9 mt-2">
                Die Wurzel der Frequenz (per1000) dämpft den Einfluss der Häufigkeit,
                sodass seltene aber hochdistinktive Wörter (wie "altpartei" für AfD) nicht untergehen,
                aber häufig genutzte Wörter einen Bonus erhalten.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Why this formula? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.975, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Warum diese Formel?</h4>
          <p className="text-sm text-on-muted mb-4">
            Das Problem: Weder reine Distinktivität (ratio) noch reine Häufigkeit (per1000) liefern
            gute Ergebnisse. Die Wurzel-Formel findet die Balance.
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-track">
                  <th className="text-left py-2 pr-4 font-medium text-on-muted">Formel</th>
                  <th className="text-left py-2 px-4 font-medium text-on-muted">Problem</th>
                  <th className="text-left py-2 pl-4 font-medium text-on-muted">Beispiel</th>
                </tr>
              </thead>
              <tbody className="text-on-muted">
                <tr className="border-b border-track">
                  <td className="py-3 pr-4 font-mono text-xs">ratio</td>
                  <td className="py-3 px-4">Seltene Wörter dominieren</td>
                  <td className="py-3 pl-4 text-xs">"ip-adresse" (21×, nur 16 Nennungen)</td>
                </tr>
                <tr className="border-b border-track">
                  <td className="py-3 pr-4 font-mono text-xs">per1000</td>
                  <td className="py-3 px-4">Generische Wörter dominieren</td>
                  <td className="py-3 pl-4 text-xs">"mensch", "land", "frage"</td>
                </tr>
                <tr className="border-b border-track">
                  <td className="py-3 pr-4 font-mono text-xs">ratio × per1000</td>
                  <td className="py-3 px-4">Häufigkeit übersteuert</td>
                  <td className="py-3 pl-4 text-xs">"deutschland" statt "altpartei"</td>
                </tr>
                <tr className="bg-wr-card">
                  <td className="py-3 pr-4 font-mono text-xs text-on">ratio × √per1000</td>
                  <td className="py-3 px-4 text-on">Balanciert beide Faktoren</td>
                  <td className="py-3 pl-4 text-xs text-on">"altpartei" für AfD ✓</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-wr-card rounded-lg p-4 border border-track">
            <div className="text-xs font-mono text-on-muted uppercase tracking-wider mb-3">
              Mathematische Intuition
            </div>
            <p className="text-sm text-on-muted mb-3">
              Die Wurzel <strong>dämpft</strong> den Frequenz-Einfluss logarithmisch:
            </p>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-wr-card rounded p-2 border border-track">
                <div className="font-mono text-on-muted">per1000 = 1</div>
                <div className="text-on-muted">√1 = 1</div>
              </div>
              <div className="bg-wr-card rounded p-2 border border-track">
                <div className="font-mono text-on-muted">per1000 = 4</div>
                <div className="text-on-muted">√4 = 2 <span className="text-on">(nicht 4×)</span></div>
              </div>
              <div className="bg-wr-card rounded p-2 border border-track">
                <div className="font-mono text-on-muted">per1000 = 16</div>
                <div className="text-on-muted">√16 = 4 <span className="text-on">(nicht 16×)</span></div>
              </div>
            </div>
            <p className="text-xs text-on-muted mt-3">
              Ein 16× häufigeres Wort bekommt nur 4× mehr Gewicht – nicht 16×.
              So können seltene aber hochdistinktive Begriffe mithalten.
            </p>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.978, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Ergebnisse</h4>
          <p className="text-sm text-on-muted mb-4">
            Mit der balancierten Formel zeigt jede Fraktion charakteristische ideologische Begriffe:
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-4 bg-wr-card rounded-lg p-3 border border-track">
              <div className="w-20 text-xs font-medium text-on-muted">CDU/CSU</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-wr-ink border border-track text-on text-xs rounded">wettbewerbsfähigkeit</span>
                <span className="px-2 py-1 bg-wr-card text-on-muted text-xs rounded">europa</span>
                <span className="px-2 py-1 bg-wr-card text-on-muted text-xs rounded">wachstum</span>
                <span className="px-2 py-1 bg-wr-card text-on-muted text-xs rounded">marktwirtschaft</span>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-wr-card rounded-lg p-3 border border-track">
              <div className="w-20 text-xs font-medium text-on">AfD</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-600 text-on text-xs rounded">altpartei <span className="opacity-70">82×</span></span>
                <span className="px-2 py-1 bg-wr-card text-on text-xs rounded">steuerzahler</span>
                <span className="px-2 py-1 bg-wr-card text-on text-xs rounded">bürger</span>
                <span className="px-2 py-1 bg-wr-card text-on text-xs rounded">steuergeld</span>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-wr-card rounded-lg p-3 border border-track">
              <div className="w-20 text-xs font-medium text-on">SPD</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-red-600 text-on text-xs rounded">zusammenhalt</span>
                <span className="px-2 py-1 bg-wr-card text-on text-xs rounded">arbeitsplatz</span>
                <span className="px-2 py-1 bg-wr-card text-on text-xs rounded">zusammenarbeit</span>
                <span className="px-2 py-1 bg-wr-card text-on text-xs rounded">signal</span>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-wr-card rounded-lg p-3 border border-track">
              <div className="w-20 text-xs font-medium text-on">GRÜNE</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-emerald-600 text-on text-xs rounded">klimakrise</span>
                <span className="px-2 py-1 bg-wr-card text-on text-xs rounded">rechtsextreme</span>
                <span className="px-2 py-1 bg-wr-card text-on text-xs rounded">lücke</span>
                <span className="px-2 py-1 bg-wr-card text-on text-xs rounded">gas</span>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-wr-card rounded-lg p-3 border border-track">
              <div className="w-20 text-xs font-medium text-on">LINKE</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-purple-600 text-on text-xs rounded">aufrüstung <span className="opacity-70">25×</span></span>
                <span className="px-2 py-1 bg-wr-card text-on text-xs rounded">vermögensteuer</span>
                <span className="px-2 py-1 bg-wr-card text-on text-xs rounded">superreiche</span>
                <span className="px-2 py-1 bg-wr-card text-on text-xs rounded">profit</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-on-muted mt-4">
            Die Signature Words spiegeln die politischen Schwerpunkte wider: CDU mit Wirtschaft,
            AfD mit Anti-Establishment-Rhetorik, SPD mit Sozialkohäsion, GRÜNE mit Klima,
            LINKE mit Anti-Militarismus und Vermögensverteilung.
          </p>
        </motion.div>

        {/* Thresholds */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.98, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Schwellenwerte</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-wr-card rounded-lg p-4 border border-track">
              <div className="text-xs font-mono text-on-muted uppercase tracking-wider mb-2">
                Fraktionen
              </div>
              <ul className="text-sm text-on-muted space-y-1">
                <li>• Mindestens 0,05% der Fraktionswörter</li>
                <li>• Ratio &gt; 2.0 (doppelt so häufig)</li>
                <li>• Kein Event-/Partei-Stopword</li>
                <li>• Ranking nach score (ratio × √per1000)</li>
              </ul>
            </div>
            <div className="bg-wr-card rounded-lg p-4 border border-track">
              <div className="text-xs font-mono text-on-muted uppercase tracking-wider mb-2">
                Abgeordnete
              </div>
              <ul className="text-sm text-on-muted space-y-1">
                <li>• Mindestens 5× verwendet</li>
                <li>• Ratio &gt; 2.0 (doppelt so häufig)</li>
                <li>• Mindestens 5 Zeichen lang</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.99, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-on mb-4">Implementation</h4>
          <CodeBlock title="get_distinctive_words()">
            <p className="text-on-muted"># 0.05% Minimum-Schwellenwert (skaliert mit Redezeit)</p>
            <p className="text-emerald-400">min_count <span className="text-on">= total_words × 0.0005</span></p>
            <p className="text-on-muted mt-3"># Ratio berechnen</p>
            <p className="text-emerald-400">ratio <span className="text-on">= party_freq / (others_avg + 0.001)</span></p>
            <p className="text-on-muted mt-3"># Balanced Score für Ranking</p>
            <p className="text-emerald-400">score <span className="text-on">= ratio × √(per1000)</span></p>
            <p className="text-on-muted mt-3"># Filter anwenden</p>
            <p className="text-on">words = df[</p>
            <p className="text-amber-400 ml-4">(count &gt;= min_count) &amp;</p>
            <p className="text-amber-400 ml-4">(ratio &gt; 2.0) &amp;</p>
            <p className="text-amber-400 ml-4">~word.isin(EVENT_STOPWORDS) &amp;</p>
            <p className="text-amber-400 ml-4">~word.isin(PARTY_STOPWORDS)</p>
            <p className="text-on">].nlargest(n, 'score')</p>
          </CodeBlock>
        </motion.div>

        {/* Why stopwords? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <h4 className="font-medium text-on mb-4">Warum Stopwords?</h4>

          <div className="bg-wr-card border border-track rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <InfoIcon />
              <div>
                <div className="text-sm font-medium text-on mb-1">Problem: Triviale Exklusivität</div>
                <p className="text-sm text-on">
                  Ohne Filter wäre "spd-fraktion" das Top-Signature-Word der SPD mit 11.4× ratio.
                  Technisch korrekt, aber inhaltlich nicht aussagekräftig: Jede Fraktion referenziert
                  ihren eigenen Namen häufig.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-track rounded-lg p-4">
              <div className="text-xs font-mono text-on-muted uppercase tracking-wider mb-3">
                Partei-Stopwords
              </div>
              <p className="text-sm text-on-muted mb-3">
                Selbstreferenzen wie Fraktionsnamen und Parteimitglied-Bezeichnungen.
              </p>
              <div className="font-mono text-xs text-on-muted bg-wr-card p-2 rounded">
                spd-fraktion, sozialdemokrat, unionsfraktion, christdemokrat...
              </div>
            </div>
            <div className="border border-track rounded-lg p-4">
              <div className="text-xs font-mono text-on-muted uppercase tracking-wider mb-3">
                Event-Stopwords
              </div>
              <p className="text-sm text-on-muted mb-3">
                Wörter aus spezifischen Debatten (z.B. Afghanistan-Ortskräfte), die Statistiken verzerren.
              </p>
              <div className="font-mono text-xs text-on-muted bg-wr-card p-2 rounded">
                afghanistan, ortskräfte, aufnahmezusage...
              </div>
            </div>
          </div>

          <p className="text-xs text-on-muted mt-4">
            Quelldatei: <code className="bg-wr-card px-1.5 py-0.5 rounded">src/noun_analysis/wrapped/queries.py</code>
          </p>
        </motion.div>

        {/* Complete Stopword List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.02, duration: 0.6 }}
          className="mt-12"
        >
          <h4 className="font-medium text-on mb-4">Vollständige Stopwort-Listen</h4>
          <p className="text-sm text-on-muted mb-6">
            Für maximale Transparenz: Alle Wörter, die bei der Signature-Word-Berechnung für
            <strong> Abgeordnete</strong> ausgeschlossen werden.
          </p>

          <div className="space-y-4">
            <details className="border border-track rounded-lg">
              <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-on-muted hover:bg-bg-elevated select-none">
                Generische Stopwords <span className="text-on-muted font-normal">(~100 Wörter)</span>
              </summary>
              <div className="px-4 pb-4 pt-2 border-t border-track bg-wr-card">
                <p className="text-xs text-on-muted mb-3">
                  Funktionswörter, Pronomen, Präpositionen und parlamentarische Floskeln ohne semantischen Mehrwert.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 font-mono text-xs text-on-muted">
                  {[
                    'dass', 'wird', 'werden', 'haben', 'sind', 'sein', 'eine', 'einer',
                    'einem', 'einen', 'auch', 'aber', 'oder', 'wenn', 'noch', 'mehr',
                    'schon', 'kann', 'muss', 'hier', 'diese', 'dieser', 'diesem',
                    'dieses', 'sehr', 'denn', 'weil', 'nach', 'über', 'unter', 'nicht',
                    'sich', 'für', 'mit', 'von', 'bei', 'auf', 'aus', 'zum', 'zur',
                    'das', 'der', 'die', 'und', 'ist', 'ich', 'sie', 'wir', 'uns',
                    'meine', 'damen', 'herren', 'kolleginnen', 'kollegen', 'frau',
                    'herr', 'präsidentin', 'präsident', 'liebe', 'lieber',
                    'geehrte', 'geehrter', 'vielen', 'dank', 'danke', 'also', 'gibt',
                    'ganz', 'heute', 'jetzt', 'dann', 'dort', 'immer', 'wieder',
                    'wollen', 'sagen', 'müssen', 'können', 'sollen', 'brauchen',
                    'macht', 'machen', 'geht', 'gehen', 'kommen', 'nehmen', 'stellen',
                    'unsere', 'unserer', 'unseren', 'unserem', 'unseres', 'unser',
                    'ihre', 'ihrer', 'ihren', 'ihrem', 'ihres', 'euer', 'eure',
                    'meiner', 'meinen', 'meinem', 'meines',
                    'sondern', 'sowie', 'doch', 'etwa', 'dabei', 'deshalb', 'daher',
                    'darum', 'deswegen', 'dadurch', 'dafür', 'dagegen', 'davon',
                    'darauf', 'darüber', 'daran', 'darunter', 'daneben', 'darin',
                    'natürlich', 'tatsächlich', 'wirklich', 'eigentlich', 'überhaupt',
                    'andere', 'anderen', 'anderem', 'anderer', 'anderes',
                    'viele', 'vieler', 'vieles', 'einige', 'einiger', 'einigen',
                    'welche', 'welcher', 'welchen', 'welchem', 'welches',
                    'solche', 'solcher', 'solchen', 'solchem', 'solches',
                    'jede', 'jeder', 'jeden', 'jedem', 'jedes', 'alle', 'allen', 'allem',
                    'durch', 'ohne', 'gegen', 'während', 'trotz', 'außer', 'seit',
                    'zwischen', 'wegen', 'statt', 'entlang', 'binnen', 'dank',
                    'weise', 'punkt', 'frage', 'stelle', 'seite', 'teil', 'grund',
                    'ende', 'endes', 'anfang', 'rahmen', 'bereich', 'blick',
                    'dinge', 'dingen', 'sache', 'sachen', 'thema', 'themen',
                  ].map((word) => (
                    <span key={word} className="bg-wr-card px-1.5 py-0.5 rounded border border-track">
                      {word}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-on-muted mt-3">
                  Quelldatei: <code className="bg-wr-card px-1 rounded">src/noun_analysis/analyzer.py</code> → <code>STOPWORD_GENERIC</code>
                </p>
              </div>
            </details>

            <details className="border border-track rounded-lg">
              <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-on-muted hover:bg-bg-elevated select-none">
                Mindestlänge <span className="text-on-muted font-normal">(5 Zeichen)</span>
              </summary>
              <div className="px-4 pb-4 pt-2 border-t border-track bg-wr-card">
                <p className="text-xs text-on-muted mb-2">
                  Wörter mit weniger als 5 Zeichen werden automatisch ausgeschlossen. Dies filtert
                  kurze Funktionswörter wie "auch", "aber", "wir", "sie", die hohe Ratios haben können.
                </p>
              </div>
            </details>

            <details className="border border-track rounded-lg">
              <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-on-muted hover:bg-bg-elevated select-none">
                Mindestanzahl <span className="text-on-muted font-normal">(5× verwendet)</span>
              </summary>
              <div className="px-4 pb-4 pt-2 border-t border-track bg-wr-card">
                <p className="text-xs text-on-muted mb-2">
                  Wörter, die der Sprecher weniger als 5× verwendet hat, werden ausgeschlossen.
                  Dies verhindert, dass zufällige Einmalverwendungen mit hohen Ratios erscheinen.
                </p>
              </div>
            </details>
          </div>

          <div className="mt-6 bg-wr-card border border-track rounded-lg p-4">
            <div className="flex items-start gap-3">
              <InfoIcon />
              <div>
                <div className="text-sm font-medium text-on mb-1">Transparenz-Hinweis</div>
                <p className="text-sm text-on">
                  Diese Stopwort-Liste wird kontinuierlich verbessert. Falls Sie ein Wort bemerken,
                  das gefiltert werden sollte (oder fälschlicherweise gefiltert wird), öffnen Sie
                  gerne ein Issue auf <a href="https://github.com/morit/bundestag-noun-analysis" className="underline">GitHub</a>.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
