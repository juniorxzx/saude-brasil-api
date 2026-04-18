import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockAuditService = {
    logRegister: jest.fn(),
    logLogin: jest.fn(),
    logLoginFailed: jest.fn(),
    logLogout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();

    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  describe('register', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User',
      role: 'PATIENT',
    };

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1' });

      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if CPF already exists', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: '1' });

      const dtoWithCPF = { ...createUserDto, CPF: '12345678901' };
      await expect(service.register(dtoWithCPF)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if CNPJ missing for CLINIC_MANAGER', async () => {
      const dto = { ...createUserDto, role: 'CLINIC_MANAGER' };
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if CRM missing for DOCTOR', async () => {
      const dto = { ...createUserDto, role: 'DOCTOR' };
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should successfully register a new patient', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'PATIENT',
        status: 'ACTIVE',
      });

      const result = await service.register(createUserDto);

      expect(result).toHaveProperty('message');
      expect(result.user).toHaveProperty('id');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123',
    };

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'PATIENT',
        status: 'ACTIVE',
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should successfully login with valid credentials', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'PATIENT' as const,
        status: 'ACTIVE' as const,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('mock-token');
      mockPrismaService.user.update.mockResolvedValue(user);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('id');
    });
  });

  describe('refresh', () => {
    const refreshDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should throw UnauthorizedException if user not found', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        refreshToken: 'different-token',
      });

      await expect(service.refresh(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should successfully refresh token with valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'PATIENT',
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        refreshToken: 'valid-refresh-token',
      });
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refresh(refreshDto);

      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('getCurrentUser', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getCurrentUser('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return user data if user exists', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'PATIENT',
        status: 'ACTIVE',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.getCurrentUser('user-1');

      expect(result).toEqual(user);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.logout('user-1');

      expect(result).toHaveProperty('message');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: null },
      });
    });
  });

  describe('getJwtSecret', () => {
    it('should throw error if JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      expect(() => service['getJwtSecret']()).toThrow(
        'JWT_SECRET environment variable is required',
      );
    });

    it('should return JWT_SECRET if set', () => {
      process.env.JWT_SECRET = 'test-secret';
      expect(service['getJwtSecret']()).toBe('test-secret');
    });
  });

  describe('getJwtRefreshSecret', () => {
    it('should throw error if JWT_REFRESH_SECRET is not set', () => {
      delete process.env.JWT_REFRESH_SECRET;
      expect(() => service['getJwtRefreshSecret']()).toThrow(
        'JWT_REFRESH_SECRET environment variable is required',
      );
    });

    it('should return JWT_REFRESH_SECRET if set', () => {
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
      expect(service['getJwtRefreshSecret']()).toBe('test-refresh-secret');
    });
  });
});
