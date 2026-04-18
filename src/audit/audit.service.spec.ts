import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

describe('AuditService', () => {
  let service: AuditService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.log({
        userId: 'user-1',
        action: 'LOGIN' as AuditAction,
        resource: 'auth',
        resourceId: 'resource-1',
      });

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'LOGIN',
          resource: 'auth',
          resourceId: 'resource-1',
          metadata: undefined,
        },
      });
    });

    it('should create audit log with metadata', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.log({
        action: 'LOGIN_FAILED' as AuditAction,
        resource: 'auth',
        metadata: { email: 'test@example.com' },
      });

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'LOGIN_FAILED',
          resource: 'auth',
          metadata: JSON.stringify({ email: 'test@example.com' }),
        },
      });
    });

    it('should handle errors silently', async () => {
      mockPrismaService.auditLog.create.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.log({
          userId: 'user-1',
          action: 'LOGIN' as AuditAction,
          resource: 'auth',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('logLogin', () => {
    it('should log a login event', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.logLogin('user-1', '192.168.1.1', 'Mozilla/5.0');

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'LOGIN',
          resource: 'auth',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });
  });

  describe('logLoginFailed', () => {
    it('should log a failed login event with masked email', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.logLoginFailed('test@example.com');

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'LOGIN_FAILED',
          resource: 'auth',
          metadata: JSON.stringify({ email: 't***t@example.com' }),
        },
      });
    });

    it('should mask short email local part', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.logLoginFailed('ab@c.com');

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'LOGIN_FAILED',
          resource: 'auth',
          metadata: JSON.stringify({ email: '***@c.com' }),
        },
      });
    });
  });

  describe('logLogout', () => {
    it('should log a logout event', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.logLogout('user-1');

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'LOGOUT',
          resource: 'auth',
        },
      });
    });
  });

  describe('logRegister', () => {
    it('should log a registration event', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.logRegister('user-1');

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'REGISTER',
          resource: 'auth',
        },
      });
    });
  });

  describe('logUserRead', () => {
    it('should log a user read event', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.logUserRead('admin-1', 'user-1');

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-1',
          action: 'USER_READ',
          resource: 'users',
          resourceId: 'user-1',
        },
      });
    });
  });

  describe('logUserUpdate', () => {
    it('should log a user update event', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.logUserUpdate('admin-1', 'user-1');

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-1',
          action: 'USER_UPDATE',
          resource: 'users',
          resourceId: 'user-1',
        },
      });
    });
  });

  describe('logProfileRead', () => {
    it('should log a profile read event', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.logProfileRead('user-1');

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'PROFILE_READ',
          resource: 'patient_profile',
        },
      });
    });
  });

  describe('logProfileUpdate', () => {
    it('should log a profile update event', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.logProfileUpdate('user-1');

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'PROFILE_UPDATE',
          resource: 'patient_profile',
        },
      });
    });
  });

  describe('logRecordRead', () => {
    it('should log a medical record read event', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.logRecordRead('doctor-1', 'record-1');

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'doctor-1',
          action: 'RECORD_READ',
          resource: 'medical_records',
          resourceId: 'record-1',
        },
      });
    });
  });

  describe('logRecordCreate', () => {
    it('should log a medical record create event', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.logRecordCreate('doctor-1', 'record-1');

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'doctor-1',
          action: 'RECORD_CREATE',
          resource: 'medical_records',
          resourceId: 'record-1',
        },
      });
    });
  });

  describe('logRecordUpdate', () => {
    it('should log a medical record update event', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.logRecordUpdate('doctor-1', 'record-1');

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'doctor-1',
          action: 'RECORD_UPDATE',
          resource: 'medical_records',
          resourceId: 'record-1',
        },
      });
    });
  });

  describe('maskEmail', () => {
    it('should mask email correctly', () => {
      const email = 'test@example.com';
      const masked = service['maskEmail'](email);
      expect(masked).toBe('t***t@example.com');
    });

    it('should handle short local part', () => {
      const email = 'ab@example.com';
      const masked = service['maskEmail'](email);
      expect(masked).toBe('***@example.com');
    });

    it('should handle email without domain', () => {
      const email = 'test';
      const masked = service['maskEmail'](email);
      expect(masked).toBe('***');
    });
  });
});
