import { NgClass } from "@angular/common";
import { Component, Input } from "@angular/core";

/**
 * Pill-shaped single-choice tag used on the preferences step
 * (Figma "tags" component: 28px high, 30px radius, 6/12 padding).
 */
@Component({
  selector: "app-choice-chip",
  standalone: true,
  imports: [NgClass],
  host: { class: "inline-flex" },
  template: `
    <button
      type="button"
      [attr.aria-pressed]="selected"
      class="font-quicksand flex h-7 items-center rounded-[30px] px-3 text-base leading-none font-medium text-forest transition-colors hover:bg-peach"
      [ngClass]="selected ? 'bg-forest/30' : 'bg-creme'">
      <ng-content />
    </button>
  `,
})
export class ChoiceChipComponent {
  /** Renders the selected (filled) variant when true. */
  @Input() selected = false;
}
