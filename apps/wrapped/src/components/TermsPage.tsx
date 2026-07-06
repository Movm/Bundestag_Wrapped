import { motion } from 'motion/react';
import { SEO } from '@/components/seo/SEO';
import { PAGE_META } from '@/components/seo/constants';

export function TermsPage() {
  return (
    <>
      <SEO
        title={PAGE_META.terms.title}
        description={PAGE_META.terms.description}
        canonicalUrl="/terms"
      />
      <div className="min-h-screen page-bg flex flex-col items-center justify-center px-6 py-12 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <h1 className="text-3xl md:text-4xl font-black text-white mb-8">
            Nutzungsbedingungen
          </h1>

          <div className="space-y-6 text-white/70 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-white mb-2">1. Anbieter</h2>
              <p>
                Bundestag Wrapped ist ein unabhaengiges Open-Source-Projekt von Moritz Waechter.
                Kontaktdaten finden Sie im{' '}
                <a
                  href="https://www.moritz-waechter.de/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline"
                >
                  Impressum
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">2. Gegenstand des Angebots</h2>
              <p className="mb-3">
                Bundestag Wrapped bereitet oeffentlich zugaengliche parlamentarische Daten,
                Plenarreden und statistische Auswertungen in einer interaktiven Webanwendung
                sowie ueber einen MCP-Server auf.
              </p>
              <p>
                Das Angebot dient ausschliesslich der Information, Recherche und Bildung. Es
                stellt keine amtliche Auskunft, keine politische Empfehlung, keine Rechtsberatung
                und keine wissenschaftliche Begutachtung dar.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">3. Unabhaengigkeit</h2>
              <p>
                Bundestag Wrapped ist nicht mit dem Deutschen Bundestag verbunden, wird nicht von
                ihm betrieben, geprueft oder unterstuetzt und ist kein offizielles Angebot einer
                Behoerde, Partei, Fraktion oder oeffentlichen Stelle.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">4. Datenquellen und Genauigkeit</h2>
              <p className="mb-3">
                Die Anwendung nutzt unter anderem oeffentliche Daten des Deutschen Bundestags,
                insbesondere die DIP-API, sowie weitere offen zugaengliche Transparenz- und
                Parlamentsdaten. Analysen, Klassifikationen, Rankings und Zusammenfassungen
                koennen Fehler, Verzoegerungen, Auslassungen oder methodische Ungenauigkeiten
                enthalten.
              </p>
              <p>
                Wir bemuehen uns um korrekte und nachvollziehbare Auswertungen, uebernehmen aber
                keine Gewaehr fuer Vollstaendigkeit, Aktualitaet, Richtigkeit oder dauerhafte
                Verfuegbarkeit der Inhalte.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">5. Nutzung der Website und des MCP-Servers</h2>
              <p className="mb-3">
                Sie duerfen Bundestag Wrapped und den oeffentlichen MCP-Server im Rahmen der
                vorgesehenen Recherche- und Informationsfunktionen nutzen. Eine Nutzung, die den
                Betrieb stoert, Sicherheitsmechanismen umgeht, Daten massenhaft oder missbraeuchlich
                abruft oder Rechte Dritter verletzt, ist nicht gestattet.
              </p>
              <p>
                Der MCP-Server stellt Werkzeuge fuer den lesenden Zugriff auf parlamentarische
                Daten bereit. Automatisierte oder sehr umfangreiche Abfragen koennen begrenzt,
                verzoegert oder blockiert werden, um die Stabilitaet des Dienstes zu schuetzen.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">6. Inhalte, Sharebilder und Weiterverwendung</h2>
              <p className="mb-3">
                Von der Anwendung erzeugte Sharebilder und Auswertungen duerfen fuer private,
                journalistische, wissenschaftliche und politische Kommunikation weiterverwendet
                werden, solange sie nicht irrefuehrend veraendert oder als amtliche Aussage
                dargestellt werden.
              </p>
              <p>
                Bitte pruefen Sie wichtige Aussagen anhand der jeweils verlinkten Originalquellen,
                bevor Sie sie weiterverbreiten.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">7. Lizenzen und Open Source</h2>
              <p>
                Der Quellcode von Bundestag Wrapped ist unter der GNU AGPL-3.0 veroeffentlicht.
                Einzelne Inhalte, Datenquellen, Abbildungen, Musik, Sounds oder Bibliotheken
                koennen eigenen Lizenzen unterliegen. Weitere Hinweise finden Sie in der{' '}
                <a href="/dokumentation" className="text-pink-400 hover:text-pink-300 underline">
                  Dokumentation
                </a>{' '}
                und im{' '}
                <a
                  href="https://github.com/Movm/Bundestag_Wrapped"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline"
                >
                  GitHub-Repository
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">8. Externe Links</h2>
              <p>
                Diese Website enthaelt Links zu externen Websites. Fuer deren Inhalte,
                Datenschutzpraktiken und Verfuegbarkeit sind ausschliesslich die jeweiligen
                Betreiber verantwortlich.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">9. Haftung</h2>
              <p>
                Die Nutzung erfolgt auf eigenes Risiko. Soweit gesetzlich zulaessig, haften wir
                nicht fuer Schaeden, die aus der Nutzung, Nichtverfuegbarkeit oder Auslegung der
                bereitgestellten Informationen entstehen. Gesetzliche Haftung fuer Vorsatz,
                grobe Fahrlaessigkeit, Verletzung von Leben, Koerper oder Gesundheit sowie
                zwingende gesetzliche Ansprueche bleibt unberuehrt.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">10. Aenderungen</h2>
              <p>
                Wir koennen diese Nutzungsbedingungen anpassen, wenn sich Funktionen, Datenquellen,
                rechtliche Anforderungen oder der Betrieb des Angebots aendern. Die jeweils
                aktuelle Fassung ist auf dieser Seite abrufbar.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">11. Datenschutz</h2>
              <p>
                Informationen zur Verarbeitung personenbezogener Daten finden Sie in der{' '}
                <a href="/datenschutz" className="text-pink-400 hover:text-pink-300 underline">
                  Datenschutzerklaerung
                </a>.
              </p>
            </section>
          </div>

          <p className="text-white/40 text-xs mt-10">
            Stand: Juli 2026
          </p>
        </motion.div>
      </div>
    </>
  );
}
