# Performance testen und abnehmen

Die verbindliche Zielgröße für 60 Hz ist ein Frame-Budget von etwa 16,7 ms. Ein guter Durchschnitt oder p95 allein reicht nicht: p99, Maximum, aufeinanderfolgende Frame-Lücken, Long Tasks und sichtbare Fehler gehören zum Bericht. Eine allgemeine Garantie für jedes Gerät lässt sich aus Desktop-Emulation nicht ableiten.

## Reproduzierbarer Ablauf

1. Den exakten Commit mit eingefrorenem Lockfile bauen. Image-ID, Build-Info, tatsächliche Abhängigkeitsversionen und Datenedition sichern. Build, E2E und Messung nacheinander ausführen.
2. Zuerst funktional prüfen: normale 2025-Strecke, alle Quizfragen, direkte weite Sprünge, schnelles Scrollen, Hoch-/Querformat, Lesemodus, gespeicherter Fortschritt und Neuladen. Die aktive Folie muss tatsächlich sichtbaren Inhalt im Viewport haben. Anschließend Suche, Pagination, Volltextdialog und Zugriffsschutz prüfen.
3. Drei isolierte Messläufe mit identischem Rechner, Browser, Seed, Viewport und Drosselung ausführen. Keine Builds oder anderen Browser-Tests parallel. Kalte und warme Anfragen sowie Netzwerk und reine CPU-Arbeit getrennt auswerten. Kein Verwerfen des ersten oder schlechtesten Laufs.
4. Einen zusätzlichen Diagnose-Trace aufnehmen. Seine Werte werden wegen des Messaufwands nicht mit den drei normalen Läufen vermischt. Einen auffälligen Task einer konkreten Funktion, Layout-/Paint-Arbeit oder GC zuordnen; bleibt er unreproduzierbar, ausdrücklich dokumentieren.
5. PWA-Cache und wiederholte Sitzungen separat prüfen. Zum Schluss das ausgerollte Image mit realen Daten prüfen; Fixture-Tests allein reichen nicht.

```sh
# Vorher den Produktionsbuild/nginx separat starten.
PERF_URL=http://127.0.0.1:4173 PERF_LABEL=run-1 PERF_CPU=4 PERF_DOWNLOAD_MBPS=5 PERF_LATENCY_MS=80 pnpm --filter bundestag-wrapped audit:performance
# Mit run-2 und run-3 wiederholen.
PERF_URL=http://127.0.0.1:4173 PERF_LABEL=diagnostic PERF_TRACE=1 PERF_CPU=4 PERF_DOWNLOAD_MBPS=5 PERF_LATENCY_MS=80 pnpm --filter bundestag-wrapped audit:performance
PERF_URL=http://127.0.0.1:4173 PERF_CYCLES=30 pnpm --filter bundestag-wrapped audit:cache-memory
```

`PERF_CHANNEL=chromium` verwendet den installierten Playwright-Browser; sonst wird Chrome verwendet. JSON und gegebenenfalls Trace/Screenshot liegen in einem zufälligen privaten temporären Verzeichnis, dessen Pfad das Skript ausgibt. Vor dem Vergleich Browser-, Rechner- und Build-Felder prüfen. `queryMs` des Index-Backends enthält Ressourcen-I/O; es ist keine reine CPU-Zeit. `search-typing` enthält echtes Tippen, Debounce und neue Netzwerkressourcen und ist kein warmer Query-Benchmark.

## Matrix und Kriterien

