import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  HttpException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private handleError(error: unknown, context: string) {
    const stack = error instanceof Error ? error.stack : undefined;
    this.logger.error(`Erro em ${context}:`, stack || error);
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(
      `Ocorreu um erro interno inesperado ao ${context}. Por favor, tente novamente mais tarde.`,
    );
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const {
        email,
        password,
        name,
        role,
        phone,
        CPF,
        avatar,
        CNPJ,
        CRM,
        COREN,
      } = createUserDto;

      // Validação de campos profissionais baseado no role
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      if (role === 'CLINIC_MANAGER' && !CNPJ) {
        throw new ConflictException(
          'CNPJ é obrigatório para gerentes de clínica',
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      if (role === 'DOCTOR' && !CRM) {
        throw new ConflictException('CRM é obrigatório para médicos');
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException(
          `Não foi possível criar o usuário. O email '${email}' já está em uso.`,
        );
      }

      if (CPF) {
        const existingCPF = await this.prisma.user.findUnique({
          where: { CPF },
        });

        if (existingCPF) {
          throw new ConflictException(
            `Não foi possível criar o usuário. O CPF '${CPF}' já está cadastrado.`,
          );
        }
      }

      if (CNPJ) {
        const existingCNPJ = await this.prisma.user.findUnique({
          where: { CNPJ },
        });

        if (existingCNPJ) {
          throw new ConflictException(
            `Não foi possível criar o usuário. O CNPJ '${CNPJ}' já está cadastrado.`,
          );
        }
      }

      if (CRM) {
        const existingCRM = await this.prisma.user.findUnique({
          where: { CRM },
        });

        if (existingCRM) {
          throw new ConflictException(
            `Não foi possível criar o usuário. O CRM '${CRM}' já está cadastrado.`,
          );
        }
      }

      if (COREN) {
        const existingCOREN = await this.prisma.user.findUnique({
          where: { COREN },
        });

        if (existingCOREN) {
          throw new ConflictException(
            `Não foi possível criar o usuário. O COREN '${COREN}' já está cadastrado.`,
          );
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || 'PATIENT',
          phone,
          CPF,
          CNPJ,
          CRM,
          COREN,
          avatar,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          phone: true,
          CPF: true,
          CNPJ: true,
          CRM: true,
          COREN: true,
          avatar: true,
          createdAt: true,
        },
      });

      return user;
    } catch (error) {
      this.handleError(error, 'criar usuário');
    }
  }

  async findAll(skip = 0, take = 10) {
    try {
      const users = await this.prisma.user.findMany({
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          phone: true,
          CPF: true,
          avatar: true,
          createdAt: true,
        },
      });

      const total = await this.prisma.user.count();

      return {
        data: users,
        total,
        skip,
        take,
      };
    } catch (error) {
      this.handleError(error, 'buscar todos os usuários');
    }
  }

  async findOne(id: string, userId: string, userRole: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          phone: true,
          CPF: true,
          avatar: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário não encontrado. ID fornecido: ${id}`,
        );
      }

      // Owner check: usuário pode ver apenas sua própria informação, ou ADMIN pode ver qualquer um
      if (id !== userId && userRole !== 'ADMIN') {
        throw new ForbiddenException(
          'Você só pode visualizar suas próprias informações',
        );
      }

      await this.auditService.logUserRead(userId, id);

      return user;
    } catch (error) {
      this.handleError(error, 'buscar usuário por ID');
    }
  }

  async findByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário não encontrado com o e-mail: ${email}`,
        );
      }

      return user;
    } catch (error) {
      this.handleError(error, 'buscar usuário por email');
    }
  }

  async findByCPF(cpf: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { CPF: cpf },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          phone: true,
          CPF: true,
          avatar: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`Usuário não encontrado com o CPF: ${cpf}`);
      }

      return user;
    } catch (error) {
      this.handleError(error, 'buscar usuário por CPF');
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    userId: string,
    userRole: string,
  ) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(
          `Usuário não pôde ser atualizado pois não existe. (ID: ${id})`,
        );
      }

      // Owner check: apenas ADMIN pode atualizar outros usuários
      if (id !== userId && userRole !== 'ADMIN') {
        throw new ForbiddenException(
          'Você só pode atualizar suas próprias informações',
        );
      }

      // Validar transição de status: PENDING_VERIFICATION -> ACTIVE
      if (updateUserDto.status) {
        const validTransitions: Record<string, string[]> = {
          PENDING_VERIFICATION: ['ACTIVE'],
          ACTIVE: ['SUSPENDED', 'INACTIVE'],
          SUSPENDED: ['ACTIVE', 'INACTIVE'],
          INACTIVE: ['ACTIVE'],
        };

        const currentStatus = existingUser.status;
        const newStatus = updateUserDto.status;

        const allowedStatuses = validTransitions[currentStatus] || [];
        if (!allowedStatuses.includes(newStatus)) {
          throw new ConflictException(
            `Transição de status inválida: ${currentStatus} -> ${newStatus}. Transições permitidas: ${allowedStatuses.join(', ') || 'nenhuma'}`,
          );
        }
      }

      const data: Record<string, string | undefined> = {
        ...updateUserDto,
      } as Record<string, string | undefined>;

      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const emailInUse = await this.prisma.user.findUnique({
          where: { email: updateUserDto.email },
        });

        if (emailInUse) {
          throw new ConflictException(
            `O email '${updateUserDto.email}' já está em uso por outro usuário.`,
          );
        }
      }

      if (updateUserDto.CPF && updateUserDto.CPF !== existingUser.CPF) {
        const cpfInUse = await this.prisma.user.findUnique({
          where: { CPF: updateUserDto.CPF },
        });

        if (cpfInUse) {
          throw new ConflictException(
            `O CPF '${updateUserDto.CPF}' já está em uso por outro usuário.`,
          );
        }
      }

      if (updateUserDto.password) {
        data.password = await bcrypt.hash(updateUserDto.password, 10);
      } else {
        delete data.password;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          phone: true,
          CPF: true,
          avatar: true,
          updatedAt: true,
        },
      });

      await this.auditService.logUserUpdate(id, id);

      return updatedUser;
    } catch (error) {
      this.handleError(error, 'atualizar usuário');
    }
  }

  async remove(id: string, userId: string, userRole: string) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(
          `Usuário não pôde ser deletado pois não foi encontrado no banco (ID: ${id})`,
        );
      }

      // Owner check: apenas ADMIN pode deletar usuários
      if (userRole !== 'ADMIN') {
        throw new ForbiddenException(
          'Apenas administradores podem deletar usuários',
        );
      }

      await this.prisma.user.delete({
        where: { id },
      });

      return { message: 'Usuário deletado com sucesso' };
    } catch (error) {
      this.handleError(error, 'remover usuário');
    }
  }

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
