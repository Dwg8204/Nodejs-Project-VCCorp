export enum RoleName {
  SuperAdmin = 'SUPER_ADMIN',
  BlogOwner = 'BLOG_OWNER',
  AuthenticatedUser = 'AUTHENTICATED_USER',
}

export enum OtpPurpose {
  PasswordReset = 'PASSWORD_RESET',
  EmailVerification = 'EMAIL_VERIFICATION',
}

export enum LanguageTranslationStatus {
  Draft = 'DRAFT',
  Translating = 'TRANSLATING',
  Ready = 'READY',
  Disabled = 'DISABLED',
}

export enum PostStatus {
  Draft = 'DRAFT',
  Pending = 'PENDING',
  Published = 'PUBLISHED',
  Rejected = 'REJECTED',
}
