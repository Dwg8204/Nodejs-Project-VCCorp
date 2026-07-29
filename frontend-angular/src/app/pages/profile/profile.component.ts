import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { USER_ROLES, User, UserRole } from '../../core/models/auth.model';
import { ApiErrorService } from '../../core/services/api-error.service';
import { AuthService } from '../../core/services/auth.service';
import { FeedUiService } from '../../core/services/feed-ui.service';
import { LanguageService } from '../../core/services/language.service';
import {
  ProfileApiService,
  ProfileImageType,
} from '../../core/services/profile-api.service';
import { MockDatabaseService } from '../../data/mock/mock-database.service';
import { PostStatus } from '../../data/mock/mock-schema.model';

interface ProfileView {
  id: number;
  user_name: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar: string | null;
  cover_image: string | null;
  date_of_birth: string | null;
  email_verified: boolean;
  role_id: number;
  created_at: string;
  updated_at: string;
}

interface ProfilePost {
  id: number;
  title: string;
  content: string;
  thumbnail: string;
  date: string;
  likes: number;
  comments: number;
  status: PostStatus;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly database = inject(MockDatabaseService);
  private readonly profileApi = inject(ProfileApiService);
  private readonly apiErrors = inject(ApiErrorService);
  protected readonly auth = inject(AuthService);
  protected readonly language = inject(LanguageService);
  protected readonly feedUi = inject(FeedUiService);
  private readonly revision = signal(0);
  private readonly apiProfile = signal<User | null>(null);

  protected readonly tab = signal<'home' | 'about'>('home');
  protected readonly page = signal(1);
  protected readonly pageSize = 5;
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly uploading = signal<ProfileImageType | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly editOpen = signal(false);
  protected readonly editFullName = signal('');
  protected readonly editPhone = signal('');
  protected readonly editDateOfBirth = signal('');

  private readonly requestedId =
    Number(this.route.snapshot.paramMap.get('id'))
    || this.auth.currentUser()?.id
    || 0;

  protected readonly ownProfile = computed(
    () => this.requestedId > 0
      && this.auth.currentUser()?.id === this.requestedId,
  );

  protected readonly user = computed<ProfileView | null>(() => {
    this.revision();
    if (this.ownProfile()) {
      const profile = this.apiProfile() ?? this.auth.currentUser();
      return profile ? this.toProfileView(profile) : null;
    }
    const row = this.database
      .table('users')
      .find((item) => item.id === this.requestedId);
    return row
      ? {
        id: row.id,
        user_name: row.user_name,
        email: row.email,
        full_name: row.full_name,
        phone: row.phone,
        avatar: row.avatar,
        cover_image: row.cover_image,
        date_of_birth: row.date_of_birth,
        email_verified: row.email_verified,
        role_id: row.role_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }
      : null;
  });

  protected readonly posts = computed<ProfilePost[]>(() => {
    this.revision();
    const user = this.user();
    if (!user) return [];
    const languageId = this.language.contentLanguageId();
    const translations = this.database.table('post_translations');
    const likes = this.database.table('post_likes');
    const comments = this.database.table('comments');
    return this.database
      .table('posts')
      .filter(
        (post) =>
          post.author_id === user.id
          && !post.deleted_at
          && (this.ownProfile() || post.status === 'PUBLISHED'),
      )
      .map((post) => ({
        id: post.id,
        title:
          translations.find(
            (item) =>
              item.post_id === post.id && item.language_id === languageId,
          )?.title
          ?? translations.find((item) => item.post_id === post.id)?.title
          ?? 'Untitled',
        content:
          translations.find(
            (item) =>
              item.post_id === post.id && item.language_id === languageId,
          )?.content
          ?? translations.find((item) => item.post_id === post.id)?.content
          ?? '',
        thumbnail: post.thumbnail,
        date: post.created_at,
        likes: likes.filter(
          (item) => item.post_id === post.id && item.is_liked,
        ).length,
        comments: comments.filter(
          (item) => item.post_id === post.id && !item.deleted_at,
        ).length,
        status: post.status,
      }))
      .sort((left, right) => +new Date(right.date) - +new Date(left.date));
  });

