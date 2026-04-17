import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientProfileDto, UpdatePatientProfileDto } from './dto';

@Injectable()
export class PatientProfileService {
  private readonly logger = new Logger(PatientProfileService.name);

  constructor(private prisma: PrismaService) {}

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

      const patientProfile = await this.prisma.patientProfile.create({
        data: {
          userId,
          ...createPatientProfileDto,
        },
      });

      return patientProfile;
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

      return patientProfile;
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

      const updatedProfile = await this.prisma.patientProfile.update({
        where: { userId },
        data: updatePatientProfileDto,
      });

      return updatedProfile;
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
}
