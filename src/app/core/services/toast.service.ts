import { Injectable, signal } from "@angular/core";

/** Visual style of a toast notification. */
export type ToastVariant = "success" | "error" | "info";

/** A single toast notification shown in the global toast tray. */
export interface ToastMessage {
  id: number;
  text: string;
  variant: ToastVariant;
}

let nextId = 1;
const AUTO_DISMISS_MS = 4000;

/** Minimal toast/notification service replacing the former "sonner" toasts. */
@Injectable({ providedIn: "root" })
export class ToastService {
  /** Currently visible toast messages. */
  readonly messages = signal<ToastMessage[]>([]);

  /** Shows a success toast. */
  success(text: string): void {
    this.push(text, "success");
  }

  /** Shows an error toast. */
  error(text: string): void {
    this.push(text, "error");
  }

  /** Shows an informational toast. */
  info(text: string): void {
    this.push(text, "info");
  }

  /** Dismisses a toast by id. */
  dismiss(id: number): void {
    this.messages.update(list => list.filter(m => m.id !== id));
  }

  /** Adds a toast and schedules its automatic removal. */
  private push(text: string, variant: ToastVariant): void {
    const message: ToastMessage = { id: nextId++, text, variant };
    this.messages.update(list => [...list, message]);
    setTimeout(() => this.dismiss(message.id), AUTO_DISMISS_MS);
  }
}
