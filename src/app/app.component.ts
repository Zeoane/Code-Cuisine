import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ToastContainerComponent } from "./shared/toast/toast-container.component";

/** Root component: hosts the router outlet and the global toast tray. */
@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <router-outlet />
    <app-toast-container />
  `,
})
export class AppComponent {}
