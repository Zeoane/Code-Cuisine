# Responsive-Dokumentation – Code à Cuisine

Stand: 21.09.2026 · geprüft auf 10 Breiten von 320 px bis 2560 px, 134 Kombinationen aus Ansicht × Breite

## Anforderungen

Laut README (Features → „Responsiv"). Verbindlich sind die Projekt-Checkliste und das Figma-Design. Wo das README davon abweicht, gilt Figma:

- **Mobile-first bis 320 px Breite** – nichts ragt über den Bildschirmrand, nichts wird abgeschnitten
- **Mindestschriftgröße 16 px** auf jeder Breite
- **Keine sichtbaren Scrollbalken**
- **Swipe-Interaktionen** für horizontale Reihen
- **Touch-Ziele ≥ 44 × 44 px**

## Breakpoints

Das Projekt nutzt die Tailwind-Standard-Breakpoints plus zwei eigene für die Startseite. Alle Stile sind mobile-first geschrieben: Die Klasse ohne Präfix gilt ab 0 px, jedes Präfix legt ab seiner Breite etwas darüber.

| Präfix | ab | Was sich ändert |
|---|---|---|
| *(keins)* | 0 px | Einspaltig, Burger-Menü, Mobil-Grafiken, Nährwerte im 2 × 2-Raster, Formularfelder untereinander |
| `min-[400px]` | 400 px | Startseite: Unterzeile 24 → 28 px, Titel 44 → 52 px |
| `sm` | 640 px | Größere Seitenränder, Überschriften 36 → 54 px, Desktop-Varianten der Rezept-Grafiken, Nährwerte in einer Reihe mit vier Spalten, Zutaten/Extras und Kochschritte zweispaltig, Portionen und Personen nebeneinander |
| `md` | 768 px | Kopfzeile: Navigation statt Burger-Menü · Generator: Eingabe und Zutatenliste nebeneinander · Ergebnisse und Bibliothek zweispaltig |
| `lg` | 1024 px | Startseite: Desktop-Teller-Collage · Kopfzeile zeigt eingeloggt die E-Mail · Ergebnisse: Kopf und Bild nebeneinander · Rezeptansicht: Titel und Nährwerte nebeneinander · Generator: Name und Menge nebeneinander |
| `xl` | 1280 px | Ergebnisse und Bibliothek dreispaltig · Kochbuch: Intro und „Most liked" nebeneinander, Küchen dreispaltig · Rezeptansicht ohne äußeren Rand |
| `min-[1440px]` | 1440 px | Startseite: Widescreen-Collage mit fünf Tellern |

Auf großen Monitoren bleibt der Inhalt auf eine Maximalbreite begrenzt (z. B. 1087 px im Generator, 1248 px in der Rezeptansicht, 1440 px für Kopfzeile und Startseite) und wird zentriert. Bei 1920 und 2560 px entstehen deshalb keine überlangen Zeilen.

## Ergebnis

✓ = alle Prüfungen bestanden · ✓¹ = bestanden, die zwei Eingabefelder haben die Figma-Höhe von 36 px (siehe „Anmerkungen") · – = Ansicht existiert auf dieser Breite nicht

| Ansicht | Route | 320 | 375 | 414 | 640 | 768 | 1024 | 1280 | 1440 | 1920 | 2560 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Startseite | `/` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Zutaten | `/generator` | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| Präferenzen | `/preferences` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ladeansicht | `/loading` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ergebnisse | `/results` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Rezeptansicht | `/recipe/:index` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bibliothek | `/library` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bibliothek – Detail | `/library/:id` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Kochbuch | `/cookbook` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Küchen-Liste | `/recipes/:cuisine` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Login | `/login` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Impressum | `/impressum` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 404 | `/irgendwas` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mobilmenü offen | `/library` | ✓ | ✓ | ✓ | ✓ | – | – | – | – | – | – |

Geprüft wurde pro Ansicht und Breite:

| Prüfung | Kriterium | Ergebnis |
|---|---|---|
| Horizontaler Überlauf | Kein sichtbares Element ragt über den Bildschirmrand hinaus (ausgenommen Inhalte in absichtlich horizontal scrollenden Reihen und dekorative Grafiken) | 0 Treffer in 134 Kombinationen |
| Schriftgröße | Kleinste gerenderte Schriftgröße sichtbaren Texts | 16 px überall |
| Scrollbalken | Breite des sichtbaren Seiten-Scrollbalkens | 0 px überall |
| Touch-Ziele | Trefferfläche jedes Links, Buttons und Eingabefelds, inkl. der unsichtbaren `.tap-target`-Fläche | ≥ 44 × 44 px, außer zwei Eingabefeldern in Figma-Höhe (36 px) |
| Überschriften | Genau ein `h1` pro Ansicht | überall erfüllt |

## Behobene Probleme

Die Messung hat fünf echte Layoutfehler gefunden, die inzwischen behoben sind:

1. **Rezeptansicht, schmale Smartphones: „Carbs" war unsichtbar.** Die vier festen Nährwert-Spalten aus Figma brauchen 331 px. Bis 398 px lag die Spalte „Carbs" ganz oder teilweise außerhalb des Bildschirms, bis 466 px ragte die Reihe über die Karte hinaus. → Unter `sm` (640 px) jetzt ein 2 × 2-Raster, darüber wie im Design.
2. **Generator, 640 bis etwa 680 px: Löschen-Buttons außerhalb des Bildschirms.** Eingabe und Zutatenliste standen schon ab `sm` nebeneinander. Das Formular war aber breiter als seine Hälfte und schob die Liste über den rechten Rand. → Nebeneinander erst ab `md`.
3. **Generator, ab 768 px: Namensfeld nur 95 px breit.** → Name und Menge stehen jetzt erst ab `lg` nebeneinander. Das Feld ist auf jeder Breite mindestens 185 px breit.
4. **Ladeansicht ohne Überschrift.** „Generating" ist jetzt das `h1` der Seite, optisch unverändert.
5. **Kochbuch: Seite intern rund 1400 px breit.** Die Screenreader-Labels (`sr-only`) in den „Most liked"-Karten sind absolut positioniert und hatten innerhalb der scrollbaren Reihe keinen positionierten Vorfahren. Dadurch entkamen sie dem Clipping der Reihe und dehnten das Dokument auf jeder Breite auf etwa 1400 px. Sichtbar wurde das nur nicht, weil `html` und `body` `overflow-x: hidden` haben. Chromium und WebKit melden es beide, auf iOS hätte man die Seite womöglich seitlich wischen können. → Die Reihe hat jetzt `relative`, die Seite ist überall genau so breit wie der Bildschirm.

Zusätzlich haben weitere Bedienelemente eine 44 px große Trefferfläche bekommen, ohne dass sich ihre Optik ändert (`.tap-target` in `styles.css`): die Logo-Links in den Seitenköpfen, die Zurück-Links, „Generate new recipe", „Back to home", die Seitennavigation der Küchen-Liste und der Einheiten-Umschalter.

## Anmerkungen

- **Zwei Eingabefelder sind 36 px hoch** (Zutatenname, Menge im Generator), genau wie im Figma-Design (`h-9`). Checkliste und Figma sind die Vorgabe. Die 44-px-Angabe stammt aus dem README und wird hier bewusst nicht umgesetzt. Die WCAG-Mindestgröße für AA (24 px, Kriterium 2.5.8) ist erfüllt.
- **Einträge im Einheiten-Dropdown sind 32 px hoch** (laut Code: `py-1` + 24 px Zeilenhöhe). Die Einträge stehen ohne Abstand untereinander, eine unsichtbare Vergrößerung würde sie überlappen lassen. Diese Liste war während der automatischen Messung geschlossen und ist deshalb nicht in der Tabelle oben enthalten.

## Testaufbau

Die Screenshots und Messungen stammen aus einem automatisierten Durchlauf mit Playwright (Chromium) auf einer Kopie des Projekts. Die Kopie weicht nur in der Datenquelle vom echten Projekt ab, Layout und Stile sind identisch:

- **Rezepte kommen vom eingebauten Mock-Generator** statt von n8n. Dadurch hat der Durchlauf kein Tageslimit verbraucht.
- **Die Bibliothek liegt im Speicher** statt in Firestore und enthält die drei Rezepte aus dem Durchlauf.
- **Das Kochbuch ist ohne Login erreichbar**, damit es fotografiert werden kann.
- **Schriften kommen lokal** (Quicksand und Ubuntu aus `@fontsource`) statt von Google Fonts. Die Testumgebung erreicht Google nicht.

Pro Breite wird der echte Nutzerweg durchlaufen: fünf Zutaten eingeben → Präferenzen wählen → generieren → Ergebnisse → Rezept → Bibliothek → Detail → Kochbuch → Küchen-Liste. Dazu kommen Startseite, Login, Impressum, 404 und unter 768 px das geöffnete Mobilmenü. Die Ladeansicht ist 2,5 s nach dem Start aufgenommen, mitten in der Animation.

Manuell gegengeprüft auf iPhone SE und iPhone 16 Pro Max (alle Ansichten bis 768 px): ohne Befund.

Geprüfte Breiten: 320 (kleinstes Ziel), 375 (iPhone), 414 (große Smartphones), 640 (`sm`), 768 (`md`, Tablet hochkant), 1024 (`lg`, Tablet quer), 1280 (`xl`), 1440 (Figma-Desktop), 1920 (Full HD), 2560 (WQHD).

## Screenshots

Ganzseitige Aufnahmen auf 320, 768, 1440 und 1920 px. Ein Klick öffnet das Bild in voller Größe.

#### Startseite — `/`

320 px · 768 px · 1440 px · 1920 px

<a href="responsive/home-320.webp"><img src="responsive/home-320.webp" width="150" alt="Startseite, 320 px"></a> <a href="responsive/home-768.webp"><img src="responsive/home-768.webp" width="220" alt="Startseite, 768 px"></a> <a href="responsive/home-1440.webp"><img src="responsive/home-1440.webp" width="220" alt="Startseite, 1440 px"></a> <a href="responsive/home-1920.webp"><img src="responsive/home-1920.webp" width="220" alt="Startseite, 1920 px"></a>

#### Zutaten — `/generator`

320 px · 768 px · 1440 px · 1920 px

<a href="responsive/generator-320.webp"><img src="responsive/generator-320.webp" width="150" alt="Zutaten, 320 px"></a> <a href="responsive/generator-768.webp"><img src="responsive/generator-768.webp" width="220" alt="Zutaten, 768 px"></a> <a href="responsive/generator-1440.webp"><img src="responsive/generator-1440.webp" width="220" alt="Zutaten, 1440 px"></a> <a href="responsive/generator-1920.webp"><img src="responsive/generator-1920.webp" width="220" alt="Zutaten, 1920 px"></a>

#### Präferenzen — `/preferences`

320 px · 768 px · 1440 px · 1920 px

<a href="responsive/preferences-320.webp"><img src="responsive/preferences-320.webp" width="150" alt="Präferenzen, 320 px"></a> <a href="responsive/preferences-768.webp"><img src="responsive/preferences-768.webp" width="220" alt="Präferenzen, 768 px"></a> <a href="responsive/preferences-1440.webp"><img src="responsive/preferences-1440.webp" width="220" alt="Präferenzen, 1440 px"></a> <a href="responsive/preferences-1920.webp"><img src="responsive/preferences-1920.webp" width="220" alt="Präferenzen, 1920 px"></a>

#### Ladeansicht — `/loading`

320 px · 768 px · 1440 px · 1920 px

<a href="responsive/loading-320.webp"><img src="responsive/loading-320.webp" width="150" alt="Ladeansicht, 320 px"></a> <a href="responsive/loading-768.webp"><img src="responsive/loading-768.webp" width="220" alt="Ladeansicht, 768 px"></a> <a href="responsive/loading-1440.webp"><img src="responsive/loading-1440.webp" width="220" alt="Ladeansicht, 1440 px"></a> <a href="responsive/loading-1920.webp"><img src="responsive/loading-1920.webp" width="220" alt="Ladeansicht, 1920 px"></a>

#### Ergebnisse — `/results`

320 px · 768 px · 1440 px · 1920 px

<a href="responsive/results-320.webp"><img src="responsive/results-320.webp" width="150" alt="Ergebnisse, 320 px"></a> <a href="responsive/results-768.webp"><img src="responsive/results-768.webp" width="220" alt="Ergebnisse, 768 px"></a> <a href="responsive/results-1440.webp"><img src="responsive/results-1440.webp" width="220" alt="Ergebnisse, 1440 px"></a> <a href="responsive/results-1920.webp"><img src="responsive/results-1920.webp" width="220" alt="Ergebnisse, 1920 px"></a>

#### Rezeptansicht — `/recipe/:index`

320 px · 768 px · 1440 px · 1920 px

<a href="responsive/recipe-view-320.webp"><img src="responsive/recipe-view-320.webp" width="150" alt="Rezeptansicht, 320 px"></a> <a href="responsive/recipe-view-768.webp"><img src="responsive/recipe-view-768.webp" width="220" alt="Rezeptansicht, 768 px"></a> <a href="responsive/recipe-view-1440.webp"><img src="responsive/recipe-view-1440.webp" width="220" alt="Rezeptansicht, 1440 px"></a> <a href="responsive/recipe-view-1920.webp"><img src="responsive/recipe-view-1920.webp" width="220" alt="Rezeptansicht, 1920 px"></a>

#### Bibliothek — `/library`

320 px · 768 px · 1440 px · 1920 px

<a href="responsive/library-320.webp"><img src="responsive/library-320.webp" width="150" alt="Bibliothek, 320 px"></a> <a href="responsive/library-768.webp"><img src="responsive/library-768.webp" width="220" alt="Bibliothek, 768 px"></a> <a href="responsive/library-1440.webp"><img src="responsive/library-1440.webp" width="220" alt="Bibliothek, 1440 px"></a> <a href="responsive/library-1920.webp"><img src="responsive/library-1920.webp" width="220" alt="Bibliothek, 1920 px"></a>

#### Bibliothek – Detail — `/library/:id`

320 px · 768 px · 1440 px · 1920 px

<a href="responsive/library-detail-320.webp"><img src="responsive/library-detail-320.webp" width="150" alt="Bibliothek – Detail, 320 px"></a> <a href="responsive/library-detail-768.webp"><img src="responsive/library-detail-768.webp" width="220" alt="Bibliothek – Detail, 768 px"></a> <a href="responsive/library-detail-1440.webp"><img src="responsive/library-detail-1440.webp" width="220" alt="Bibliothek – Detail, 1440 px"></a> <a href="responsive/library-detail-1920.webp"><img src="responsive/library-detail-1920.webp" width="220" alt="Bibliothek – Detail, 1920 px"></a>

#### Kochbuch — `/cookbook`

320 px · 768 px · 1440 px · 1920 px

<a href="responsive/cookbook-320.webp"><img src="responsive/cookbook-320.webp" width="150" alt="Kochbuch, 320 px"></a> <a href="responsive/cookbook-768.webp"><img src="responsive/cookbook-768.webp" width="220" alt="Kochbuch, 768 px"></a> <a href="responsive/cookbook-1440.webp"><img src="responsive/cookbook-1440.webp" width="220" alt="Kochbuch, 1440 px"></a> <a href="responsive/cookbook-1920.webp"><img src="responsive/cookbook-1920.webp" width="220" alt="Kochbuch, 1920 px"></a>

#### Küchen-Liste — `/recipes/:cuisine`

320 px · 768 px · 1440 px · 1920 px

<a href="responsive/cuisine-320.webp"><img src="responsive/cuisine-320.webp" width="150" alt="Küchen-Liste, 320 px"></a> <a href="responsive/cuisine-768.webp"><img src="responsive/cuisine-768.webp" width="220" alt="Küchen-Liste, 768 px"></a> <a href="responsive/cuisine-1440.webp"><img src="responsive/cuisine-1440.webp" width="220" alt="Küchen-Liste, 1440 px"></a> <a href="responsive/cuisine-1920.webp"><img src="responsive/cuisine-1920.webp" width="220" alt="Küchen-Liste, 1920 px"></a>

#### Login — `/login`

320 px · 768 px · 1440 px · 1920 px

<a href="responsive/login-320.webp"><img src="responsive/login-320.webp" width="150" alt="Login, 320 px"></a> <a href="responsive/login-768.webp"><img src="responsive/login-768.webp" width="220" alt="Login, 768 px"></a> <a href="responsive/login-1440.webp"><img src="responsive/login-1440.webp" width="220" alt="Login, 1440 px"></a> <a href="responsive/login-1920.webp"><img src="responsive/login-1920.webp" width="220" alt="Login, 1920 px"></a>

#### Impressum — `/impressum`

320 px · 768 px · 1440 px · 1920 px

<a href="responsive/impressum-320.webp"><img src="responsive/impressum-320.webp" width="150" alt="Impressum, 320 px"></a> <a href="responsive/impressum-768.webp"><img src="responsive/impressum-768.webp" width="220" alt="Impressum, 768 px"></a> <a href="responsive/impressum-1440.webp"><img src="responsive/impressum-1440.webp" width="220" alt="Impressum, 1440 px"></a> <a href="responsive/impressum-1920.webp"><img src="responsive/impressum-1920.webp" width="220" alt="Impressum, 1920 px"></a>

#### 404 — `/irgendwas`

320 px · 768 px · 1440 px · 1920 px

<a href="responsive/not-found-320.webp"><img src="responsive/not-found-320.webp" width="150" alt="404, 320 px"></a> <a href="responsive/not-found-768.webp"><img src="responsive/not-found-768.webp" width="220" alt="404, 768 px"></a> <a href="responsive/not-found-1440.webp"><img src="responsive/not-found-1440.webp" width="220" alt="404, 1440 px"></a> <a href="responsive/not-found-1920.webp"><img src="responsive/not-found-1920.webp" width="220" alt="404, 1920 px"></a>

#### Mobilmenü offen — `/library`

320 px

<a href="responsive/menu-open-320.webp"><img src="responsive/menu-open-320.webp" width="150" alt="Mobilmenü offen, 320 px"></a>

