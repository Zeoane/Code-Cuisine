import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { IconComponent } from "../icon/icon.component";

/**
 * Wizard notice popup, originally built for "Ups! Not quite enough..." but
 * generalized (title/message/linkLabel inputs) so the loading step can reuse
 * it for generation errors (e.g. quota exceeded) instead of a near-duplicate
 * component. Closes via the X, a click on the backdrop or Escape, matching
 * the Figma overlay interaction.
 */
@Component({
  selector: "app-not-enough-modal",
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: "./not-enough-modal.component.html",
  styleUrl: "./not-enough-modal.component.css",
})
export class NotEnoughModalComponent implements OnChanges {
  @Input() open = false;
  @Input() title = "Ups! Not quite enough...";
  @Input() message =
    "It looks like some ingredients aren't sufficient for your selected servings. Please add or adjust quantities and try again.";
  @Input() linkLabel = "Go back to ingredients";
  @Output() closed = new EventEmitter<void>();

  /** Locks page scrolling for as long as the popup is visible. */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes["open"]) return;
    document.body.style.overflow = this.open ? "hidden" : "";
  }

  /** Closes the popup when Escape is pressed while it is open. */
  @HostListener("window:keydown.escape")
  handleEscape(): void {
    if (this.open) this.closed.emit();
  }

  /** Closes the popup when the backdrop itself (not the card) is clicked. */
  handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }
}
