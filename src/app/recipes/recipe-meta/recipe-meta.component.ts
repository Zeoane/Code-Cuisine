import { Component, Input } from "@angular/core";
import { CUISINE_LABELS, DIFFICULTY_LABELS } from "../../core/data/recipe-labels";
import { CuisineStyle, Difficulty } from "../../core/models/recipe.models";
import { IconComponent } from "../../shared/icon/icon.component";

/** Badge background/text classes per difficulty level. */
const DIFFICULTY_CLASSES: Record<Difficulty, string> = {
  easy: "bg-[#e6f4e6] text-leaf",
  medium: "bg-[#fdf3d7] text-[#a07400]",
  hard: "bg-[#fbe4e0] text-[#b3341f]",
};

/** Badge row showing difficulty, cooking time, servings and cuisine style. */
@Component({
  selector: "app-recipe-meta",
  standalone: true,
  imports: [IconComponent],
  templateUrl: "./recipe-meta.component.html",
})
export class RecipeMetaComponent {
  @Input({ required: true }) difficulty!: Difficulty;
  @Input({ required: true }) cookingTimeMinutes!: number;
  @Input({ required: true }) servings!: number;
  @Input() cuisineStyle?: CuisineStyle;

  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly cuisineLabels = CUISINE_LABELS;

  /** Tailwind classes for the difficulty badge. */
  difficultyClass(): string {
    return DIFFICULTY_CLASSES[this.difficulty];
  }
}
