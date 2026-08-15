# Code à Cuisine

**AI-Powered recipe generator** – Schulprojekt / school project.

## Inhaltsverzeichnis / Table of Contents

**Deutsch**

- [Überblick](#de-ueberblick)
- [Features](#de-features)
- [Aktueller Stand & nächste Schritte](#de-aktueller-stand)
- [Code-Konventionen](#de-code-konventionen)
- [Tech-Stack](#de-tech-stack)
- [Projektstruktur](#de-projektstruktur)
- [Lokal entwickeln (VS Code)](#de-lokal-entwickeln)
- [Git & GitHub](#de-git-github)

**English**

- [Overview](#en-overview)
- [Features](#en-features)
- [Current Status & Next Steps](#en-current-status)
- [Code Conventions](#en-code-conventions)
- [Tech Stack](#en-tech-stack)
- [Project Structure](#en-project-structure)
- [Local Development (VS Code)](#en-local-development)
- [Git & GitHub](#en-git-github)

---

## Deutsch

<a id="de-ueberblick"></a>

### Überblick

Die Webanwendung generiert aus deinen vorhandenen Zutaten automatisch passende
Rezepte und speichert Favoriten in einem persönlichen Kochbuch.

<a id="de-features"></a>

### Features

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

<a id="de-aktueller-stand"></a>

### Aktueller Stand & nächste Schritte

Dieses Projekt wurde von einer React-Version auf **Angular** umgestellt und von allen
Fremdanbieter-Abhängigkeiten (vormals Manus) befreit, damit es vollständig lokal in
VS Code läuft.

Rezeptgenerierung, Bibliothek und Kochbuch funktionieren bereits vollständig – aktuell
mit einem clientseitigen Mock-Generator statt einem echten LLM-Aufruf, und mit
`localStorage` statt einer echten Datenbank. Das hält die App sofort lauffähig, ohne
Server oder Zugangsdaten.

**Firebase Auth ist bereits angebunden**: Registrierung/Login per E-Mail & Passwort
sowie Google-Login (`AuthService`, `authGuard`, `/login`-Seite), aktuell ausschließlich
zum Schützen der `/cookbook`-Route. Dazu eine echte Firebase-Projektkonfiguration in
`src/environments/environment.ts` nötig (siehe `environment.example.ts`) – lokal ohne
Firebase-Projekt startet die App weiterhin, Login schlägt dann lediglich fehl.

Geplante nächste Schritte (bewusst noch offen, siehe Checkliste):

- **Firebase Firestore**: Speicherung aller generierten Rezepte (Bibliothek) und des
  persönlichen Kochbuchs, statt `localStorage`.
- **n8n**: Workflow, der die eigentliche KI-Rezeptgenerierung übernimmt
  (Fehlerbehandlung/Logging, IP-basiertes Quota- und Rate-Limiting, erneute
  Datenvalidierung der Angular-Eingaben, klar definierte JSON-Struktur zwischen
  Angular und n8n).

Der `RecipeGeneratorService` (`src/app/core/services/recipe-generator.service.ts`)
ist bewusst isoliert gehalten, damit er später einfach durch einen HTTP-Aufruf an
n8n ersetzt werden kann, ohne die Komponenten anzufassen. Gleiches gilt für
`LibraryService` und `CookbookService`, die aktuell `localStorage` kapseln und später
durch Firebase-Aufrufe ersetzt werden.

<a id="de-code-konventionen"></a>

### Code-Konventionen

- Jede Funktion übernimmt eine Aufgabe und bleibt kurz und fokussiert
- Alle Funktionen tragen kurze englische JSDoc-Kommentare
- Dateien bleiben unter 400 Zeilen
- Semantisches HTML (`header`, `nav`, `main`, `section`, `article`, `footer`)
- Ausschließlich native Angular-Kontrollstrukturen (`@if`, `@for`) und Tailwind CSS,
  kein zusätzliches UI-Framework

<a id="de-tech-stack"></a>

### Tech-Stack

Angular 18 (Standalone Components) · TypeScript · Tailwind CSS 3 · RxJS

<a id="de-projektstruktur"></a>

### Projektstruktur (Auszug)

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

<a id="de-lokal-entwickeln"></a>

### Lokal entwickeln (VS Code)

1. Repository klonen bzw. Ordner in VS Code öffnen
2. Abhängigkeiten installieren: `npm install`
3. Dev-Server starten: `npm start` → http://localhost:4200
4. Tests ausführen: `npm test`
5. Produktions-Build: `npm run build`

Empfohlene VS Code-Erweiterung: **Angular Language Service** für Template-Autovervollständigung.

Es wird keine `.env`-Datei und kein Backend benötigt – die App läuft komplett im
Browser (siehe "Aktueller Stand" oben).

<a id="de-git-github"></a>

### Git & GitHub

```bash
git add .
git commit -m "Von React auf Angular umgestellt"
git remote add origin <dein-github-repo-url>
git push -u origin main
```

Committe nach jeder Coding-Session mit aussagekräftigen Nachrichten – dein
GitHub-Profil ist deine Visitenkarte.

---

## English

<a id="en-overview"></a>

### Overview

The web app automatically turns the ingredients you already have into matching
recipes and lets you save favorites to a personal cookbook.

<a id="en-features"></a>

### Features

| Feature | Description |
|---|---|
| Hero landing page | Pixel-accurate implementation of the Figma design (forest green `#396039`, Ubuntu Bold, Quicksand, overlapping circular plate images, "Get started" CTA) |
| Ingredient input | Add/remove ingredients one by one, chip/tag display |
| Recipe generation | Produces exactly 3 recipes with ingredients, steps, difficulty, cooking time, servings, nutrition facts and missing base ingredients |
| Generator options | Servings, time budget, cuisine style (German, Italian, Japanese, Indian, Gourmet, Fusion), diet preference and 1–3 cooking helpers with task assignment (parallel steps) |
| Recipe display | Recipe cards with metadata badges, nutrition facts and a collapsible step-by-step guide; swipeable cards on mobile |
| Recipe library | All generated recipes are publicly viewable, filterable by cuisine category, with a detail page (`/library/:id`) |
| Cookbook | Save, view and remove recipes |
| Imprint | Placeholder legal notice per § 5 TMG (German telemedia law) (`/impressum`) |
| Responsive | Mobile-first down to 320 px width, minimum 16 px font size on mobile, no visible scrollbars, swipe interactions, touch targets ≥ 44 px |

<a id="en-current-status"></a>

### Current Status & Next Steps

This project was converted from a React version to **Angular** and stripped of all
third-party dependencies (formerly Manus), so it runs entirely locally in VS Code.

Recipe generation, the library and the cookbook already work end to end – currently
backed by a client-side mock generator instead of a real LLM call, and by
`localStorage` instead of a real database. That keeps the app immediately runnable,
with no server or credentials required.

**Firebase Auth is already wired in**: email/password registration and login plus
Google sign-in (`AuthService`, `authGuard`, the `/login` page), currently only
gating the `/cookbook` route. This needs a real Firebase project config in
`src/environments/environment.ts` (see `environment.example.ts`) – without one the
app still starts locally, login attempts simply fail.

Planned next steps (intentionally still open, see the project checklist):

- **Firebase Firestore**: storage for all generated recipes (library) and the
  personal cookbook, replacing `localStorage`.
- **n8n**: a workflow that takes over the actual AI recipe generation
  (error handling/logging, IP-based quota and rate limiting, re-validating the
  data coming from Angular, a clearly defined JSON structure between Angular
  and n8n).

`RecipeGeneratorService` (`src/app/core/services/recipe-generator.service.ts`) is
deliberately kept isolated so it can later be swapped for an HTTP call to n8n
without touching any components. The same applies to `LibraryService` and
`CookbookService`, which currently wrap `localStorage` and will later be replaced
with Firebase calls.

<a id="en-code-conventions"></a>

### Code Conventions

- Every function does exactly one thing and stays short and focused
- Every function carries a short English JSDoc comment
- Files stay under 400 lines
- Semantic HTML (`header`, `nav`, `main`, `section`, `article`, `footer`)
- Only native Angular control flow (`@if`, `@for`) and Tailwind CSS, no
  additional UI framework

<a id="en-tech-stack"></a>

### Tech Stack

Angular 18 (Standalone Components) · TypeScript · Tailwind CSS 3 · RxJS

<a id="en-project-structure"></a>

### Project Structure (excerpt)

```
src/
  index.html              # Fonts (Ubuntu, Quicksand)
  styles.css              # Tailwind entry point, scrollbar/mobile rules
  assets/img/hero/        # Images (logo, plates)
  app/
    core/
      models/             # Recipe types (Angular equivalent of shared/recipes.ts)
      data/                # Labels & cuisine-style presets for the mock generator
      services/            # RecipeGeneratorService, LibraryService, CookbookService, ToastService
    shared/
      icon/                # Small, dependency-free inline SVG icon set
      toast/               # Global toast notifications
    layout/                # SiteHeader (navigation), SiteFooter
    hero/                  # Logo, HeroPlates (landing page graphic)
    pages/                 # Home, Generator, Library, RecipeDetail, Cookbook, Imprint, NotFound
    recipes/               # IngredientInput, GeneratorOptions, RecipeResults, RecipeCard, RecipeMeta, RecipeSteps, RecipeNutrition
```

<a id="en-local-development"></a>

### Local Development (VS Code)

1. Clone the repository or open the folder in VS Code
2. Install dependencies: `npm install`
3. Start the dev server: `npm start` → http://localhost:4200
4. Run tests: `npm test`
5. Production build: `npm run build`

Recommended VS Code extension: **Angular Language Service** for template
autocompletion.

No `.env` file and no backend are required – the app runs entirely in the browser
(see "Current Status" above).

<a id="en-git-github"></a>

### Git & GitHub

```bash
git add .
git commit -m "Migrated frontend from React to Angular"
git remote add origin <your-github-repo-url>
git push -u origin main
```

Commit after every coding session with clear, meaningful messages – your GitHub
profile is your business card.
