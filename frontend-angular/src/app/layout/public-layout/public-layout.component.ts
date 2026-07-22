import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { FeedUiService } from '../../core/services/feed-ui.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, TranslatePipe],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PublicLayoutComponent {
  protected readonly menuOpen = signal(false);
  protected readonly mobileSearchOpen = signal(false);
  protected readonly darkTheme = signal(localStorage.getItem('blog-theme') === 'dark');
  protected readonly logoutConfirmOpen = signal(false);
  protected readonly languageOpen = signal(false);
  protected readonly language = inject(LanguageService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly feedUi = inject(FeedUiService);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    document.getElementById('mainSidebar')?.classList.toggle('drawer-open', this.menuOpen());
  }

  protected toggleSearch(): void { this.mobileSearchOpen.update((open) => !open); }
  protected toggleTheme(): void {
    this.darkTheme.update((dark) => !dark);
    document.documentElement.dataset['theme'] = this.darkTheme() ? 'dark' : 'light';
    localStorage.setItem('blog-theme', this.darkTheme() ? 'dark' : 'light');
  }

  protected selectLanguage(locale: 'vi' | 'en'): void { this.language.setLocale(locale); this.languageOpen.set(false); }

  protected logout(): void {
    this.auth.logout();
    this.menuOpen.set(false);
    void this.router.navigate(['/']);
  }
  protected requestLogout():void{this.logoutConfirmOpen.set(true);}
  protected cancelLogout():void{this.logoutConfirmOpen.set(false);}
  protected confirmLogout():void{this.logoutConfirmOpen.set(false);this.logout();}
}
