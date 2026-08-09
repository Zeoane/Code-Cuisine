import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject, signal } from "@angular/core";
import { IngredientUnit } from "../../core/models/recipe.models";

const UNITS: IngredientUnit[] = ["gram", "piece", "ml"];

/** Trigger button sizing per context (main form vs. inline row editing). */
const TRIGGER_SIZE_CLASSES: Record<"md" | "sm", string> = {
  md: "h-9 pl-[15px] pr-2.5 text-base",
  sm: "h-7 pl-2 pr-2 text-base",
};

/**
 * Custom pill-shaped unit dropdown (gram/piece/ml). Replaces the native
 * <select> so the open popup can sit borderless in the same light-green
 * tone as the surrounding panel, with the arrow rotating 180° while open.
 */
@Component({
  selector: "app-unit-select",
  standalone: true,
  templateUrl: "./unit-select.component.html",
})
export class UnitSelectComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @Input() value: IngredientUnit = "gram";
  @Input() size: "md" | "sm" = "md";
  @Output() valueChange = new EventEmitter<IngredientUnit>();

  protected readonly units = UNITS;
  protected readonly open = signal(false);

  /** Toggles the options popup open/closed. */
  toggle(): void {
    this.open.update(v => !v);
  }

  /** Selects a unit, emits the change and closes the popup (arrow resets). */
  select(unit: IngredientUnit): void {
    this.valueChange.emit(unit);
    this.open.set(false);
  }

  /** Trigger button classes for the current size. */
  triggerClass(): string {
    const base = "flex items-center gap-1.5 rounded-full bg-creme font-quicksand text-forest-dark focus-visible:outline-none";
    return `${base} ${TRIGGER_SIZE_CLASSES[this.size]}`;
  }

  /** Closes the popup on Escape (arrow rotates back). */
  @HostListener("document:keydown.escape")
  handleEscape(): void {
    this.open.set(false);
  }

  /** Closes the popup when a click lands outside this component. */
  @HostListener("document:click", ["$event"])
  handleDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
