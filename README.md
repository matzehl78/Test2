# Spielekiste

Sammlung kleiner Spiele nach klassischen Spielprinzipien – als installierbare Web-App (PWA)
und als Store-App für Android und iOS. Der Spielcode kommt ohne Abhängigkeiten und ohne Build-Schritt aus.

| Spiel | Prinzip | Steuerung |
|---|---|---|
| Blockfall | Fallende Blöcke stapeln, Reihen räumen | Pfeiltasten, Leertaste / Touch-Tasten |
| Schlange | Futter sammeln, wachsen | Pfeiltasten / Wischen |
| Mauerbrecher | Ball abprallen lassen, Steine abräumen | Maus, Pfeiltasten / Finger |
| Minenfeld | Felder logisch aufdecken | Klick, Rechtsklick / Tippen, lang drücken |
| Paare | Gleiche Karten finden | Klick / Tippen |
| Zahlenschmelze | Kacheln schieben, gleiche Zahlen verschmelzen | Pfeiltasten / Wischen |
| Viererreihe | Vier in eine Linie, gegen den Computer | Klick, Pfeiltasten + Leertaste / Tippen |
| Sudoku | Ziffern 1–9 eintragen, zufällig erzeugte Rätsel | Klick + Zifferntasten / Ziffernleiste |
| Sternenwacht | Angreiferwellen abwehren | Maus, Pfeiltasten / Finger |
| Dreierkette | Steine tauschen, Dreierreihen bilden | Klick oder Ziehen |

`P` pausiert, `Esc` führt zurück zur Übersicht. Bestwerte liegen im `localStorage` des Browsers.

## Starten im Browser

ES-Module brauchen einen Webserver (kein Öffnen per `file://`):

```sh
npm start            # oder: python3 -m http.server 8000 --directory www
# http://localhost:8000
```

Für die Veröffentlichung als Web-App genügt statisches Hosting des Ordners `www/`.

## Store-App (Android / iOS)

Die Web-App wird mit [Capacitor](https://capacitorjs.com) in native Projekte verpackt.
Voraussetzung: Node 22+, für Android zusätzlich Android Studio, für iOS ein Mac mit Xcode.

```sh
npm install
npm run android      # Web-Code übernehmen und Android Studio öffnen
npm run ios          # Web-Code übernehmen und Xcode öffnen (nur macOS)
```

Nach jeder Änderung in `www/` einmal `npm run sync` ausführen.
Eine Debug-APK zum Testen baut GitHub Actions für jeden Pull Request und jeden Push auf `main` (Workflow „Android-Build“, Artefakt `spielekiste-debug-apk`).

Vor der ersten Veröffentlichung:

| Punkt | Wo |
|---|---|
| App-ID `de.spielekiste.app` durch eigene ersetzen (danach nicht mehr änderbar) | `capacitor.config.json`, `android/app/build.gradle` (`namespace`, `applicationId`), Paketordner von `MainActivity`, `android/app/src/main/res/values/strings.xml`, Bundle Identifier in Xcode |
| Version hochzählen | `versionCode`/`versionName` in `android/app/build.gradle`, Version/Build in Xcode |
| Signiertes Release bauen | Android Studio: *Generate Signed App Bundle* (.aab), Xcode: *Archive* |
| Icon / Startbild ändern | Vorlagen in `assets/` ersetzen, dann `npm run assets` |

## Aufbau

```
www/                  Web-App (einzige Quelle für den Spielcode)
  index.html          Grundgerüst (Menü + Spielansicht)
  css/style.css       Layout und Design
  js/app.js           Launcher, Routing, Bestwerte, gemeinsame Spiel-API (ctx)
  js/games/*.js       je ein Spiel pro Modul
  sw.js               Service Worker (offline, nur im Browser)
android/, ios/        native Projekte (Capacitor)
assets/               Vorlagen für App-Icon und Startbild
capacitor.config.json App-ID, App-Name
```

## Neues Spiel ergänzen

1. Modul in `www/js/games/` anlegen: `export default { id, name, icon, desc, help, start(ctx) }`.
2. In `www/js/app.js` importieren und in `GAMES` eintragen.
3. Datei in `www/sw.js` unter `FILES` aufnehmen und `CACHE` hochzählen.

`ctx` stellt bereit: `canvas(w, h)`, `loop(fn)`, `keys(fn)`, `swipe(fn)`, `pad(buttons)`,
`on(target, type, fn)`, `later(fn, ms)`, `score(n)`, `info(text)`, `end(score, won)`.
Alles darüber Registrierte wird beim Verlassen des Spiels automatisch aufgeräumt.
