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
 * Small popup showing a condensed Impressum, styled to match the app.
 * Visibility is controlled by the `open` input; emits `closed` on dismissal
 * (close button, backdrop click or Escape key).
 */
@Component({
  selector: "app-impressum-modal",
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: "./impressum-modal.component.html",
})
export class ImpressumModalComponent implements OnChanges {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  /** Locks page scrolling for as long as the modal is visible. */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes["open"]) return;
    document.body.style.overflow = this.open ? "hidden" : "";
  }

  /** Closes the modal when Escape is pressed while it is open. */
  @HostListener("window:keydown.escape")
  handleEscape(): void {
    if (this.open) this.closed.emit();
  }

  /** Closes the modal when the backdrop itself (not the card) is clicked. */
  handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }
}
