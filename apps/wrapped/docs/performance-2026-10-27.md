# Performance-Umsetzung und Nachtest

27. Oktober 2026. Vergleichsbasis ist `400cdef` aus `main`, mit dessen identischen
veröffentlichten 2025-Daten. Der ältere lokale Auditstand `1b99e81` ist keine
vergleichbare Messbasis mehr: Inzwischen wurden Editionen und Daten geändert.

## Ergebnis

Die synchrone Redensuche blockiert den UI-Thread in den geprüften Abläufen nicht
mehr. Bei der Sucheingabe wurden vorher Long Tasks von **184, 210 und 190 ms**
erfasst; nach der Umsetzung **keine**. Der größte rAF-Abstand während der
Sucheingabe sank von **183,3–199,9 ms auf 16,8 ms**. Auch die drei geprüften
Ergebnisseitenwechsel lagen im finalen Build in allen drei Läufen bei maximal
**16,8 ms**, nachdem die parallelen Eintrittsanimationen der Redekarten entfernt
wurden.

**Eine allgemeine Freigabe für „immer 60 fps“ ist damit nicht belegt.** Ein finaler
Durchlauf zeigte bei Slide-Sprüngen weiterhin einzelne rAF-Lücken bis 266,7 ms,
ohne gleichzeitig gemeldeten JavaScript-Long-Task. Die beiden anderen finalen
Durchläufe lagen dort bei rund 16,8 ms. Das bleibt ein konkreter Nachprüfpunkt
für Frame-/GPU-Traces auf echten Geräten; die Ursache wurde nicht isoliert.
Ein guter p95-Wert allein würde diese Spitzen verschweigen.

## Implementiert

1. **Redensuche im Web Worker:** Fetch, JSON-Parsing, Vertragsvalidierung,
   Suche und Sortierung bleiben außerhalb des UI-Threads. Der Worker verwendet
   dieselben Suchfunktionen und denselben Editionsvalidator. Ergebnisreihenfolge
   und Suchsyntax sind durch Paritätstests abgesichert.
2. **Begrenzter Datentransfer:** maximal 50 Vorschauen pro Seite, keine Volltexte
   im Suchergebnis. Volltexte werden beim Öffnen angefordert. Seitenwechsel nutzen
   das bereits berechnete Ergebnis. Da die Exporte keine IDs liefern, vergibt der
   Worker stabile IDs pro Datenbestand. Veraltete Antworten werden ignoriert;
   bei Editionswechsel, leerer Suche oder Verlassen des Reden-Tabs endet der Worker.
3. **Eingabe und Ergebnisse entkoppelt:** Suchtext bleibt beim Tippen lokal im
   Eingabefeld und wird nach 300 ms an die URL übergeben. Die URL ist die einzige
   Quelle des übernommenen Suchzustands; die bisherige Effect-Rückkopplung entfällt.
   Die Ergebnisliste ist memoisiert. Beim Seitenwechsel bleibt die alte Seite bis
   zur Antwort stehen, statt zunächst eine leere Liste zu rendern.
4. **Feste Ergebnisseiten:** alle Such-Tabs zeigen jeweils maximal 50 Karten
   statt einer bei jedem Nachladen wachsenden Liste. Redekarten haben keine
   parallelen Eintritts-/Exit-Animationen mehr. Vorherige und nächste Seite sind
   über beschriftete Buttons erreichbar.
5. **Slide-Aktivität begrenzt:** alle Snap-Sections behalten ihre Höhe, Inhalte
   werden erst im Fenster aus aktueller Slide und direkten Nachbarn angelegt.
   Besuchte Inhalte behalten lokalen Zustand mit React Activity; außerhalb des
   Fensters werden ihre Effects bereinigt und ihre Darstellung versteckt.
   Versteckte Dokumente pausieren außerdem Slide- und Hintergrundaktivität.
6. **Dekoration und Laden:** globale Standardpartikel von 60 auf 24 reduziert,
   gemeinsame CSS-Keyframes und keine pauschalen `will-change`-Layer pro Partikel.
   Speaker-Wrapped wird lazy geladen. Große Query-Assets erhalten fünf Minuten
   Cache-Nachlauf statt unbegrenzter Lebensdauer. Parallax erhält einen stabilen
   Element-Ref; der Speaker-Fortschrittsbalken animiert `scaleX` statt `width`.
7. **Navigation und Zugänglichkeit:** verspätete Quiz-/Auto-Advance-Aufrufe
   dürfen keine inzwischen verlassene Slide mehr weiterschalten. Ergebnisoverlays
   gehören nur zur sichtbaren Frage. Der Scrollbereich ist auch dann per Tastatur
   erreichbar, wenn alle Antworten deaktiviert sind. Sharetests verwenden die
   tatsächliche Test-Origin statt eines fest eingebauten Ports.

Besuchte Slides bleiben im DOM, um lokalen Zustand zu erhalten. Es gibt deshalb
keine dauerhafte Obergrenze von drei gemounteten Slides über die ganze Sitzung;
die Begrenzung betrifft aktive Darstellung und Effects. Im geprüften Ausschnitt
wurden am Ende zwölf Slide-Inhalte besucht, während die 40 Snap-Sections bestehen
blieben. Andere komplexe Blur-/GPU-Effekte wurden ohne isolierten Gerätebefund
nicht pauschal umgebaut.

## Ressourcenvergleich

