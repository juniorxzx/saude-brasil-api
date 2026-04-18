import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../common/services/encryption.service';
import { CreatePatientProfileDto, UpdatePatientProfileDto } from './dto';

@Injectable()
export class PatientProfileService {
  private readonly logger = new Logger(PatientProfileService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private encryptionService: EncryptionService,
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

  async create(
    userId: string,
    createPatientProfileDto: CreatePatientProfileDto,
  ) {
    try {
      const existingProfile = await this.prisma.patientProfile.findUnique({
        where: { userId },
      });

      if (existingProfile) {
        return this.update(userId, createPatientProfileDto);
      }

      const encryptedData = this.encryptSensitiveFields(
        createPatientProfileDto,
      );

      const patientProfile = await this.prisma.patientProfile.create({
        data: {
          userId,
          ...encryptedData,
        },
      });

      return this.decryptSensitiveFields(patientProfile);
    } catch (error) {
      this.handleError(error, 'criar perfil do paciente');
    }
  }

  async findOne(userId: string) {
    try {
      const patientProfile = await this.prisma.patientProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              CPF: true,
              avatar: true,
            },
          },
        },
      });

      if (!patientProfile) {
        throw new NotFoundException(
          `Perfil do paciente não encontrado para o usuário: ${userId}`,
        );
      }

      await this.auditService.logProfileRead(userId);

      return this.decryptSensitiveFields(patientProfile);
    } catch (error) {
      this.handleError(error, 'buscar perfil do paciente');
    }
  }

  async update(
    userId: string,
    updatePatientProfileDto: UpdatePatientProfileDto,
  ) {
    try {
      const existingProfile = await this.prisma.patientProfile.findUnique({
        where: { userId },
      });

      if (!existingProfile) {
        throw new NotFoundException(
          `Perfil do paciente não encontrado para o usuário: ${userId}`,
        );
      }

      const encryptedData = this.encryptSensitiveFields(
        updatePatientProfileDto,
      );

      const updatedProfile = await this.prisma.patientProfile.update({
        where: { userId },
        data: encryptedData,
      });

      await this.auditService.logProfileUpdate(userId);

      return this.decryptSensitiveFields(updatedProfile);
    } catch (error) {
      this.handleError(error, 'atualizar perfil do paciente');
    }
  }

  async remove(userId: string) {
    try {
      const existingProfile = await this.prisma.patientProfile.findUnique({
        where: { userId },
      });

      if (!existingProfile) {
        throw new NotFoundException(
          `Perfil do paciente não encontrado para o usuário: ${userId}`,
        );
      }

      await this.prisma.patientProfile.delete({
        where: { userId },
      });

      return { message: 'Perfil do paciente deletado com sucesso' };
    } catch (error) {
      this.handleError(error, 'remover perfil do paciente');
    }
  }

  private encryptSensitiveFields<
    T extends {
      allergies?: string[];
      medications?: string[];
      medicalConditions?: string[];
    },
  >(data: T): T {
    const encrypted = { ...data };
    if (data.allergies?.length) {
      encrypted.allergies = [
        this.encryptionService.encrypt(data.allergies.join('|')),
      ];
    }
    if (data.medications?.length) {
      encrypted.medications = [
        this.encryptionService.encrypt(data.medications.join('|')),
      ];
    }
    if (data.medicalConditions?.length) {
      encrypted.medicalConditions = [
        this.encryptionService.encrypt(data.medicalConditions.join('|')),
      ];
    }
    return encrypted;
  }

  private decryptSensitiveFields<
    T extends {
      allergies?: string[];
      medications?: string[];
      medicalConditions?: string[];
    },
  >(data: T): T {
    const decrypted = { ...data };
    if (data.allergies?.length && data.allergies[0]) {
      try {
        decrypted.allergies = this.encryptionService
          .decrypt(data.allergies[0])
          .split('|');
      } catch {
        decrypted.allergies = data.allergies;
      }
    }
    if (data.medications?.length && data.medications[0]) {
      try {
        decrypted.medications = this.encryptionService
          .decrypt(data.medications[0])
          .split('|');
      } catch {
        decrypted.medications = data.medications;
      }
    }
    if (data.medicalConditions?.length && data.medicalConditions[0]) {
      try {
        decrypted.medicalConditions = this.encryptionService
          .decrypt(data.medicalConditions[0])
          .split('|');
      } catch {
        decrypted.medicalConditions = data.medicalConditions;
      }
    }
    return decrypted;
  }
}
