# Cross-Browser-Test – Code à Cuisine

Stand: 21.09.2026 · Checkliste Punkt 8

| Browser | Engine | Wie getestet | Ergebnis |
|---|---|---|---|
| Chrome | Blink | automatisch, 10 Breiten × 14 Ansichten (siehe [RESPONSIVE.md](RESPONSIVE.md)) | ✓ |
| Safari | WebKit | automatisch mit WebKitGTK 2.52, 10 Breiten × 14 Ansichten | ✓ |
| Firefox | Gecko | manuell, siehe Checkliste unten | _offen_ |
| Edge | Blink | manuell, siehe Checkliste unten | _offen_ |

## Safari (WebKit)

### Warum WebKitGTK

Für den Test stand kein Apple-Gerät zur Verfügung. Safari baut auf der Engine WebKit auf, die es als WebKitGTK auch für Linux gibt. Layout, CSS und JavaScript laufen dort durch denselben Engine-Code wie in Safari (WebCore, JavaScriptCore). Getestet wurde mit WebKitGTK 2.52.6 (User-Agent `AppleWebKit/605.1.15 … Safari/605.1.15`), gesteuert über WebDriver.

**Nicht abgedeckt** sind Eigenheiten, die nur Apples eigene Safari-Version hat: das Scroll- und Wischverhalten auf dem iPhone, `100vh` mit ein- und ausfahrender Adressleiste, das automatische Zoomen in Eingabefelder unter 16 px (hier nicht relevant, alle Felder haben 16 px) und Apples Systemschriften. Die App lädt ihre Schriften selbst (Quicksand, Ubuntu), deshalb sollte der letzte Punkt keine Rolle spielen.

### Ablauf

Derselbe Nutzerweg und dieselben Prüfungen wie beim Chromium-Durchlauf für die Responsive-Doku: fünf Zutaten eingeben → Präferenzen → generieren → Ergebnisse → Rezept → Bibliothek → Detail → Kochbuch → Küchen-Liste, dazu Startseite, Login, Impressum, 404 und das Mobilmenü. Zusätzlich wurden Konsolenfehler, unbehandelte Fehler und abgelehnte Promises mitgeschrieben.

Weil sich das WebKit-Fenster nicht schmaler als 447 px machen lässt, lief jede Seite in einem `iframe` mit exakt der Zielbreite. Media Queries richten sich dort nach der Breite des Frames, also genau wie auf einem Gerät dieser Breite. Die gemessene `innerWidth` entsprach in allen 134 Fällen der Zielbreite.

### Ergebnis

| Ansicht | 320 | 375 | 414 | 640 | 768 | 1024 | 1280 | 1440 | 1920 | 2560 |
|---|---|---|---|---|---|---|---|---|---|---|
| Startseite | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Zutaten | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| Präferenzen | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ladeansicht | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ergebnisse | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Rezeptansicht | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bibliothek | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bibliothek – Detail | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Kochbuch | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Küchen-Liste | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Login | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Impressum | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 404 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mobilmenü offen | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – |

✓ = alle Prüfungen bestanden · ✓¹ = bestanden, die zwei Eingabefelder haben die Figma-Höhe von 36 px (siehe RESPONSIVE.md) · – = Ansicht existiert auf dieser Breite nicht

| Prüfung | Ergebnis in WebKit |
|---|---|
| Horizontaler Überlauf | 0 Treffer in 134 Kombinationen |
| Dokumentbreite = Bildschirmbreite | überall |
| Kleinste Schriftgröße | 16 px |
| Sichtbare Scrollbalken | keine |
| Touch-Ziele | ≥ 44 × 44 px, außer den zwei Eingabefeldern in Figma-Höhe |
| Genau ein `h1` | überall |
| Konsolenfehler / unbehandelte Fehler | **0** |

### Unterschiede zu Chrome

Die Screenshots beider Engines wurden Pixel für Pixel verglichen. Layout, Abstände, Farben und Umbrüche der Komponenten sind gleich. Gefunden wurden nur:

