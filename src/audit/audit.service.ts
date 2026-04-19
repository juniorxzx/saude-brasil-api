import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : undefined,
        },
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  async logLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'LOGIN',
      resource: 'auth',
      ipAddress,
      userAgent,
    });
  }

  async logLoginFailed(
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      action: 'LOGIN_FAILED',
      resource: 'auth',
      ipAddress,
      userAgent,
      metadata: { email: this.maskEmail(email) },
    });
  }

  async logLogout(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'LOGOUT',
      resource: 'auth',
      ipAddress,
      userAgent,
    });
  }

  async logRegister(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'REGISTER',
      resource: 'auth',
      ipAddress,
      userAgent,
    });
  }

  async logUserRead(
    userId: string,
    targetUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'USER_READ',
      resource: 'users',
      resourceId: targetUserId,
      ipAddress,
      userAgent,
    });
  }

  async logUserUpdate(
    userId: string,
    targetUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'USER_UPDATE',
      resource: 'users',
      resourceId: targetUserId,
      ipAddress,
      userAgent,
    });
  }

  async logProfileRead(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'PROFILE_READ',
      resource: 'patient_profile',
      ipAddress,
      userAgent,
    });
  }

  async logProfileUpdate(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'PROFILE_UPDATE',
      resource: 'patient_profile',
      ipAddress,
      userAgent,
    });
  }

  async logRecordRead(
    userId: string,
    recordId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'RECORD_READ',
      resource: 'medical_records',
      resourceId: recordId,
      ipAddress,
      userAgent,
    });
  }

  async logRecordCreate(
    userId: string,
    recordId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'RECORD_CREATE',
      resource: 'medical_records',
      resourceId: recordId,
      ipAddress,
      userAgent,
    });
  }

  async logRecordUpdate(
    userId: string,
    recordId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'RECORD_UPDATE',
      resource: 'medical_records',
      resourceId: recordId,
      ipAddress,
      userAgent,
    });
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const maskedLocal =
      local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : '***';
    return `${maskedLocal}@${domain}`;
  }

  async logAuthMissingToken(
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      action: 'LOGIN_FAILED',
      resource: 'auth',
      ipAddress,
      userAgent,
      metadata: { reason: 'Missing token', ...metadata },
    });
  }

  async logAuthInvalidToken(
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      action: 'LOGIN_FAILED',
      resource: 'auth',
      ipAddress,
      userAgent,
      metadata: { reason: 'Invalid token', ...metadata },
    });
  }

  async logAuthInsufficientRole(
    userId: string,
    requiredRoles: string[],
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'LOGIN_FAILED',
      resource: 'auth',
      ipAddress,
      userAgent,
      metadata: { reason: 'Insufficient role', requiredRoles },
    });
  }
}
