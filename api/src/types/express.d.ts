import type { PublicUser } from '../users/users.types.js';

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}
