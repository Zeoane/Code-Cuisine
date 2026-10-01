# Code à Cuisine

**AI-Powered recipe generator**

Repository: <https://github.com/Zeoane/Code-Cuisine>

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Current Status & Next Steps](#current-status)
- [Setup: Firebase & n8n](#setup)
- [Code Conventions](#code-conventions)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)

---

<a id="overview"></a>

### Overview

The web app turns the ingredients you already have into matching recipes, makes
every generated recipe available to everyone through a public library, and lets
you save favorites to a personal cookbook.

<a id="features"></a>

### Features

| Feature           | Description                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hero landing page | Pixel-accurate implementation of the Figma design (forest green `#396039`, Ubuntu Bold, Quicksand, overlapping circular plate images, "Get started" CTA)      |
| Ingredient input  | Search field with autocomplete, quantity per ingredient (g, ml, pieces), removal and overview list; at least 1 ingredient                                     |
| Generator options | Servings 1–12 (default 2), time budget, cuisine style (German, Italian, Japanese, Indian, Gourmet, Fusion), diet preference and 1–3 cooking helpers           |
| Recipe generation | Produces exactly 3 recipes through n8n, with ingredients, steps, difficulty, cooking time, servings, nutrition facts and missing base ingredients             |
| Loading animation | The wait is bridged by a salad-bowl scene assembled from individual SVGs and animated in CSS (11.2 s per run, honours `prefers-reduced-motion`)               |
| Task assignment   | With several cooking helpers each person gets their own step list, and parallel steps are marked                                                              |
| Recipe display    | Recipe cards with metadata badges, nutrition facts and a step-by-step guide; swipeable cards on mobile                                                        |
| Recipe library    | All generated recipes live in Firestore, viewable without an account, filterable by cuisine style, paginated beyond 20 entries, detail page at `/library/:id` |
| Cookbook          | Save, view and remove recipes; readable without an account, stored per browser in `localStorage`                                                              |
| Daily limit       | 3 generations per IP address per day, 12 system-wide; the remaining count sits on the "Preferences" step                                                      |
| Login             | Email/password registration and sign-in plus Google sign-in (Firebase Auth)                                                                                   |
| Imprint           | Legal notice per § 5 DDG (German Digital Services Act) (`/impressum`)                                                                                         |
| Responsive        | Mobile-first down to 320 px width, minimum 16 px font size on mobile, no visible scrollbars, swipe interactions, touch targets ≥ 44 px                        |

<a id="current-status"></a>

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
  sign-in.

**n8n** runs three workflows (details in [`n8n/README.md`](n8n/README.md)):

- `Recipe Generation` – re-validates the payload coming from Angular, checks and
  raises the IP quota, has OpenAI write the three recipes and returns them.
- `Recipe Quota Status` – reports the remaining daily allowance to the frontend.
- `Error Notifications` – an error trigger that sends an email on every failure.

**The recipes come from a real model.** The recipe node runs an LLM chain with a
structured output parser, so the answer arrives as a typed object rather than as
text that has to be parsed by hand. The node after it checks the result against
the very limits `firestore.rules` enforces and repairs small slips. If the call
fails or the answer cannot be used, the rule-based generator steps in as a
fallback – the user always gets three recipes.

**Quality assurance** is documented:

- [`docs/RESPONSIVE.md`](docs/RESPONSIVE.md) – 14 views across 10 widths from
  320 to 2560 px, with screenshots and measurements.
- [`docs/CROSS-BROWSER.md`](docs/CROSS-BROWSER.md) – Chrome, Safari (WebKit),
  Firefox and Edge.
- [`CODE-REVIEW.md`](CODE-REVIEW.md) – a review covering security,
  accessibility and maintainability; every finding has been addressed.

**Beyond this submission:** the cookbook still lives in each browser's
`localStorage`. Moving it to Firestore would sync it per account.

<a id="setup"></a>

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
exports (`*.json` without `.example`) are excluded via `.gitignore`: they carry
the credential ids of the n8n instance they were exported from.

<a id="code-conventions"></a>

### Code Conventions

- Every function does exactly one thing and stays short and focused
- Every function carries a short English JSDoc comment
- Files stay under 400 lines
- Semantic HTML (`header`, `nav`, `main`, `section`, `article`, `footer`)
- Only native Angular control flow (`@if`, `@for`) and Tailwind CSS, no
  additional UI framework

<a id="tech-stack"></a>

### Tech Stack

Angular 18 (Standalone Components) · TypeScript · Tailwind CSS 3 · RxJS ·
Firebase (Auth, Firestore) · n8n

<a id="project-structure"></a>

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
      guards/               # ingredientsGuard (wizard)
      firebase/             # Firebase initialisation
      services/             # RecipeGenerator, Library, Cookbook, Quota, Auth, WizardState
    shared/
      icon/                 # Small, dependency-free inline SVG icon set
      heart-icon/           # Favourite toggle
      quota-badge/          # Shows the remaining generations
      drag-scroll/          # Directive for horizontal dragging with the mouse
      impressum-modal/      # Legal notice as an overlay
      not-enough-modal/     # Hint when the daily limit is used up
      logout-button/        # Sign-out control in the header
      toast/                # Global toast notifications
    layout/                 # SiteHeader (navigation)
    hero/                   # Logo, HeroPlates (landing page graphic)
    pages/                  # Home, Login, Generator, Preferences, Loading, Results,
                            # RecipeView, Recipes, Library, RecipeDetail, Cookbook,
                            # Imprint, NotFound
    recipes/                # IngredientQuantityForm, IngredientEntryList, UnitSelect,
                            # RecipeCard, RecipeMeta, RecipeSteps, RecipeNutrition,
                            # NutritionSplit, ChoiceChip
```

<a id="local-development"></a>

### Local Development

1. Clone the repository or open the folder in an editor
2. Install dependencies: `npm install`
3. Start the dev server: `npm start` → http://localhost:4200
4. Run tests: `npm test`
5. Production build: `npm run build`

No `.env` file is needed; the configuration lives in
`src/environments/environment.ts` (see [Setup](#setup)). Without Firebase and
n8n the app runs entirely in the browser, then without the library, login and
daily limit.
