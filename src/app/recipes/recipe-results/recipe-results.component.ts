import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CardRecipe } from "../../core/models/recipe.models";
import { RecipeCardComponent } from "../recipe-card/recipe-card.component";

/**
 * Generated recipe results. Below the sm breakpoint the cards form a
 * swipeable, snap-scrolling row; from sm upward CSS switches to a static
 * responsive grid, without any JavaScript breakpoint detection.
 */
@Component({
  selector: "app-recipe-results",
  standalone: true,
  imports: [RecipeCardComponent],
  templateUrl: "./recipe-results.component.html",
})
export class RecipeResultsComponent {
  @Input({ required: true }) recipes!: CardRecipe[];
  @Input() savingTitle: string | null = null;
  @Input() savedTitles: Set<string> = new Set();
  @Output() recipeSave = new EventEmitter<CardRecipe>();
}