| Messpunkt | Vorher | Finaler Build |
|---|---:|---:|
| DOM im ruhenden Intro | 1.612 Elemente | 301 Elemente |
| Laufende native Animationen bei sichtbarer Tonalität | 199 | 29 |
| Davon außerhalb des Viewports | 137–140 | 2–4 |
| DOM nach dreimaligem Ergebniswechsel/Nachladen | 2.357 Elemente | 690 Elemente |
| Initiales JavaScript laut Vite-Manifest | 898.768 Bytes | 871.837 Bytes |

`document.getAnimations()` erfasst CSS-/WAAPI-Animationen, aber nicht jede
JavaScript-getriebene Motion-Schleife. Ein direkter Nachbar kann bewusst noch
aktiv sein, obwohl Teile davon bereits außerhalb des Viewports liegen.

## Messverfahren und Frame-Abstände

Drei Referenzläufe und drei abschließende Läufe, nacheinander ohne parallele
Builds oder Browsertests. Chrome 155.0.8059.85, headless, 390 × 844 CSS-Pixel,
DPR 3, Touch, vierfache CPU-Drosselung. Lokaler Production-Preview, ungedrosseltes
Netzwerk, Service Worker für die Zeitmessung blockiert. Die Messung verwendet
frische Browserkontexte. Die Referenz wurde separat aus dem gleichen Commit
gebaut; der Datensatz enthält 6.967 Redebeiträge.

Die Tabelle zeigt die Spanne des **jeweils größten rAF-Abstands pro Lauf**:

| Ablauf | Vorher (ms) | Final (ms) |
|---|---:|---:|
| Intro ruhend | 16.8 | 16.8 |
| Starten | 16.8–33.4 | 16.8–33.3 |
| Sprung zu Themen | 16.8 | 16.8–183.4 |
| Sprung zu Redenvolumen | 16.8 | 16.8–116.6 |
| Sprung zu Tonalität | 16.8–250.0 | 16.8–266.7 |
| Sucheingabe | 183.3–199.9 | 16.8 |
| Ergebnisseite 2 | 16.8 | 16.8 |
| Ergebnisseite 3 | 16.8–33.4 | 16.8 |
| Ergebnisseite 4 | 16.8–33.4 | 16.8 |

Die Werte sind keine direkt gemessenen Präsentations-FPS. rAF zeigt, wann der
Main Thread Framecallbacks ausführt; ein Compositor kann sich anders verhalten.
Die 16,7/16,8-ms-Abstände sind mit 60-Hz-Taktung und Zeitstempelrundung vereinbar.
CPU-Emulation ersetzt weder eine mobile GPU noch thermische Belastung oder
Speichergrenzen. Sämtliche sechs Messläufe blieben ohne JavaScript-Pageerror.

Rohdaten: [performance-results/2026-10-27](performance-results/2026-10-27/).
Explorative Zwischenstände sind nicht als finales Ergebnis eingerechnet.

## Funktionale Validierung

- Production-Build einschließlich TypeScript, Produktionseditionen und Preview-Auth.
- ESLint ohne Warnungen; Bundlebudget und Editions-Hardcode-Prüfung erfolgreich.
- **124 Unit-Tests in 28 Dateien**, darunter Suchparität, IDs für echte Exportformen,
  Workerantworten außer Reihenfolge, Editionswechsel, begrenzte Ergebnisse und
  Zustandserhalt/Effect-Cleanup durch Activity.
- **60 Browserfälle:** jeweils 20 in Chrome, Firefox und WebKit. Einschließlich
  vollständigem Quizdurchlauf, richtigen/falschen Antworten, verspäteten Overlays,
  Wiederaufnahme, Editionsisolation, Volltexten, Seitennavigation, Teilen,
  Downloads und Axe-Prüfungen.
- Nach Online-Warmup konnte der Suchworker innerhalb derselben SPA-Sitzung offline
  beendet und neu erstellt werden; Suche und Volltext funktionierten über den
  bestehenden Service-Worker-Datencache.

Zusätzlicher Befund: Ein vollständiger Offline-Neuladevorgang scheitert am
fehlenden Cache für `/data/editions.json`. Das unveränderte PWA-Regelwerk cached
versionierte Datensätze, aber keine Editionsregistry/Bootstrapdokumente. Auch
Audiodateien sind offline nicht vollständig vorhanden. Dieser bestehende Bereich
ist separat zu bearbeiten; der Suchworker selbst benötigt dafür keinen neuen
Cache oder eine Kopie des Datensatzes im UI-Thread.

## Wiederholen und weiter abnehmen

```sh
pnpm --filter bundestag-wrapped build
pnpm --filter bundestag-wrapped preview --host 127.0.0.1 --port 4173
```

In einem zweiten Terminal:

```sh
PERF_URL=http://127.0.0.1:4173 PERF_LABEL=trial-1 pnpm --filter bundestag-wrapped audit:performance
```

`PERF_OUTPUT`, `PERF_CPU`, `PERF_EDITION` und `PERF_CHANNEL` sind ebenfalls
konfigurierbar. Für eine Freigabe reale Android-Mittelklasse und iPhone/Safari
mit Frame-/GPU-Traces ergänzen; zusätzlich Warm-/Kaltstart, langsames Netzwerk,
120-Hz-Displays, lange Sitzungen und die Suche mit großen Wortlisten prüfen.
Bei den verbliebenen Slide-Spitzen zuerst Main-/Raster-/Compositor-Spuren
korrelieren und dann gezielte A/B-Varianten testen. Ein pauschales weiteres
`memo` oder `will-change` ist dafür keine belegte Lösung.
