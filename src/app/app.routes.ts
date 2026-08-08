import { Routes } from "@angular/router";

/** Application route table. All pages are publicly reachable. */
export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./pages/home/home.component").then(m => m.HomeComponent),
  },
  {
    path: "generator",
    loadComponent: () =>
      import("./pages/generator/generator.component").then(m => m.GeneratorComponent),
  },
  {
    path: "preferences",
    loadComponent: () =>
      import("./pages/preferences/preferences.component").then(m => m.PreferencesComponent),
  },
  {
    path: "loading",
    loadComponent: () => import("./pages/loading/loading.component").then(m => m.LoadingComponent),
  },
  {
    path: "results",
    loadComponent: () => import("./pages/results/results.component").then(m => m.ResultsComponent),
  },
  {
    path: "cookbook",
    loadComponent: () =>
      import("./pages/cookbook/cookbook.component").then(m => m.CookbookComponent),
  },
  {
    path: "library",
    loadComponent: () =>
      import("./pages/library/library.component").then(m => m.LibraryComponent),
  },
  {
    path: "library/:id",
    loadComponent: () =>
      import("./pages/recipe-detail/recipe-detail.component").then(
        m => m.RecipeDetailComponent,
      ),
  },
  {
    path: "impressum",
    loadComponent: () =>
      import("./pages/imprint/imprint.component").then(m => m.ImprintComponent),
  },
  {
    path: "**",
    loadComponent: () =>
      import("./pages/not-found/not-found.component").then(m => m.NotFoundComponent),
  },
];
