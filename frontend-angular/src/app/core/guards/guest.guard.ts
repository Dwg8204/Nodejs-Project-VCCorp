import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { USER_ROLES } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;

  if (auth.role() === USER_ROLES.SUPER_ADMIN) return router.createUrlTree(['/admin/dashboard']);
  if (auth.role() === USER_ROLES.BLOG_OWNER) return router.createUrlTree(['/owner/posts']);
  return router.createUrlTree(['/']);
};
