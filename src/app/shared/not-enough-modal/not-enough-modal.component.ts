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
 * "Ups! Not quite enough..." popup shown when the entered ingredients do not
 * meet the criteria for the requested servings. Closes via the X, a click on
 * the backdrop or Escape, matching the Figma overlay interaction.
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
