import { Directive, ElementRef, HostListener, inject } from "@angular/core";

/**
 * Makes a horizontally overflowing element slidable with the mouse: drag to
 * pan, and a vertical wheel scrolls sideways. Touch devices already pan
 * natively, keyboard users can use the arrow keys on the focused element.
 */
@Directive({
  selector: "[appDragScroll]",
  standalone: true,
  host: {
    class: "cursor-grab active:cursor-grabbing select-none",
  },
})
export class DragScrollDirective {
  private readonly host = inject(ElementRef<HTMLElement>);

  private dragging = false;
  private startX = 0;
  private startScrollLeft = 0;

  /** Starts a drag, but only for mouse/pen - touch pans natively. */
  @HostListener("pointerdown", ["$event"])
  onPointerDown(event: PointerEvent): void {
    if (event.pointerType === "touch") return;
    const el = this.host.nativeElement;
    this.dragging = true;
    this.startX = event.clientX;
    this.startScrollLeft = el.scrollLeft;
    el.setPointerCapture(event.pointerId);
  }

  /** Pans the element while dragging. */
  @HostListener("pointermove", ["$event"])
  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    event.preventDefault();
    this.host.nativeElement.scrollLeft = this.startScrollLeft - (event.clientX - this.startX);
  }

  /** Ends the drag. */
  @HostListener("pointerup", ["$event"])
  @HostListener("pointercancel", ["$event"])
  onPointerUp(event: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.host.nativeElement.releasePointerCapture(event.pointerId);
  }

  /** Turns a plain vertical wheel into horizontal scrolling. */
  @HostListener("wheel", ["$event"])
  onWheel(event: WheelEvent): void {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    const el = this.host.nativeElement;
    const atStart = el.scrollLeft <= 0 && event.deltaY < 0;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1 && event.deltaY > 0;
    if (atStart || atEnd) return; // let the page scroll on at the ends
    event.preventDefault();
    el.scrollLeft += event.deltaY;
  }
}