| Fall | Erwartung / Nachweis |
| --- | --- |
| Frischer Browser, Service Worker aus | Keine Rede-/Indexdaten vor Suche; kalte Ergebnisse im 5-Mbit/s-/80-ms-Profil ≤3 s; maximal 50 Karten |
| Warmer Begriff / nächste Seite | Worker-Roundtrip und sichtbare Aktionsdauer separat; Ziel ≤200 ms ohne Debounce; Überschreitungen bleiben im Bericht |
| Story und interaktive Suche | p95 etwa ≤17 ms, p99/Maximum und alle >25-ms-Lücken angeben; keine wiederholten >33-ms-Serien; appbedingte ≥50-ms-Tasks untersuchen |
| Schneller Sprung / Reflow | Auswahl und sichtbarer Viewport stimmen überein, keine leere aktive Folie, Höhe besuchter hoher Abschnitte bleibt erhalten |
| Unsichtbare Folien / Hintergrundtab | Keine laufenden dekorativen Endlosschleifen; Inhalt und Quizfortschritt bleiben erhalten |
| PWA warm | Öffentlicher Index/Postings dürfen im Cache liegen; Range-Textblock und geschützte 2026-Daten nicht |
| Wiederholte Suche | Je aktiver Redensuche ein Worker, nach Verlassen null; Ergebniszahl bleibt begrenzt; DOM/Heap nach Aufwärmen beobachten |
| iPhone Safari und Android Chrome | Auf echter Hardware erneut messen: normale Bewegung, Reduced Motion, Rotation, Hintergrund/Vordergrund und installierte PWA |

Die automatischen E2E-Gates prüfen Worker-Lebensdauer, Kartenbegrenzung, versteckte Effekte und die nachgewiesenen Scroll-/Reflow-Regressionen in Chromium, WebKit und Firefox. Der Bundle-Check begrenzt initiales JavaScript auf 750 KiB und stellt sicher, dass die Jahresstory ein separater dynamischer Chunk bleibt. Die CI prüft zusätzlich das echte Docker-Image, Kompression, begrenzte Range-Antworten, private Editionen und vollständige Suchparität. Im Docker-Job läuft die Cache-/Worker-Probe mit drei Zyklen; ihr JSON wird als Artefakt gesichert. Sie fordert einen gecachten Volltextdetail-Abruf und verwirft einen unbemerkten Korpus-Rückfall. Hardwareabhängige Frame-Schwellen werden nicht als scheinbar deterministischer Test auf beliebigen geteilten CI-Rechnern ausgegeben.

## Speicher richtig interpretieren

`audit:cache-memory` verwendet einen frischen Kontext mit aktivem Service Worker und wechselt bis zu 100-mal zwischen Reden und Wörtern. Es bricht bei nicht beendeten/zusätzlichen Workern, ungeeigneten Cache-Einträgen oder Browserfehlern ab. GC-bereinigte Hauptthread-Heapwerte und DOM-Zähler sind Diagnosewerte, kein Gesamt-RAM-Verbrauch und keine Messung des Worker-Heaps. Kurzfristiges Wachstum beweist weder ein Leak noch dessen Abwesenheit. Bei dauerhaftem Wachstum Heap-Snapshots und Retainer vergleichen; Worker-Prozesse und Gerätespeicher gesondert messen.

Eine lokale 30-Zyklen-Probe vom 30. Oktober 2026 hatte nach Aufwärmen überwiegend 270 DOM-Knoten, null Worker außerhalb der Redensuche und einen Hauptthread-Heap von etwa 6,0 →6,9 MB. Sie beweist die beobachtete Lebensdauer, nicht unbegrenzte Speicherstabilität.

## Verbleibende Prioritäten

1. Einzelne Ausreißer auf Referenzhardware nachstellen und mit einem Trace zuordnen. Der letzte Scroll-/Reflow-Bericht enthält noch einen 68-ms-Task und Seitenwechsel über 200 ms; deshalb keine Freigabe „immer 60 fps“ behaupten.
2. Kalten, warmen und wiederholten Betrieb auf einem physischen iPhone und einem mittleren Android-Gerät dokumentieren. Emulierter WebKit ist kein iPhone-Nachweis.
3. Bei längerer Nutzung Heap-Retainer und Cache-Wachstum prüfen. Die Decoder-/Vorschau-Caches sind begrenzt; daraus folgt kein pauschaler Gesamt-RAM-Grenzwert.
4. Danach Speicher-/Buildkosten des statischen Index optimieren, ohne Suchsemantik oder Zugriffsschutz zu verändern. Die erhebliche Transferersparnis hat zusätzliche Indexdateien und Imagegröße als Gegenleistung.

Physische Geräteabnahme ist in dieser Umgebung nicht erfolgt. Ein Bericht muss für jeden Matrixfall „bestanden“, „fehlgeschlagen“ oder „nicht getestet“ mit Commit und Artefakt angeben.