- **Leicht andere Textbreiten.** WebKit rendert die Schrift minimal breiter. Auf 320 px bricht deshalb „Most liked recipes" im Kochbuch in zwei Zeilen um, in Chrome passt es in eine. Nichts wird abgeschnitten oder überlagert.
- **Kochbuch-Seite zu breit – in beiden Engines, inzwischen behoben.** Die Screenreader-Labels in den „Most liked"-Karten dehnten das Dokument auf etwa 1400 px. Details unter „Behobene Probleme" in [RESPONSIVE.md](RESPONSIVE.md). Das war genau die Stelle, an der ein iPhone die Seite womöglich seitlich hätte wischen lassen.

### Screenshots (WebKit)

**Startseite** — 320 px · 1440 px

<a href="cross-browser/webkit/home-320.webp"><img src="cross-browser/webkit/home-320.webp" width="150" alt="Startseite, WebKit, 320 px"></a> <a href="cross-browser/webkit/home-1440.webp"><img src="cross-browser/webkit/home-1440.webp" width="300" alt="Startseite, WebKit, 1440 px"></a>

**Zutaten** — 320 px · 1440 px

<a href="cross-browser/webkit/generator-320.webp"><img src="cross-browser/webkit/generator-320.webp" width="150" alt="Zutaten, WebKit, 320 px"></a> <a href="cross-browser/webkit/generator-1440.webp"><img src="cross-browser/webkit/generator-1440.webp" width="300" alt="Zutaten, WebKit, 1440 px"></a>

**Präferenzen** — 320 px · 1440 px

<a href="cross-browser/webkit/preferences-320.webp"><img src="cross-browser/webkit/preferences-320.webp" width="150" alt="Präferenzen, WebKit, 320 px"></a> <a href="cross-browser/webkit/preferences-1440.webp"><img src="cross-browser/webkit/preferences-1440.webp" width="300" alt="Präferenzen, WebKit, 1440 px"></a>

**Ladeansicht** — 320 px · 1440 px

<a href="cross-browser/webkit/loading-320.webp"><img src="cross-browser/webkit/loading-320.webp" width="150" alt="Ladeansicht, WebKit, 320 px"></a> <a href="cross-browser/webkit/loading-1440.webp"><img src="cross-browser/webkit/loading-1440.webp" width="300" alt="Ladeansicht, WebKit, 1440 px"></a>

**Ergebnisse** — 320 px · 1440 px

<a href="cross-browser/webkit/results-320.webp"><img src="cross-browser/webkit/results-320.webp" width="150" alt="Ergebnisse, WebKit, 320 px"></a> <a href="cross-browser/webkit/results-1440.webp"><img src="cross-browser/webkit/results-1440.webp" width="300" alt="Ergebnisse, WebKit, 1440 px"></a>

**Rezeptansicht** — 320 px · 1440 px

<a href="cross-browser/webkit/recipe-view-320.webp"><img src="cross-browser/webkit/recipe-view-320.webp" width="150" alt="Rezeptansicht, WebKit, 320 px"></a> <a href="cross-browser/webkit/recipe-view-1440.webp"><img src="cross-browser/webkit/recipe-view-1440.webp" width="300" alt="Rezeptansicht, WebKit, 1440 px"></a>

**Bibliothek** — 320 px · 1440 px

<a href="cross-browser/webkit/library-320.webp"><img src="cross-browser/webkit/library-320.webp" width="150" alt="Bibliothek, WebKit, 320 px"></a> <a href="cross-browser/webkit/library-1440.webp"><img src="cross-browser/webkit/library-1440.webp" width="300" alt="Bibliothek, WebKit, 1440 px"></a>

**Bibliothek – Detail** — 320 px · 1440 px

<a href="cross-browser/webkit/library-detail-320.webp"><img src="cross-browser/webkit/library-detail-320.webp" width="150" alt="Bibliothek – Detail, WebKit, 320 px"></a> <a href="cross-browser/webkit/library-detail-1440.webp"><img src="cross-browser/webkit/library-detail-1440.webp" width="300" alt="Bibliothek – Detail, WebKit, 1440 px"></a>

**Kochbuch** — 320 px · 1440 px

