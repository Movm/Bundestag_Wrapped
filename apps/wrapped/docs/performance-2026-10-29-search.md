# Suchindex: Performance-Prüfung, 29. Oktober 2026

Status: Lokal validiert; PR- und Produktionsprüfung stehen aus.

## Änderung

Die Suche lädt einen editionsgebundenen statischen Index und nur die für die Suchbegriffe benötigten Positionslisten. Bis zu 50 Vorschautexte kommen in einer begrenzten HTTP-Range-Anfrage; der vollständige Redetext wird erst beim Öffnen geladen. Auswertung und Sortierung bleiben im Worker. Ein Suchwechsel bricht veraltete Ressourcenanfragen ab. Positionslisten sind auf 32 MB / 512 Einträge und Vorschauen auf 128 Texte begrenzt.

Die unveränderlichen Quelldaten und ihre Prüfsummen bleiben erhalten. Generierte Dateien liegen neben dem Datenversionsverzeichnis und tragen Manifest- und Korpus-Hash im Pfad. Die Vorschauedition bleibt authentifiziert und außerhalb des öffentlichen PWA-Caches. Ein Server ohne Range-Unterstützung oder ein fehlender Index verwendet die bisherige Suche; eine unbeschränkte 200-Antwort auf Range wird vor dem Lesen abgebrochen.

## Korrektheit

Der Referenzvergleich verwendet die bisherige Suchfunktion, einschließlich ihrer unterschiedlichen Unicode-Regeln für Teilstrings und reguläre Ausdrücke. Häufigkeiten zählen nicht überlappende Teilstrings, maximal fünf je Begriff. Auf beiden vollständigen Korpora stimmen jeweils 420 Kombinationen aus Suche, Filtern und Sortierung überein. Zusätzlich stimmen 15.510 Vorschauen für 2025 und 15.275 für 2026 exakt überein.

209 Unit-Tests bestehen. Die neun neuen Browserfälle bestehen in Chromium, WebKit und Firefox: Seitenbegrenzung, Vorschauen, vollständiger Text, Suchwechsel mit verspäteter Antwort und Kompatibilitätsrückfall. Eine Playwright-WebKit-Einschränkung entfernt bei abgefangenen Multipart-Antworten den Boundary-Parameter; die Fixture liefert diese Antworten deshalb über echtes HTTP derselben Origin aus. Direktes WebKit-Fetch gegen nginx bestätigt den vollständigen Header.

## Kosten und Messgrenzen

Die gzip-komprimierten Metadaten umfassen 153.105 Bytes (2025) beziehungsweise 145.990 Bytes (2026). Alle Positionslisten zusammen benötigen etwa 75,3 beziehungsweise 63,4 MB gzip; einzelne Suchen laden nur eine Teilmenge. Der ursprüngliche UTF-16-Textblock für 2025 umfasst 40.899.336 Bytes und wird ausschließlich in begrenzten Ausschnitten angefragt. Viele kleine Dateien und zusätzliche Detaildateien erhöhen Imagegröße und Dateisystemverbrauch erheblich. Dieser Speicheraufwand muss gegen die gemessene Übertragungsersparnis abgewogen werden.

`queryMs` umfasst beim Index Ressourcen-I/O und ist keine reine CPU-Messung. Der Bericht unterscheidet deshalb Aktionsdauer, Worker-Roundtrip, Netzwerkvolumen und Frame-Zeiten. Lokale ungedrosselte Ergebnisse ersetzen keinen kontrollierten Vergleich. Physische iPhone-/Android-Messungen stehen aus; eine allgemeine Garantie von stets 60 fps ist daraus nicht ableitbar.

## Drei kontrollierte Messläufe

Produktionsimage, Chrome headless, 390 × 844 / DPR 3, CPU 4×, 5 Mbit/s und 80 ms Latenz, Service Worker ausgeschaltet, Seed 12345. Vollständige Browser-Suite: 107/108 im ersten Lauf; die unmittelbare Firefox-Animationsabfrage wurde durch eine wartende Zustandsprüfung ersetzt, anschließend alle sieben Firefox-Performancefälle grün. Alle neun neuen Indexfälle bestehen in allen drei Browsern.

| Messung | Lauf 1 | Lauf 2 | Lauf 3 |
| --- | ---: | ---: | ---: |
| Erste Suche, Aktion bis Ergebnisse | 1.964 ms | 1.886 ms | 1.810 ms |
| Seitenwechsel, Aktion bis Ergebnisse | 477–665 ms | 260–293 ms | 213–245 ms |
| Datenübertragung über gesamten Test | 513.837 Bytes | 513.837 Bytes | 513.837 Bytes |

438.574 Bytes entfallen jeweils auf Indexressourcen; kein Lauf lädt `speeches.json`. Der frühere Korpusabruf allein umfasste 9.310.171 Bytes gzip und etwa 15 Sekunden. Diese Verbesserung betrifft kalte Suche und Transfer, nicht sämtliche Frame-Zeiten.

Läufe 2/3 haben in allen Phasen p95 ≤ 16,8 ms; Lauf 1 erreicht beim Start p95 50,1 ms und bei Seitenwechseln 33,4 ms. Lauf 1 enthält mehrere Long Tasks, auch in unveränderten Story-Phasen. Alle drei Läufe enthalten Long Tasks beim kalten Suchstart. Die Ausreißer werden nicht verworfen. Worker-Roundtrips für Seitenwechsel liegen in Lauf 3 bei rund 118 ms; die sichtbare Aktionsdauer überschreitet weiterhin das 200-ms-Ziel. Erste neue Suchbegriffe benötigen zusätzliche Netzwerkanfragen; bereits warme Seiten und erstmals benötigte Begriffsdaten sind getrennt zu bewerten.

Das Ziel durchgehend flüssiger Interaktionen ist damit **noch nicht erreicht**. Nächste Priorität ist die Trace-basierte Analyse von kaltem Modulstart, Ergebnis-Commit und Paint (Paket 4), anschließend dauerhaft messbare Budgets und Geräteabnahme (Paket 5).
