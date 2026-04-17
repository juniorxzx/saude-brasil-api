import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from './dto';

@Injectable()
export class MedicalRecordsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createMedicalRecordDto: CreateMedicalRecordDto,
    doctorId: string,
  ) {
    const { pacienteId, type, title, description, observations, recordDate } =
      createMedicalRecordDto;

    // Validar paciente existe
    const paciente = await this.prisma.user.findUnique({
      where: { id: pacienteId },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente não encontrado');
    }

    // Validar que paciente tem perfil de paciente
    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { userId: pacienteId },
    });

    if (!patientProfile) {
      throw new BadRequestException(
        'Usuário informado não é um paciente registrado',
      );
    }

    // Validar médico/clínica existe
    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Médico/Clínica não encontrado(a)');
    }

    // Criar registro
    const medicalRecord = await this.prisma.medicalRecord.create({
      data: {
        pacienteId,
        doctorId,
        type,
        title,
        description,
        observations,
        recordDate: new Date(recordDate),
      },
      include: {
        attachments: true,
      },
    });

    return medicalRecord;
  }

  async findAll(userId: string, userRole: string) {
    // Pacientes veem seus próprios registros
    if (userRole === 'PATIENT') {
      return this.prisma.medicalRecord.findMany({
        where: {
          pacienteId: userId,
        },
        include: {
          attachments: true,
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              CRM: true,
            },
          },
        },
        orderBy: { recordDate: 'desc' },
      });
    }

    // Médicos/Clínicas veem registros que criaram
    if (userRole === 'DOCTOR' || userRole === 'CLINIC_MANAGER') {
      return this.prisma.medicalRecord.findMany({
        where: {
          doctorId: userId,
        },
        include: {
          attachments: true,
          paciente: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { recordDate: 'desc' },
      });
    }

    throw new ForbiddenException(
      'Você não tem permissão para visualizar registros médicos',
    );
  }

  async findOne(recordId: string, userId: string, userRole: string) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        attachments: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            CRM: true,
          },
        },
        paciente: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Registro médico não encontrado');
    }

    // Validar permissões
    const isDoctor = record.doctorId === userId;
    const isPatient = record.pacienteId === userId;

    if (userRole === 'PATIENT' && !isPatient) {
      throw new ForbiddenException(
        'Você pode visualizar apenas seus próprios registros',
      );
    }

    if ((userRole === 'DOCTOR' || userRole === 'CLINIC_MANAGER') && !isDoctor) {
      throw new ForbiddenException(
        'Você pode visualizar apenas registros que você criou',
      );
    }

    return record;
  }

  async update(
    recordId: string,
    updateMedicalRecordDto: UpdateMedicalRecordDto,
    userId: string,
  ) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException('Registro médico não encontrado');
    }

    // Apenas o médico criador pode editar
    if (record.doctorId !== userId) {
      throw new ForbiddenException(
        'Apenas o médico que criou este registro pode editá-lo',
      );
    }

    const updated = await this.prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        ...updateMedicalRecordDto,
        recordDate: updateMedicalRecordDto.recordDate
          ? new Date(updateMedicalRecordDto.recordDate)
          : undefined,
      },
      include: {
        attachments: true,
      },
    });

    return updated;
  }

  async remove(recordId: string, userId: string) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException('Registro médico não encontrado');
    }

    // Apenas o médico criador pode deletar
    if (record.doctorId !== userId) {
      throw new ForbiddenException(
        'Apenas o médico que criou este registro pode deletá-lo',
      );
    }

    // Cascade delete vai remover attachments automaticamente
    await this.prisma.medicalRecord.delete({
      where: { id: recordId },
    });

    return { message: 'Registro médico deletado com sucesso' };
  }

  async addAttachment(
    recordId: string,
    fileName: string,
    fileSize: number,
    filePath: string,
    fileType: string,
    mimeType: string,
    userId: string,
  ) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException('Registro médico não encontrado');
    }

    // Apenas o médico criador pode adicionar attachments
    if (record.doctorId !== userId) {
      throw new ForbiddenException(
        'Apenas o médico que criou este registro pode adicionar anexos',
      );
    }

    const attachment = await this.prisma.medicalAttachment.create({
      data: {
        recordId,
        fileName,
        fileSize,
        filePath,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        fileType: fileType as any,
        mimeType,
      },
    });

    return attachment;
  }

  async removeAttachment(attachmentId: string, userId: string) {
    const attachment = await this.prisma.medicalAttachment.findUnique({
      where: { id: attachmentId },
      include: { record: true },
    });

    if (!attachment) {
      throw new NotFoundException('Anexo não encontrado');
    }

    // Apenas o médico criador do registro pode remover anexos
    if (attachment.record.doctorId !== userId) {
      throw new ForbiddenException(
        'Apenas o médico que criou este registro pode remover anexos',
      );
    }

    await this.prisma.medicalAttachment.delete({
      where: { id: attachmentId },
    });

    return { message: 'Anexo removido com sucesso' };
  }

  async getRecordsByPatient(pacienteId: string, doctorId: string) {
    return this.prisma.medicalRecord.findMany({
      where: {
        pacienteId,
        doctorId,
      },
      include: {
        attachments: true,
      },
      orderBy: { recordDate: 'desc' },
    });
  }
}
