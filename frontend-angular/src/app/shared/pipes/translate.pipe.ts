import { inject, Pipe, PipeTransform } from '@angular/core';

import { LanguageService, UiMessageKey } from '../../core/services/language.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly languageService = inject(LanguageService);

  transform(key: UiMessageKey): string {
    return this.languageService.translate(key);
  }
}
