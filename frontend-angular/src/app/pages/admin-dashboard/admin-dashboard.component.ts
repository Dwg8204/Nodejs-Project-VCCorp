import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  protected readonly foundations = [
    { value: '2', label: 'Layout dùng chung' },
    { value: '3', label: 'Route nền tảng' },
    { value: '100%', label: 'Responsive shell' },
    { value: '0', label: 'Nghiệp vụ bị thay đổi' },
  ];
}
