import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminLayoutComponent {
  protected readonly sidebarOpen = signal(true);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly darkTheme = signal(localStorage.getItem('blog-theme') === 'dark');
  protected readonly logoutConfirmOpen = signal(false);
  protected readonly languageOpen = signal(false);
  protected readonly auth = inject(AuthService);
  protected readonly language = inject(LanguageService);
  private readonly router = inject(Router);

  protected toggleSidebar(): void {
    if (matchMedia('(max-width: 768px)').matches) this.mobileMenuOpen.update((open) => !open);
    else this.sidebarOpen.update((open) => !open);
  }

  protected toggleTheme(): void { this.darkTheme.update((dark) => !dark); document.documentElement.dataset['theme'] = this.darkTheme() ? 'dark' : 'light'; localStorage.setItem('blog-theme', this.darkTheme() ? 'dark' : 'light'); }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
  protected requestLogout():void{this.logoutConfirmOpen.set(true);}
  protected cancelLogout():void{this.logoutConfirmOpen.set(false);}
  protected confirmLogout():void{this.logoutConfirmOpen.set(false);this.logout();}

  protected selectLanguage(locale: 'vi' | 'en'): void { this.language.setLocale(locale); this.languageOpen.set(false); }
}
