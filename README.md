# Code à Cuisine

**AI-Powered recipe generator**

## Inhaltsverzeichnis / Table of Contents

**Deutsch**

- [Überblick](#de-ueberblick)
- [Features](#de-features)
- [Aktueller Stand & nächste Schritte](#de-aktueller-stand)
- [Einrichtung: Firebase & n8n](#de-einrichtung)
- [Code-Konventionen](#de-code-konventionen)
- [Tech-Stack](#de-tech-stack)
- [Projektstruktur](#de-projektstruktur)
- [Lokal entwickeln (VS Code)](#de-lokal-entwickeln)
- [Git & GitHub](#de-git-github)

**English**

- [Overview](#en-overview)
- [Features](#en-features)
- [Current Status & Next Steps](#en-current-status)
- [Setup: Firebase & n8n](#en-setup)
- [Code Conventions](#en-code-conventions)
- [Tech Stack](#en-tech-stack)
- [Project Structure](#en-project-structure)
- [Local Development (VS Code)](#en-local-development)
- [Git & GitHub](#en-git-github)

---

## Deutsch

<a id="de-ueberblick"></a>

### Überblick

Die Webanwendung generiert aus deinen vorhandenen Zutaten passende Rezepte,
macht jedes erzeugte Rezept über eine öffentliche Bibliothek für alle zugänglich
und speichert Favoriten in einem persönlichen Kochbuch.

<a id="de-features"></a>

### Features

| Feature            | Beschreibung                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero-Landingpage   | Pixelgenau nach Figma-Design (Dunkelgrün `#396039`, Ubuntu Bold, Quicksand, kreisförmige Teller-Bilder, Get-started-CTA)                                                   |
| Zutaten-Eingabe    | Suchfeld mit Autovervollständigung, Menge je Zutat (g, ml, Stück), Entfernen und Übersichtsliste; mindestens 1 Zutat                                                       |
| Generator-Optionen | Portionen 1–12 (Standard 2), Zeitrahmen, Kochstil (Deutsch, Italienisch, Japanisch, Indisch, Gourmet, Fusion), Ernährungsweise und 1–3 Kochhelfer                          |
| Rezeptgenerierung  | Erzeugt über n8n genau 3 Rezepte mit Zutaten, Schritten, Schwierigkeitsgrad, Kochzeit, Portionen, Nährwerten und fehlenden Basiszutaten                                    |
| Ladeanimation      | Die Wartezeit überbrückt eine Salatschüssel-Szene aus Einzel-SVGs, per CSS animiert (11,2 s Durchlauf, respektiert `prefers-reduced-motion`)                               |
| Arbeitsaufteilung  | Bei mehreren Kochhelfern bekommt jede Person eine eigene Schrittliste, parallele Schritte sind markiert                                                                    |
| Rezeptanzeige      | Rezeptkarten mit Metadaten-Badges, Nährwerten und Schritt-für-Schritt-Anleitung; mobil als Swipe-Karten                                                                    |
| Rezept-Bibliothek  | Alle generierten Rezepte in Firestore, ohne Account einsehbar, filterbar nach Kochstil, Paginierung ab 20 Einträgen, Detailseite unter `/library/:id`                      |
| Kochbuch           | Rezepte speichern, abrufen und entfernen – hinter dem Login, aktuell in `localStorage`                                                                                     |
| Tageslimit         | 3 Generierungen je IP-Adresse und Tag, 12 systemweit; der verbleibende Stand steht im Schritt „Preferences“                                                                   |
| Login              | Registrierung und Anmeldung per E-Mail/Passwort sowie Google-Login (Firebase Auth), schützt die Kochbuch-Route                                                             |
| Impressum          | Impressum gemäß § 5 DDG (`/impressum`)                                                                                                                                    |
| Responsiv          | Mobile-first bis 320 px Breite, Schrift mind. 16 px, keine sichtbaren Scrollbalken, Swipe-Interaktionen, Buttons/Links ≥ 44 px Trefferfläche, Eingabefelder in Figma-Höhe  |

<a id="de-aktueller-stand"></a>

### Aktueller Stand & nächste Schritte

Das Frontend ist eine Angular-18-App mit Standalone-Komponenten und Signals. Sie
läuft ohne Zugangsdaten sofort lokal: fehlt eine Konfiguration, fällt die App auf
lokale Ersatzlösungen zurück, statt zu scheitern.

**Firebase** ist in zwei Rollen angebunden:

- **Firestore** trägt die öffentliche Rezept-Bibliothek. Jedes generierte Rezept
  wird direkt aus dem Browser geschrieben, IDs vergibt ein Zähler innerhalb einer
  Transaktion, damit parallele Schreiber nicht kollidieren. Lesen darf jeder,
  Ändern und Löschen niemand (siehe `firestore.rules`).
- **Auth** übernimmt Registrierung und Login per E-Mail/Passwort sowie den
  Google-Login und schützt ausschließlich die `/cookbook`-Route.

**n8n** läuft mit drei Workflows (Details in [`n8n/README.md`](n8n/README.md)):

- `Recipe Generation` – validiert die Eingaben aus Angular erneut, prüft und
  erhöht das IP-Quota und liefert die drei Rezepte zurück.
- `Recipe Quota Status` – meldet dem Frontend den verbleibenden Tagesstand.
- `Error Notifications` – Error-Trigger, der bei jedem Fehlschlag eine E-Mail
  verschickt.

**Was noch offen ist:** die eigentliche KI. Der Node `Generate Mock Recipes`
erzeugt die Rezepte bislang regelbasiert aus Kochstil-Vorlagen, es findet kein
LLM-Aufruf statt. Der `RecipeGeneratorService` ruft n8n an, sobald
`environment.n8n.generateUrl` gesetzt ist, und nutzt sonst denselben Mock im
Browser – die Umstellung auf ein echtes Modell betrifft deshalb nur den einen
n8n-Node, nicht das Frontend.

Weitere geplante Schritte:

- **Nährwerte vervollständigen**: Makronährstoffe zusätzlich in Prozent sowie
  Werte für das Gesamtrezept, nicht nur pro Portion.
- **Nährwert-Diagramm**, das auch auf kleinen Bildschirmen lesbar bleibt.
- **Kochbuch auf Firestore** umstellen, damit es pro Konto synchronisiert statt
  nur im jeweiligen Browser zu liegen.
- **Beschreibungstexte an den n8n-Nodes** ergänzen; die Namen sind gesetzt, die
  Notizfelder noch leer.
- **Cross-Browser-Test und Code-Review** als Abschluss.

<a id="de-einrichtung"></a>

### Einrichtung: Firebase & n8n

Beides ist optional – ohne Konfiguration startet die App trotzdem.

1. `src/environments/environment.example.ts` nach `environment.ts` kopieren.
2. Firebase-Projektdaten eintragen. Ohne sie startet die App weiterhin, der Login
   schlägt fehl und die Bibliothek bleibt leer.
3. `firestore.rules` in das Firebase-Projekt deployen.
4. Die Webhook-URLs der beiden n8n-Workflows unter `n8n.generateUrl` und
   `n8n.quotaStatusUrl` eintragen. Ohne sie generiert die App clientseitig
   weiter, allerdings ohne Tageslimit.

Die Workflows liegen als `n8n/workflows/*.example.json` im Repository. Die
Roh-Exporte (`*.json` ohne `.example`) sind bewusst über `.gitignore`
ausgeschlossen, weil sie den Firebase-Service-Account im Klartext enthalten.

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

Angular 18 (Standalone Components) · TypeScript · Tailwind CSS 3 · RxJS ·
Firebase (Auth, Firestore) · n8n

<a id="de-projektstruktur"></a>

### Projektstruktur (Auszug)

```
firestore.rules             # Zugriffsregeln für Bibliothek und Quota-Zähler
n8n/
  README.md                 # Einrichtung der Workflows, JSON-Kontrakt, Datenschutz
  workflows/                # Sanitisierte Workflow-Vorlagen (*.example.json)
src/
  index.html                # Fonts (Ubuntu, Quicksand)
  styles.css                # Tailwind-Einstieg, Scrollbar-/Mobile-Regeln
  environments/             # Firebase- und n8n-Konfiguration
  assets/img/               # Bilder je Seite (Hero, Cookbook, Loading-Page …)
  app/
    core/
      models/               # Recipe-Typen
      data/                 # Labels, Kochstil-Presets, Zutaten-Vorschläge
      guards/               # authGuard (Kochbuch), ingredientsGuard (Wizard)
      firebase/             # Firebase-Initialisierung
      services/             # RecipeGenerator-, Library-, Cookbook-, Quota-, Auth-, WizardState-Service
    shared/
      icon/                 # Kleines, abhängigkeitsfreies Inline-SVG-Icon-Set
      quota-badge/          # Anzeige der verbleibenden Generierungen
      drag-scroll/          # Directive für horizontales Ziehen mit der Maus
      toast/                # Globale Toast-Anzeige
    layout/                 # SiteHeader (Navigation)
    hero/                   # Logo, HeroPlates (Landingpage-Grafik)
    pages/                  # Home, Login, Generator, Preferences, Loading, Results,
                            # RecipeView, Recipes, Library, RecipeDetail, Cookbook,
                            # Imprint, NotFound
    recipes/                # IngredientInput, IngredientQuantityForm, UnitSelect,
                            # RecipeResults, RecipeCard, RecipeMeta, RecipeSteps,
                            # RecipeNutrition, ChoiceChip
```

<a id="de-lokal-entwickeln"></a>

### Lokal entwickeln (VS Code)

1. Repository klonen bzw. Ordner in VS Code öffnen
2. Abhängigkeiten installieren: `npm install`
3. Dev-Server starten: `npm start` → http://localhost:4200
4. Tests ausführen: `npm test`
5. Produktions-Build: `npm run build`

Empfohlene VS Code-Erweiterung: **Angular Language Service** für Template-Autovervollständigung.

Eine `.env`-Datei wird nicht benötigt; die Konfiguration steht in
`src/environments/environment.ts` (siehe [Einrichtung](#de-einrichtung)). Ohne
Firebase und n8n läuft die App vollständig im Browser, dann ohne Bibliothek,
Login und Tageslimit.

<a id="de-git-github"></a>

### Git & GitHub

```bash
git add .
git commit -m "Mindestzutat auf 1 gesenkt"
git push
```

Committe nach jeder Coding-Session mit aussagekräftigen Nachrichten – dein
GitHub-Profil ist deine Visitenkarte.

---

## English

<a id="en-overview"></a>

### Overview

The web app turns the ingredients you already have into matching recipes, makes
every generated recipe available to everyone through a public library, and lets
you save favorites to a personal cookbook.

<a id="en-features"></a>

### Features

| Feature           | Description                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hero landing page | Pixel-accurate implementation of the Figma design (forest green `#396039`, Ubuntu Bold, Quicksand, overlapping circular plate images, "Get started" CTA)                  |
| Ingredient input  | Search field with autocomplete, quantity per ingredient (g, ml, pieces), removal and overview list; at least 1 ingredient                                                 |
| Generator options | Servings 1–12 (default 2), time budget, cuisine style (German, Italian, Japanese, Indian, Gourmet, Fusion), diet preference and 1–3 cooking helpers                       |
| Recipe generation | Produces exactly 3 recipes through n8n, with ingredients, steps, difficulty, cooking time, servings, nutrition facts and missing base ingredients                         |
| Loading animation | The wait is bridged by a salad-bowl scene assembled from individual SVGs and animated in CSS (11.2 s per run, honours `prefers-reduced-motion`)                           |
| Task assignment   | With several cooking helpers each person gets their own step list, and parallel steps are marked                                                                         |
| Recipe display    | Recipe cards with metadata badges, nutrition facts and a step-by-step guide; swipeable cards on mobile                                                                   |
| Recipe library    | All generated recipes live in Firestore, viewable without an account, filterable by cuisine style, paginated beyond 20 entries, detail page at `/library/:id`             |
| Cookbook          | Save, view and remove recipes – behind the login, currently in `localStorage`                                                                                             |
| Daily limit       | 3 generations per IP address per day, 12 system-wide; the remaining count sits on the "Preferences" step                                                                      |
| Login             | Email/password registration and sign-in plus Google sign-in (Firebase Auth), gating the cookbook route                                                                    |
| Imprint           | Legal notice per § 5 DDG (German Digital Services Act) (`/impressum`)                                                                                                    |
| Responsive        | Mobile-first down to 320 px width, minimum 16 px font size, no visible scrollbars, swipe interactions, button and link hit areas ≥ 44 px, input fields at Figma height    |

<a id="en-current-status"></a>

### Current Status & Next Steps

The frontend is an Angular 18 app built from standalone components and signals.
It runs locally without any credentials: when a piece of configuration is
missing, the app falls back to a local substitute instead of failing.

**Firebase** is wired in for two jobs:

- **Firestore** carries the public recipe library. Every generated recipe is
  written straight from the browser, ids come from a counter advanced inside a
  transaction so concurrent writers never collide. Anyone may read, nobody may
  edit or delete (see `firestore.rules`).
- **Auth** handles email/password registration and sign-in as well as Google
  sign-in, and gates the `/cookbook` route only.

**n8n** runs three workflows (details in [`n8n/README.md`](n8n/README.md)):

- `Recipe Generation` – re-validates the payload coming from Angular, checks and
  raises the IP quota, and returns the three recipes.
- `Recipe Quota Status` – reports the remaining daily allowance to the frontend.
- `Error Notifications` – an error trigger that sends an email on every failure.

**What is still open:** the actual AI. The `Generate Mock Recipes` node builds
the recipes from cuisine templates by rule; no LLM is called. `RecipeGeneratorService`
calls n8n as soon as `environment.n8n.generateUrl` is set and otherwise runs the
same mock in the browser – swapping in a real model therefore touches that single
n8n node, not the frontend.

Further planned steps:

- **Complete the nutrition facts**: macronutrients as percentages as well, plus
  values for the whole recipe instead of per serving only.
- **A nutrition chart** that stays readable on small screens.
- **Move the cookbook to Firestore** so it syncs per account instead of living in
  one browser.
- **Add description texts to the n8n nodes**; the names are in place, the notes
  fields are still empty.
- **Cross-browser testing and a code review** to close things out.

<a id="en-setup"></a>

### Setup: Firebase & n8n

Both are optional – the app starts without any configuration.

1. Copy `src/environments/environment.example.ts` to `environment.ts`.
2. Fill in the Firebase project config. Without it the app still starts, login
   fails and the library stays empty.
3. Deploy `firestore.rules` to the Firebase project.
4. Enter the webhook URLs of the two n8n workflows under `n8n.generateUrl` and
   `n8n.quotaStatusUrl`. Without them the app keeps generating client-side,
   though without a daily limit.

The workflows are in the repository as `n8n/workflows/*.example.json`. The raw
exports (`*.json` without `.example`) are deliberately excluded via `.gitignore`
because they contain the Firebase service account in plain text.

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

Angular 18 (Standalone Components) · TypeScript · Tailwind CSS 3 · RxJS ·
Firebase (Auth, Firestore) · n8n

<a id="en-project-structure"></a>

### Project Structure (excerpt)

```
firestore.rules             # Access rules for the library and the quota counters
n8n/
  README.md                 # Workflow setup, JSON contract, privacy notes
  workflows/                # Sanitized workflow templates (*.example.json)
src/
  index.html                # Fonts (Ubuntu, Quicksand)
  styles.css                # Tailwind entry point, scrollbar/mobile rules
  environments/             # Firebase and n8n configuration
  assets/img/               # Images per page (hero, cookbook, loading page …)
  app/
    core/
      models/               # Recipe types
      data/                 # Labels, cuisine presets, ingredient suggestions
      guards/               # authGuard (cookbook), ingredientsGuard (wizard)
      firebase/             # Firebase initialisation
      services/             # RecipeGenerator, Library, Cookbook, Quota, Auth, WizardState
    shared/
      icon/                 # Small, dependency-free inline SVG icon set
      quota-badge/          # Shows the remaining generations
      drag-scroll/          # Directive for horizontal dragging with the mouse
      toast/                # Global toast notifications
    layout/                 # SiteHeader (navigation)
    hero/                   # Logo, HeroPlates (landing page graphic)
    pages/                  # Home, Login, Generator, Preferences, Loading, Results,
                            # RecipeView, Recipes, Library, RecipeDetail, Cookbook,
                            # Imprint, NotFound
    recipes/                # IngredientInput, IngredientQuantityForm, UnitSelect,
                            # RecipeResults, RecipeCard, RecipeMeta, RecipeSteps,
                            # RecipeNutrition, ChoiceChip
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

No `.env` file is needed; the configuration lives in
`src/environments/environment.ts` (see [Setup](#en-setup)). Without Firebase and
n8n the app runs entirely in the browser, then without the library, login and
daily limit.

<a id="en-git-github"></a>

### Git & GitHub

```bash
git add .
git commit -m "Lower the minimum ingredient count to 1"
git push
```

Commit after every coding session with clear, meaningful messages – your GitHub
profile is your business card.
