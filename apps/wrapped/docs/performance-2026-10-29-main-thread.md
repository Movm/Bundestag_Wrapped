# Hauptthread und Ergebnis-Rendern, 29. Oktober 2026

Status: Finales Produktionsimage lokal geprüft; CI und Live-Abnahme folgen.

## Prioritäten aus dem Trace

1. **Schemakompilierung aus dem Browser entfernen.** Der Diagnose-Trace nach dem Suchindex zeigt unter anderem 123,7 ms für die Modulauswertung und 66,4 ms für einen Microtask-Block beim kalten Suchstart. Die bisherige Datenvalidierung initialisiert Ajv und kompiliert Validatoren beim ersten Zugriff. Der Build erzeugt nun Ajv-Standalone-Validatoren aus demselben Vertrag. Die Browser laden nur Validatoren und kleine Hilfsfunktionen. `contract:check` und der Web-Prebuild prüfen, dass die erzeugten Dateien zum Schema passen. Vorhandene Tests für fehlerhafte Felder, Datumswerte und Assetformen bleiben unverändert.
2. **Jahresstory nur auf ihrer Route laden.** Die Suche benötigte über den App-Einstieg auch den Code aller Jahresfolien. `MainWrappedPage` wird nun wie die anderen Routen separat geladen. Die Jahresroute verwendet denselben Suspense-Ladezustand.
3. **Unveränderte Ergebniskarten nicht erneut rendern.** Der Ladezustandswechsel beim Blättern lässt die bestehende Seite stehen. Stabile Klick-Callbacks und `memo` erhalten dabei die bestehenden Karten. Statische Redekarten liegen außerhalb von `AnimatePresence`; die animierten Personen- und Wortkarten behalten ihre bisherigen Übergänge.

## Bisherige Prüfung

Der Vergleich der tatsächlichen Image-Manifeste und ausgelieferten Dateien ergibt 875.083 → 708.261 Bytes initiales JavaScript (unkomprimiert, −19,1 %). Der separate Jahresstory-Chunk wird auf der Jahresroute zusätzlich benötigt; die Einsparung gilt deshalb für den gemeinsamen Einstieg, nicht pauschal für den gesamten Besuch.

209 Unit-Tests, Lint, TypeScript, Vertragsprüfung und Produktionsbuild bestehen. Ein Importproblem eines CommonJS-Helfers wurde im ersten Produktionsimage vor dem PR entdeckt und korrigiert; die Unit-Test-Umgebung allein hätte es nicht erkannt. Produktionsbrowser bleiben deshalb ein verbindlicher Prüfschritt.

Drei isolierte Prototyp-Läufe mit nginx und schreibgeschützt eingebundenem Vite-Produktionsbundle verwenden wie zuvor 4× CPU, 5 Mbit/s, 80 ms Latenz, Chrome headless und 390 × 844 / DPR 3. Nach Vorab-Validierung und Routentrennung dauert der kalte Suchstart 1.571–1.582 ms ohne Long Tasks. Ein einzelner 52-ms-Task bleibt beim Blättern. Nach der Kartenänderung enthalten alle drei Läufe in sämtlichen erfassten Phasen keine Long Tasks; p95 bleibt ≤ 16,8 ms. Sichtbare Seitenwechsel liegen bei 178–226 ms. Das 200-ms-Ziel ist damit nicht in jedem Fall erfüllt.

Diese Prototypwerte ersetzen weder die finale Docker-Messung noch reale Mobilgeräte. Auch bei gutem p95 werden p99, Maximalabstände und Ausreißer ausgewertet. Keine allgemeine Garantie für stets 60 fps.


## Finale Docker-Abnahme

Alle 108 E2E-Fälle bestehen im tatsächlichen nginx-Image, zusätzlich zu 209 Unit-Tests und den Vertragsprüfungen. Drei weitere isolierte Läufe desselben Images ergeben:

| Messung | Lauf 1 | Lauf 2 | Lauf 3 |
| --- | ---: | ---: | ---: |
| Kalte Suche bis sichtbare Ergebnisse | 1.584 ms | 1.560 ms | 1.560 ms |
| Sichtbare Seitenwechsel | 181–198 ms | 180–198 ms | 180–197 ms |
| Long Tasks in allen gemessenen Phasen | 0 | 0 | 0 |
| p95 über alle gemessenen Phasen | ≤ 16,8 ms | ≤ 16,8 ms | ≤ 16,8 ms |

Bei Starten hat Lauf 1 einen einzelnen maximalen Frame-Abstand von 50 ms (auch p99 50 ms), obwohl kein Long Task gemeldet wird. In allen anderen Phasen/Läufen liegen p99 und Maximum bei höchstens 16,8 ms. Damit ist die kalte Suchblockade in diesen Messungen behoben und das 200-ms-Seitenziel erreicht; ein Anspruch auf ausnahmslos 60 fps wäre wegen dieses Ausreißers und fehlender Hardware-Abnahme weiterhin falsch. Neue Suchbegriffe benötigen weiterhin zusätzliche Netzwerkanfragen; Tippen, Debounce und neue Ressourcen sind keine warme Seitenabfrage.
