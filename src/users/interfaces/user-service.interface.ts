import { User } from '@prisma/client';

export interface IUserService {
  create(createUserDto: {
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
  }): Promise<Partial<User>>;

  findAll(
    skip?: number,
    take?: number,
  ): Promise<{
    data: Partial<User>[];
    total: number;
    skip: number;
    take: number;
  }>;

  findOne(id: string): Promise<Partial<User>>;

  findByEmail(email: string): Promise<Partial<User>>;

  findByCPF(cpf: string): Promise<Partial<User>>;

  update(
    id: string,
    updateUserDto: {
      email?: string;
      name?: string;
      phone?: string;
      CPF?: string;
      avatar?: string;
      password?: string;
    },
  ): Promise<Partial<User>>;

  remove(id: string): Promise<{ message: string }>;

  validatePassword(password: string, hashedPassword: string): Promise<boolean>;
}
