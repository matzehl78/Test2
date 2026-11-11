# Spielekiste

Sammlung kleiner Spiele nach klassischen Spielprinzipien – als installierbare Web-App (PWA),
ohne Abhängigkeiten und ohne Build-Schritt.

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

## Starten

ES-Module brauchen einen Webserver (kein Öffnen per `file://`):

```sh
python3 -m http.server 8000
# http://localhost:8000
```

Für die Veröffentlichung genügt statisches Hosting, z. B. GitHub Pages aus dem Repo-Root.

## Aufbau

```
index.html            Grundgerüst (Menü + Spielansicht)
css/style.css         Layout und Design
js/app.js             Launcher, Routing, Bestwerte, gemeinsame Spiel-API (ctx)
js/games/*.js         je ein Spiel pro Modul
sw.js                 Service Worker (offline)
manifest.webmanifest  PWA-Manifest
```

## Neues Spiel ergänzen

1. Modul in `js/games/` anlegen: `export default { id, name, icon, desc, help, start(ctx) }`.
2. In `js/app.js` importieren und in `GAMES` eintragen.
3. Datei in `sw.js` unter `FILES` aufnehmen und `CACHE` hochzählen.

`ctx` stellt bereit: `canvas(w, h)`, `loop(fn)`, `keys(fn)`, `swipe(fn)`, `pad(buttons)`,
`on(target, type, fn)`, `later(fn, ms)`, `score(n)`, `info(text)`, `end(score, won)`.
Alles darüber Registrierte wird beim Verlassen des Spiels automatisch aufgeräumt.
