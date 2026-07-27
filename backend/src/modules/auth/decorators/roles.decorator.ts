import { SetMetadata } from '@nestjs/common';
import { RoleName } from 'common/enums/database.enums';

export const ROLES_KEY = 'auth:roles';
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
