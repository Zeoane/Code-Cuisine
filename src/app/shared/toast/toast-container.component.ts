import { Component, inject } from "@angular/core";
import { ToastService } from "../../core/services/toast.service";

const VARIANT_CLASSES: Record<string, string> = {
  success: "bg-[#396039] text-[#faf0e6]",
  error: "bg-[#b3341f] text-white",
  info: "bg-white text-[#2c452c] border border-[#396039]/20",
};

/** Fixed bottom-right tray rendering the app's toast notifications. */
@Component({
  selector: "app-toast-container",
  standalone: true,
  template: `
    <div
      class="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
      aria-live="polite">
      @for (message of toast.messages(); track message.id) {
        <p
          class="font-quicksand pointer-events-auto max-w-sm rounded-lg px-4 py-3 text-base shadow-lg {{
            variantClass(message.variant)
          }}">
          {{ message.text }}
        </p>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  protected readonly toast = inject(ToastService);

  /** Resolves the background/text classes for a toast variant. */
  protected variantClass(variant: string): string {
    return VARIANT_CLASSES[variant] ?? VARIANT_CLASSES["info"];
  }
}
