import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { ingredientsGuard } from "./core/guards/ingredients.guard";

/**
 * Application route table. Most pages are publicly reachable; the wizard
 * steps after the ingredient input additionally require at least one
 * ingredient, and the cookbook requires a signed-in user.
 */
export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./pages/home/home.component").then(m => m.HomeComponent),
  },
  {
    path: "login",
    loadComponent: () => import("./pages/login/login.component").then(m => m.LoginComponent),
  },
  {
    path: "generator",
    loadComponent: () =>
      import("./pages/generator/generator.component").then(m => m.GeneratorComponent),
  },
  {
    path: "preferences",
    canActivate: [ingredientsGuard],
    loadComponent: () =>
      import("./pages/preferences/preferences.component").then(m => m.PreferencesComponent),
  },
  {
    path: "loading",
    canActivate: [ingredientsGuard],
    loadComponent: () => import("./pages/loading/loading.component").then(m => m.LoadingComponent),
  },
  {
    path: "results",
    canActivate: [ingredientsGuard],
    loadComponent: () => import("./pages/results/results.component").then(m => m.ResultsComponent),
  },
  {
    path: "recipe/:index",
    canActivate: [ingredientsGuard],
    loadComponent: () =>
      import("./pages/recipe-view/recipe-view.component").then(m => m.RecipeViewComponent),
  },
  {
    path: "recipes/:cuisine",
    loadComponent: () => import("./pages/recipes/recipes.component").then(m => m.RecipesComponent),
  },
  {
    path: "cookbook",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/cookbook/cookbook.component").then(m => m.CookbookComponent),
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
