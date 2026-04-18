import { User } from '@prisma/client';

export interface IAuthService {
  register(createUserDto: {
    email: string;
    password: string;
    name: string;
    role?: string;
    phone?: string;
    CPF?: string;
    avatar?: string;
    CNPJ?: string;
    CRM?: string;
    COREN?: string;
  }): Promise<{ message: string; user: Partial<User> }>;

  login(loginDto: { email: string; password: string }): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<User>;
  }>;

  refresh(refreshDto: {
    refreshToken: string;
  }): Promise<{ accessToken: string }>;

  getCurrentUser(userId: string): Promise<Partial<User>>;

  logout(userId: string): Promise<{ message: string }>;
}
