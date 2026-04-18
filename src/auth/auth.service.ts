import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RefreshDto } from './dto';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto';
import { SECURITY_CONFIG } from '../config/security.constants';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '@prisma/client';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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

  private getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return secret;
  }

  private getJwtRefreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }
    return secret;
  }

  async register(createUserDto: CreateUserDto) {
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

      if (role && role === 'CLINIC_MANAGER' && !CNPJ) {
        throw new ConflictException(
          'CNPJ é obrigatório para gerentes de clínica',
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      if (role && role === 'DOCTOR' && !CRM) {
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

      const hashedPassword = await bcrypt.hash(
        password,
        SECURITY_CONFIG.PASSWORD.SALT_ROUNDS,
      );

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

      return {
        message: 'Usuário registrado com sucesso',
        user,
      };
    } catch (error) {
      this.handleError(error, 'registrar usuário');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException('Email ou senha inválidos');
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        throw new UnauthorizedException('Email ou senha inválidos');
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: SECURITY_CONFIG.JWT.ACCESS_TOKEN_EXPIRY,
        secret: this.getJwtSecret(),
      });

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: SECURITY_CONFIG.JWT.REFRESH_TOKEN_EXPIRY,
        secret: this.getJwtRefreshSecret(),
      });

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken,
        },
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        },
      };
    } catch (error) {
      this.handleError(error, 'fazer login');
    }
  }

  async refresh(refreshDto: RefreshDto) {
    try {
      const { refreshToken } = refreshDto;

      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.getJwtRefreshSecret(),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Refresh token inválido ou expirado');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: SECURITY_CONFIG.JWT.ACCESS_TOKEN_EXPIRY,
        secret: this.getJwtSecret(),
      });

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      this.handleError(error, 'renovar token');
    }
  }

  async getCurrentUser(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
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

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      return user;
    } catch (error) {
      this.handleError(error, 'buscar usuário atual');
    }
  }

  async logout(userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          refreshToken: null,
        },
      });

      return { message: 'Logout realizado com sucesso' };
    } catch (error) {
      this.handleError(error, 'fazer logout');
    }
  }
}
