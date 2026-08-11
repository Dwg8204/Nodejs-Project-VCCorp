import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiSelectService } from './core/services/ui-select.service';
import { AuthService } from './core/services/auth.service';
import { AppNotificationsComponent } from './shared/components/app-notifications/app-notifications.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppNotificationsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly uiSelect = inject(UiSelectService);
  private readonly auth = inject(AuthService);
  constructor() {
    this.uiSelect.start();
    this.auth.startSessionMonitor();
  }
}
