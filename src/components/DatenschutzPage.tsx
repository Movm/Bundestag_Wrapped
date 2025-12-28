import { motion } from 'motion/react';
import { SEO } from '@/components/seo/SEO';
import { PAGE_META } from '@/components/seo/constants';

export function DatenschutzPage() {
  return (
    <>
      <SEO
        title={PAGE_META.privacy.title}
        description={PAGE_META.privacy.description}
        canonicalUrl="/datenschutz"
      />
    <div className="min-h-screen page-bg flex flex-col items-center justify-center px-6 py-12 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <h1 className="text-3xl md:text-4xl font-black text-white mb-8">
          Datenschutzerklärung
        </h1>

        <div className="space-y-6 text-white/70 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Verantwortlicher</h2>
            <p>
              Verantwortlich für diese Website ist Moritz Wächter.
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
            <h2 className="text-lg font-semibold text-white mb-2">2. Datenverarbeitung</h2>
            <p className="mb-3">
              Diese Website verwendet <strong className="text-white">keine Cookies</strong> und
              kein geräteübergreifendes Tracking. Es werden keine personenbezogenen Daten an
              Dritte weitergegeben.
            </p>

            <p className="mb-2">
              <strong className="text-white">Webanalyse mit Umami:</strong>
            </p>
            <p className="mb-3">
              Zur Verbesserung dieser Website nutzen wir Umami, ein datenschutzfreundliches
              Analysetool. Umami wird von uns selbst gehostet – Ihre Daten verlassen unseren
              Server nicht und werden nicht an Dritte übermittelt.
            </p>
            <p className="mb-2">Umami erfasst folgende anonymisierte Informationen:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>Aufgerufene Seiten (URL) und Seitentitel</li>
              <li>Verweildauer</li>
              <li>Verweisende Website (Referrer)</li>
              <li>Browser- und Betriebssystem-Typ</li>
              <li>Bildschirmauflösung</li>
              <li>Gerätetyp (Desktop/Mobil/Tablet)</li>
              <li>Sprache</li>
              <li>Land (abgeleitet aus der IP-Adresse, die anschließend verworfen wird)</li>
            </ul>
            <p className="mb-3">
              Umami verwendet <strong className="text-white">keine Cookies</strong> und speichert
              keine Informationen auf Ihrem Gerät. Es werden keine individuellen Nutzerprofile
              erstellt und kein Tracking über verschiedene Websites hinweg durchgeführt. Ihre
              IP-Adresse wird zur Länderbestimmung verwendet und danach sofort anonymisiert –
              sie wird nicht gespeichert.
            </p>
            <p className="mb-4">
              <strong className="text-white">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO
              (berechtigtes Interesse). Unser berechtigtes Interesse liegt in der Analyse der
              Websitenutzung zur Verbesserung unseres Angebots. Da Umami keine Cookies verwendet
              und keine Daten auf Ihrem Gerät speichert, ist keine Einwilligung nach § 25 TTDSG
              erforderlich.
            </p>

            <p className="mb-2">
              <strong className="text-white">Lokale Speicherung (localStorage):</strong> Um Ihren Fortschritt
              und Ihre Einstellungen zu speichern, nutzt diese Website die localStorage-Funktion
              Ihres Browsers:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>
                <strong className="text-white">Fortschritt:</strong> Ihre Quiz-Antworten und der aktuelle
                Abschnitt werden lokal gespeichert (automatische Löschung nach 7 Tagen)
              </li>
              <li>
                <strong className="text-white">Toneinstellungen:</strong> Ihre Präferenz zur Stummschaltung
                der Hintergrundmusik
              </li>
            </ul>
            <p>
              Diese Daten verbleiben ausschließlich auf Ihrem Gerät und werden niemals an einen
              Server übertragen. Sie können sie jederzeit über Ihre Browser-Einstellungen löschen.
              Rechtsgrundlage: § 25 Abs. 2 Nr. 2 TTDSG (technisch notwendige Speicherung).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Optionale Eingaben</h2>
            <p>
              Bei der Erstellung von Sharebildern können Sie optional einen Namen eingeben.
              Dieser wird <strong className="text-white">ausschließlich lokal</strong> in Ihrem Browser zur
              Bildgenerierung verwendet, nicht gespeichert und nicht an Server übertragen.
              Nach Verlassen der Seite ist die Eingabe nicht mehr vorhanden.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Hosting</h2>
            <p>
              Die Website wird als statische Seite gehostet. Der Hosting-Anbieter kann
              in Server-Logfiles automatisch Informationen speichern, die Ihr Browser
              übermittelt (z.B. IP-Adresse, Browsertyp, Zeitpunkt des Zugriffs).
              Diese Daten werden nicht mit anderen Datenquellen zusammengeführt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Externe Links</h2>
            <p>
              Diese Website enthält Links zu externen Websites (GitHub, Bundestag).
              Für deren Inhalte und Datenschutzpraktiken sind die jeweiligen Betreiber verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Ihre Rechte</h2>
            <p className="mb-3">
              Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
              <li>Recht auf Löschung (Art. 17 DSGVO)</li>
              <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>
                <strong className="text-white">Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie haben das Recht,
                aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die
                Verarbeitung Sie betreffender Daten, die auf Art. 6 Abs. 1 lit. f DSGVO beruht,
                Widerspruch einzulegen.
              </li>
            </ul>
            <p className="mb-3">
              Da wir durch Umami keine individuell zuordenbaren Daten speichern (IP-Adressen werden
              sofort anonymisiert), ist eine Identifikation und damit Auskunft, Löschung oder
              Berichtigung in der Praxis nicht möglich.
            </p>
            <p>
              Sie haben zudem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die
              Verarbeitung Ihrer personenbezogenen Daten zu beschweren.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Lizenzen</h2>
            <p>
              Informationen zu verwendeten Musik- und Soundlizenzen finden Sie auf der{' '}
              <a
                href="/dokumentation"
                className="text-pink-400 hover:text-pink-300 underline"
              >
                Dokumentationsseite
              </a>.
            </p>
          </section>
        </div>

        <p className="text-white/40 text-xs mt-10">
          Stand: Dezember 2025
        </p>
      </motion.div>
    </div>
    </>
  );
}