<a href="cross-browser/webkit/cookbook-320.webp"><img src="cross-browser/webkit/cookbook-320.webp" width="150" alt="Kochbuch, WebKit, 320 px"></a> <a href="cross-browser/webkit/cookbook-1440.webp"><img src="cross-browser/webkit/cookbook-1440.webp" width="300" alt="Kochbuch, WebKit, 1440 px"></a>

**Küchen-Liste** — 320 px · 1440 px

<a href="cross-browser/webkit/cuisine-320.webp"><img src="cross-browser/webkit/cuisine-320.webp" width="150" alt="Küchen-Liste, WebKit, 320 px"></a> <a href="cross-browser/webkit/cuisine-1440.webp"><img src="cross-browser/webkit/cuisine-1440.webp" width="300" alt="Küchen-Liste, WebKit, 1440 px"></a>

**Login** — 320 px · 1440 px

<a href="cross-browser/webkit/login-320.webp"><img src="cross-browser/webkit/login-320.webp" width="150" alt="Login, WebKit, 320 px"></a> <a href="cross-browser/webkit/login-1440.webp"><img src="cross-browser/webkit/login-1440.webp" width="300" alt="Login, WebKit, 1440 px"></a>

**Impressum** — 320 px · 1440 px

<a href="cross-browser/webkit/impressum-320.webp"><img src="cross-browser/webkit/impressum-320.webp" width="150" alt="Impressum, WebKit, 320 px"></a> <a href="cross-browser/webkit/impressum-1440.webp"><img src="cross-browser/webkit/impressum-1440.webp" width="300" alt="Impressum, WebKit, 1440 px"></a>

**404** — 320 px · 1440 px

<a href="cross-browser/webkit/not-found-320.webp"><img src="cross-browser/webkit/not-found-320.webp" width="150" alt="404, WebKit, 320 px"></a> <a href="cross-browser/webkit/not-found-1440.webp"><img src="cross-browser/webkit/not-found-1440.webp" width="300" alt="404, WebKit, 1440 px"></a>

**Mobilmenü offen** — 320 px

<a href="cross-browser/webkit/menu-open-320.webp"><img src="cross-browser/webkit/menu-open-320.webp" width="150" alt="Mobilmenü offen, WebKit, 320 px"></a>


## Firefox und Edge – manuelle Prüfung

Firefox nutzt mit Gecko eine eigene, dritte Engine. Edge baut auf Chromium auf und verhält sich wie Chrome, dort reicht ein kurzer Durchklick. In beiden Browsern mit `ng serve` auf `localhost:4200`. Die Punkte 6 und 7 brauchen eine echte Generierung und kosten damit je Browser eine der drei Tagesgenerierungen:

| # | Was prüfen | Firefox | Edge |
|---|---|---|---|
| 1 | Startseite: Teller-Collage, Schriften (Quicksand/Ubuntu), „Get started" | | |
| 2 | Generator: Autovervollständigung mit Maus **und** Pfeiltasten/Enter/Escape | | |
| 3 | Generator: Mengenfeld ohne Pfeil-Spinner, Einheiten-Dropdown öffnet und schließt | | |
| 4 | Zutat bearbeiten: leeres Feld → Häkchen ausgegraut | | |
| 5 | Präferenzen: Chips, Stepper, Diät-Hinweis bei Konflikt | | |
| 6 | Ladeanimation läuft einmal durch, danach Ergebnisse | | |
| 7 | Rezeptansicht: Nährwerte, Makro-Balken, Herz anklicken | | |
| 8 | Kochbuch: „Most liked"-Reihe mit Maus ziehen und mit dem Mausrad scrollen | | |
| 9 | Bibliothek: Filter, Seitenwechsel, Detailseite mit „Directions" auf/zu | | |
| 10 | Impressum öffnen, **per Browser-Zurück** verlassen: Seite scrollt danach noch | | |
| 11 | DevTools → Responsive-Modus auf 320 px: nichts ragt über den Rand | | |
| 12 | Konsole (F12) während des ganzen Durchlaufs ohne rote Fehler | | |

Bekannt und harmlos: Firefox meldet im Dev-Server eine Sicherheitswarnung zu `file:///`-Links aus Vite. Das betrifft nur `ng serve` und nicht den Produktions-Build.
