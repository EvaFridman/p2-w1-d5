import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../users/users.types.js';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
