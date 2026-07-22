import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="not-found">
      <p class="eyebrow">Lỗi 404</p>
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn này chưa tồn tại hoặc chưa được chuyển sang Angular.</p>
      <a class="button button--primary" routerLink="/">Về trang chủ</a>
    </main>
  `,
  styles: `
    .not-found {
      display: grid;
      min-height: 100vh;
      place-content: center;
      justify-items: center;
      padding: 24px;
      text-align: center;
    }
    h1 { margin: 0; font-size: clamp(2.3rem, 7vw, 5rem); letter-spacing: -0.06em; }
    p:not(.eyebrow) { margin: 18px 0 28px; color: var(--color-text-muted); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
