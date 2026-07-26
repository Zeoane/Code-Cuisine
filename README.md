# Code à Cuisine

**AI-Powered recipe generator** – ein Schulprojekt. Die Webanwendung generiert aus
deinen vorhandenen Zutaten automatisch passende Rezepte und speichert Favoriten in
einem persönlichen Kochbuch.

## Features

| Feature | Beschreibung |
|---|---|
| Hero-Landingpage | Pixelgenau nach Figma-Design (Dunkelgrün `#396039`, Ubuntu Bold, Quicksand, kreisförmige Teller-Bilder, Get-started-CTA) |
| Zutaten-Eingabe | Zutaten einzeln hinzufügen/entfernen, Chip-/Tag-Darstellung |
| Rezeptgenerierung | Erzeugt genau 3 Rezepte mit Zutaten, Schritten, Schwierigkeitsgrad, Kochzeit, Portionen, Nährwerten und fehlenden Basiszutaten |
| Generator-Optionen | Portionen, Zeitrahmen, Kochstil (Deutsch, Italienisch, Japanisch, Indisch, Gourmet, Fusion), Ernährungsweise und 1–3 Kochhelfer mit Arbeitsaufteilung (parallele Schritte) |
| Rezeptanzeige | Rezeptkarten mit Metadaten-Badges, Nährwerten und aufklappbarer Schritt-für-Schritt-Anleitung; mobil als Swipe-Karten |
| Rezept-Bibliothek | Alle generierten Rezepte öffentlich einsehbar, filterbar nach Küchen-Kategorie, mit Detailseite (`/library/:id`) |
| Kochbuch | Rezepte speichern, abrufen und entfernen |
| Impressum | Platzhalter-Impressum gemäß § 5 TMG (`/impressum`) |
| Responsiv | Mobile-first bis 320 px Breite, Mindestschriftgröße 16 px auf Mobilgeräten, keine sichtbaren Scrollbalken, Swipe-Interaktionen, Touch-Ziele ≥ 44 px |

## Aktueller Stand & nächste Schritte

Dieses Projekt wurde von einer React-Version auf **Angular** umgestellt und von allen
Fremdanbieter-Abhängigkeiten (vormals Manus) befreit, damit es vollständig lokal in
VS Code läuft.

Rezeptgenerierung, Bibliothek und Kochbuch funktionieren bereits vollständig – aktuell
mit einem clientseitigen Mock-Generator statt einem echten LLM-Aufruf, und mit
`localStorage` statt einer echten Datenbank. Das hält die App sofort lauffähig, ohne
Server oder Zugangsdaten.

Geplante nächste Schritte (bewusst noch offen, siehe Checkliste):

- **Firebase**: Speicherung aller generierten Rezepte (Bibliothek) und des
  persönlichen Kochbuchs inkl. Login, statt `localStorage`.
- **n8n**: Workflow, der die eigentliche KI-Rezeptgenerierung übernimmt
  (Fehlerbehandlung/Logging, IP-basiertes Quota- und Rate-Limiting, erneute
  Datenvalidierung der Angular-Eingaben, klar definierte JSON-Struktur zwischen
  Angular und n8n).

Der `RecipeGeneratorService` (`src/app/core/services/recipe-generator.service.ts`)
ist bewusst isoliert gehalten, damit er später einfach durch einen HTTP-Aufruf an
n8n ersetzt werden kann, ohne die Komponenten anzufassen. Gleiches gilt für
`LibraryService` und `CookbookService`, die aktuell `localStorage` kapseln und später
durch Firebase-Aufrufe ersetzt werden.

## Code-Konventionen

- Jede Funktion übernimmt eine Aufgabe und bleibt kurz und fokussiert
- Alle Funktionen tragen kurze englische JSDoc-Kommentare
- Dateien bleiben unter 400 Zeilen
- Semantisches HTML (`header`, `nav`, `main`, `section`, `article`, `footer`)
- Ausschließlich native Angular-Kontrollstrukturen (`@if`, `@for`) und Tailwind CSS,
  kein zusätzliches UI-Framework

## Tech-Stack

Angular 18 (Standalone Components) · TypeScript · Tailwind CSS 3 · RxJS

## Projektstruktur (Auszug)

```
src/
  index.html              # Fonts (Ubuntu, Quicksand)
  styles.css              # Tailwind-Einstieg, Scrollbar-/Mobile-Regeln
  assets/img/hero/        # Bilder (Logo, Teller)
  app/
    core/
      models/             # Recipe-Typen (Angular-Pendant zu shared/recipes.ts)
      data/                # Labels & Kochstil-Presets für den Mock-Generator
      services/            # RecipeGeneratorService, LibraryService, CookbookService, ToastService
    shared/
      icon/                # Kleines, abhängigkeitsfreies Inline-SVG-Icon-Set
      toast/               # Globale Toast-Anzeige
    layout/                # SiteHeader (Navigation), SiteFooter
    hero/                  # Logo, HeroPlates (Landingpage-Grafik)
    pages/                 # Home, Generator, Library, RecipeDetail, Cookbook, Imprint, NotFound
    recipes/               # IngredientInput, GeneratorOptions, RecipeResults, RecipeCard, RecipeMeta, RecipeSteps, RecipeNutrition
```

## Lokal entwickeln (VS Code)

1. Repository klonen bzw. Ordner in VS Code öffnen
2. Abhängigkeiten installieren: `npm install`
3. Dev-Server starten: `npm start` → http://localhost:4200
4. Tests ausführen: `npm test`
5. Produktions-Build: `npm run build`

Empfohlene VS Code-Erweiterung: **Angular Language Service** für Template-Autovervollständigung.

Es wird keine `.env`-Datei und kein Backend benötigt – die App läuft komplett im
Browser (siehe "Aktueller Stand" oben).

## Git & GitHub

```bash
git add .
git commit -m "Von React auf Angular umgestellt"
git remote add origin <dein-github-repo-url>
git push -u origin main
```

Committe nach jeder Coding-Session mit aussagekräftigen Nachrichten – dein
GitHub-Profil ist deine Visitenkarte.