  protected readonly totalLikes = computed(() =>
    this.posts().reduce((sum, post) => sum + post.likes, 0),
  );
  protected readonly featured = computed(
    () => [...this.posts()].sort((left, right) => right.likes - left.likes)[0]
      ?? null,
  );
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.posts().length / this.pageSize)),
  );
  protected readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );
  protected readonly visiblePosts = computed(() =>
    this.posts().slice(
      (this.page() - 1) * this.pageSize,
      this.page() * this.pageSize,
    ),
  );

  ngOnInit(): void {
    if (this.ownProfile()) this.loadProfile();
  }

  protected name(): string {
    const user = this.user();
    return user?.full_name || user?.user_name || 'Anonymous';
  }

  protected avatar(): string {
    return (
      this.user()?.avatar
      || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(this.name())}`
    );
  }

  protected excerpt(html: string): string {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > 120 ? `${text.slice(0, 120)}...` : text;
  }

  protected formatDate(value: string, joined = false): string {
    return new Intl.DateTimeFormat(
      this.language.formatLocale(),
      joined
        ? { month: '2-digit', year: 'numeric' }
        : { month: 'short', day: 'numeric' },
    ).format(new Date(value));
  }

  protected statusLabel(status: PostStatus): string {
    const vi = {
      DRAFT: 'Bản nháp',
      PENDING: 'Chờ duyệt',
      PUBLISHED: 'Đã xuất bản',
      REJECTED: 'Bị từ chối',
    };
    const en = {
      DRAFT: 'Draft',
      PENDING: 'Pending',
      PUBLISHED: 'Published',
      REJECTED: 'Rejected',
    };
    return this.language.chooseObject(vi, en)[status];
  }

  protected roleLabel(): string {
    const role = this.user()?.role_id;
    return role === 1
      ? this.language.choose('Quản trị viên cấp cao', 'Super Admin')
      : role === 2
        ? this.language.choose('Chủ blog', 'Blogger')
        : this.language.choose('Thành viên', 'Member');
  }

  protected openEdit(): void {
    const user = this.user();
    if (!user || !this.ownProfile()) return;
    this.editFullName.set(user.full_name ?? '');
    this.editPhone.set(user.phone ?? '');
    this.editDateOfBirth.set(user.date_of_birth ?? '');
    this.errorMessage.set('');
    this.successMessage.set('');
    this.editOpen.set(true);
  }

  protected saveProfile(): void {
    if (this.saving()) return;
    const fullName = this.editFullName().trim();
    if (fullName.length < 2) {
      this.errorMessage.set(
        this.language.choose(
          'Họ tên cần có ít nhất 2 ký tự.',
          'Full name must contain at least 2 characters.',
        ),
      );
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.profileApi
      .updateProfile({
        fullName,
        phone: this.editPhone().trim() || null,
        dateOfBirth: this.editDateOfBirth() || null,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: ({ data }) => {
          this.applyCurrentUser(data.user);
          this.editOpen.set(false);
          this.successMessage.set(
            this.language.choose(
              'Đã cập nhật hồ sơ.',
              'Profile updated.',
            ),
          );
        },
        error: (error: unknown) => this.showError(error),
      });
  }

  protected upload(
    event: Event,
    type: ProfileImageType,
  ): void {
    if (!this.ownProfile() || this.uploading()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.errorMessage.set(
        this.language.choose(
          'Chỉ chấp nhận JPG, PNG, WebP tối đa 5 MB.',
          'Only JPG, PNG or WebP files up to 5 MB are allowed.',
        ),
      );
      return;
    }

    this.uploading.set(type);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.profileApi
      .uploadImage(type, file)
      .pipe(finalize(() => this.uploading.set(null)))
      .subscribe({
        next: ({ data }) => {
          this.applyCurrentUser(data.user);
          this.successMessage.set(
            this.language.choose(
              'Ảnh đã được tải lên Cloudinary.',
              'Image uploaded to Cloudinary.',
            ),
          );
        },
        error: (error: unknown) => this.showError(error),
      });
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.profileApi
      .getProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ data }) => this.applyCurrentUser(data.user),
        error: (error: unknown) => this.showError(error),
      });
  }

  private applyCurrentUser(user: User): void {
    this.apiProfile.set(user);
    this.auth.syncCurrentUser(user);
    this.revision.update((value) => value + 1);
  }

  private showError(error: unknown): void {
    const normalized = this.apiErrors.normalize(error);
    const messages: Record<string, string> = {
      UPLOAD_CLOUDINARY_NOT_CONFIGURED: this.language.choose(
        'Cloudinary chưa được cấu hình.',
        'Cloudinary has not been configured.',
      ),
      UPLOAD_CLOUDINARY_FAILED: this.language.choose(
        'Không thể tải ảnh lên Cloudinary.',
        'Unable to upload the image to Cloudinary.',
      ),
      UPLOAD_IMAGE_TYPE_NOT_ALLOWED: this.language.choose(
        'Định dạng ảnh không được hỗ trợ.',
        'This image format is not supported.',
      ),
    };
    this.errorMessage.set(
      messages[normalized.code]
      ?? normalized.messages[0]
      ?? this.language.choose(
        'Không thể hoàn tất yêu cầu.',
        'Unable to complete the request.',
      ),
    );
  }

  private toProfileView(user: User): ProfileView {
    const roleIds: Record<UserRole, number> = {
      [USER_ROLES.SUPER_ADMIN]: 1,
      [USER_ROLES.BLOG_OWNER]: 2,
      [USER_ROLES.AUTHENTICATED_USER]: 3,
    };
    return {
      id: user.id,
      user_name: user.userName,
      email: user.email,
      full_name: user.fullName,
      phone: user.phone,
      avatar: user.avatar,
      cover_image: user.coverImage ?? null,
      date_of_birth: user.dateOfBirth ?? null,
      email_verified: user.emailVerified,
      role_id: roleIds[user.role.nameRole],
      created_at: user.createdAt ?? new Date().toISOString(),
      updated_at: user.updatedAt ?? new Date().toISOString(),
    };
  }
}
