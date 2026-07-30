import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { USER_ROLES, User, UserRole } from '../../core/models/auth.model';
import { ContentPost } from '../../core/models/content.model';
import { ApiErrorService } from '../../core/services/api-error.service';
import { AuthService } from '../../core/services/auth.service';
import { ContentApiService } from '../../core/services/content-api.service';
import { FeedUiService } from '../../core/services/feed-ui.service';
import { LanguageService } from '../../core/services/language.service';
import { buildPaginationItems } from '../../shared/utils/pagination';
import {
  ProfileApiService,
  ProfileImageType,
  PublicProfileUser,
} from '../../core/services/profile-api.service';
import { OwnerPostsApiService } from '../../core/services/owner-posts-api.service';

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
  status: ContentPost['status'];
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
  private readonly profileApi = inject(ProfileApiService);
  private readonly contentApi = inject(ContentApiService);
  private readonly ownerPostsApi = inject(OwnerPostsApiService);
  private readonly apiErrors = inject(ApiErrorService);
  protected readonly auth = inject(AuthService);
  protected readonly language = inject(LanguageService);
  protected readonly feedUi = inject(FeedUiService);
  private readonly revision = signal(0);
  private readonly apiProfile = signal<User | null>(null);
  private readonly publicProfile = signal<PublicProfileUser | null>(null);
  private readonly apiPosts = signal<ProfilePost[]>([]);

  protected readonly tab = signal<'home' | 'about'>('home');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(5);
  protected readonly pageInput = signal(1);
  protected readonly sizeInput = signal(5);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly uploading = signal<ProfileImageType | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly editOpen = signal(false);
  protected readonly editFullName = signal('');
  protected readonly editPhone = signal('');
  protected readonly editDateOfBirth = signal('');
  protected readonly currentPassword = signal('');
  protected readonly newPassword = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly passwordMessage = signal('');

  private readonly requestedId =
    Number(this.route.snapshot.paramMap.get('id'))
    || this.auth.currentUser()?.id
    || 0;

  constructor() {
    effect(() => {
      this.language.locale();
      this.loadPosts();
    }, { allowSignalWrites: true });
  }

  protected readonly ownProfile = computed(
    () => this.requestedId > 0
      && this.auth.currentUser()?.id === this.requestedId,
  );

  protected readonly user = computed<ProfileView | null>(() => {
    if (this.ownProfile()) {
      const profile = this.apiProfile() ?? this.auth.currentUser();
      return profile ? this.toProfileView(profile) : null;
    }
    const row = this.publicProfile();
    return row
      ? {
        id: row.id,
        user_name: row.userName,
        email: '',
        full_name: row.fullName,
        phone: null,
        avatar: row.avatar,
        cover_image: row.coverImage,
        date_of_birth: null,
        email_verified: true,
        role_id: this.roleId(row.role),
        created_at: row.createdAt,
        updated_at: row.createdAt,
      }
      : null;
  });

  protected readonly posts = computed<ProfilePost[]>(() => this.apiPosts());

  protected readonly totalLikes = computed(() =>
    this.posts().reduce((sum, post) => sum + post.likes, 0),
  );
  protected readonly featured = computed(
    () => [...this.posts()].sort((left, right) => right.likes - left.likes)[0]
      ?? null,
  );
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.posts().length / this.pageSize())),
  );
  protected readonly pages = computed(() =>
    buildPaginationItems(this.page(), this.totalPages()),
  );
  protected readonly visiblePosts = computed(() =>
    this.posts().slice(
      (this.page() - 1) * this.pageSize(),
      this.page() * this.pageSize(),
    ),
  );
  protected readonly paginationSummary = computed(() => {
    const total = this.posts().length;
    const from = total ? (this.page() - 1) * this.pageSize() + 1 : 0;
    const to = Math.min(this.page() * this.pageSize(), total);
    return this.language.translate('pagination.summary', { from, to, total });
  });

  ngOnInit(): void {
    if (this.ownProfile()) this.loadProfile();
    else this.loadPublicProfile();
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

  protected statusLabel(status: ContentPost['status']): string {
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

  protected changePage(value: number): void {
    const next = Math.min(Math.max(1, Math.trunc(value || 1)), this.totalPages());
    this.page.set(next);
    this.pageInput.set(next);
  }

  protected applyPage(): void {
    this.changePage(this.pageInput());
  }

  protected applyPageSize(): void {
    const size = Math.min(100, Math.max(1, Math.trunc(this.sizeInput() || 1)));
    this.pageSize.set(size);
    this.sizeInput.set(size);
    this.changePage(1);
  }

  protected openEdit(): void {
    const user = this.user();
    if (!user || !this.ownProfile()) return;
    this.editFullName.set(user.full_name ?? '');
    this.editPhone.set(user.phone ?? '');
    this.editDateOfBirth.set(user.date_of_birth ?? '');
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.passwordMessage.set('');
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

  protected savePassword(): void {
    if (this.saving()) return;
    const currentPassword = this.currentPassword();
    const newPassword = this.newPassword();
    if (!currentPassword || !newPassword || !this.confirmPassword()) {
      this.errorMessage.set(
        this.language.choose(
          'Vui lòng nhập đầy đủ ba trường mật khẩu.',
          'Please complete all three password fields.',
        ),
      );
      return;
    }
    if (
      newPassword.length < 8
      || !/[a-z]/.test(newPassword)
      || !/[A-Z]/.test(newPassword)
      || !/\d/.test(newPassword)
    ) {
      this.errorMessage.set(
        this.language.choose(
          'Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.',
          'The new password must be at least 8 characters and include upper case, lower case and a number.',
        ),
      );
      return;
    }
    if (newPassword !== this.confirmPassword()) {
      this.errorMessage.set(
        this.language.choose(
          'Xác nhận mật khẩu mới không khớp.',
          'The new password confirmation does not match.',
        ),
      );
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.passwordMessage.set('');
    this.profileApi
      .changePassword({
        currentPassword,
        newPassword,
        confirmPassword: this.confirmPassword(),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmPassword.set('');
          this.passwordMessage.set(
            this.language.choose(
              'Mật khẩu đã được cập nhật.',
              'Password updated successfully.',
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

  private loadPublicProfile(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.profileApi
      .getPublicProfile(this.requestedId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ data }) => this.publicProfile.set(data.user),
        error: (error: unknown) => this.showError(error),
      });
  }

  private loadPosts(): void {
    const request = this.ownProfile() && this.auth.role() === USER_ROLES.BLOG_OWNER
      ? this.ownerPostsApi.list({ page: 1, limit: 50, sort: 'newest' })
      : this.contentApi.posts({
        page: 1,
        limit: 50,
        authorId: this.requestedId,
        language: this.language.locale(),
        sort: 'newest',
      });
    request.subscribe({
      next: ({ data }) =>
        this.apiPosts.set(data.items.map((post) => this.mapPost(post))),
      error: (error: unknown) => {
        this.apiPosts.set([]);
        this.showError(error);
      },
    });
  }

  private mapPost(post: ContentPost): ProfilePost {
    const translation =
      post.translations.find(
        (item) => item.languageId === this.language.languageId(),
      )
      ?? post.translations[0];
    return {
      id: Number(post.id),
      title: translation?.title ?? 'Untitled',
      content: translation?.content ?? '',
      thumbnail: post.thumbnail,
      date: post.publishedAt ?? post.createdAt,
      likes: Number(post.likesCount ?? 0),
      comments: Number(post.commentsCount ?? 0),
      status: post.status,
    };
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
      PROFILE_CURRENT_PASSWORD_INVALID: this.language.choose(
        'Mật khẩu hiện tại không chính xác.',
        'The current password is incorrect.',
      ),
      PROFILE_PASSWORD_CONFIRMATION_MISMATCH: this.language.choose(
        'Xác nhận mật khẩu mới không khớp.',
        'The new password confirmation does not match.',
      ),
      PROFILE_PASSWORD_UNCHANGED: this.language.choose(
        'Mật khẩu mới phải khác mật khẩu hiện tại.',
        'The new password must differ from the current password.',
      ),
      AUTH_PASSWORD_COMPLEXITY_REQUIRED: this.language.choose(
        'Mật khẩu mới phải có chữ hoa, chữ thường và số.',
        'The new password must include upper case, lower case and a number.',
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

  private roleId(role: UserRole): number {
    return role === USER_ROLES.SUPER_ADMIN
      ? 1
      : role === USER_ROLES.BLOG_OWNER
        ? 2
        : 3;
  }
}
