export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  avatarFileName: string | null;
};
