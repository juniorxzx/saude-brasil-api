import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CurrentUser } from '../auth/interfaces/current-user.interface';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from './dto';

@ApiTags('medical-records')
@ApiBearerAuth()
@Controller('medical-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @Roles('DOCTOR')
  @ApiOperation({
    summary: 'Criar novo registro médico',
    description:
      'Cria um novo registro médico para um paciente. Apenas médicos e clínicas podem criar registros.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registro médico criado com sucesso',
    schema: {
      example: {
        id: 'clj456xyz789',
        pacienteId: 'clj123abc456',
        doctorId: 'clj789def012',
        type: 'CONSULTATION',
        title: 'Consulta de hipertensão',
        description: 'Paciente apresenta pressão arterial elevada...',
        observations: 'Retorno em 30 dias',
        recordDate: '2025-04-16T10:30:00Z',
        attachments: [],
        createdAt: '2025-04-16T15:30:00Z',
        updatedAt: '2025-04-16T15:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Paciente não encontrado ou usuário não é paciente',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão (apenas médicos podem criar registros)',
  })
  async create(
    @Body() createMedicalRecordDto: CreateMedicalRecordDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.medicalRecordsService.create(createMedicalRecordDto, user.id);
  }

  @Get()
  @Roles('DOCTOR', 'PATIENT', 'CLINIC_MANAGER', 'ADMIN')
  @ApiOperation({
    summary: 'Listar registros médicos',
    description:
      'Retorna registros médicos de acordo com o papel do usuário. Pacientes veem seus próprios registros, médicos veem os que criaram.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros médicos',
    schema: {
      example: [
        {
          id: 'clj456xyz789',
          pacienteId: 'clj123abc456',
          doctorId: 'clj789def012',
          type: 'CONSULTATION',
          title: 'Consulta de rotina',
          description: 'Checkup geral...',
          observations: null,
          recordDate: '2025-04-16T10:30:00Z',
          attachments: [],
          createdAt: '2025-04-16T15:30:00Z',
          updatedAt: '2025-04-16T15:30:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão',
  })
  async findAll(@GetUser() user: CurrentUser) {
    return this.medicalRecordsService.findAll(user.id, user.role);
  }

  @Get(':id')
  @Roles('DOCTOR', 'PATIENT', 'CLINIC_MANAGER', 'ADMIN')
  @ApiOperation({
    summary: 'Obter detalhes de um registro médico',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do registro médico',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para visualizar este registro',
  })
  async findOne(@Param('id') id: string, @GetUser() user: CurrentUser) {
    return this.medicalRecordsService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @Roles('DOCTOR')
  @ApiOperation({
    summary: 'Atualizar registro médico',
    description: 'Apenas o médico que criou o registro pode atualizá-lo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Registro atualizado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar este registro',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMedicalRecordDto: UpdateMedicalRecordDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.medicalRecordsService.update(
      id,
      updateMedicalRecordDto,
      user.id,
    );
  }

  @Delete(':id')
  @Roles('DOCTOR')
  @ApiOperation({
    summary: 'Deletar registro médico',
    description: 'Apenas o médico que criou o registro pode deletá-lo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Registro deletado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para deletar este registro',
  })
  async remove(@Param('id') id: string, @GetUser() user: CurrentUser) {
    return this.medicalRecordsService.remove(id, user.id);
  }

  @Post(':id/attachments')
  @Roles('DOCTOR')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Fazer upload de anexo de registro médico',
    description: 'Apenas o médico que criou o registro pode adicionar anexos.',
  })
  @ApiResponse({
    status: 201,
    description: 'Anexo enviado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para adicionar anexos a este registro',
  })
  async uploadAttachment(
    @Param('id') recordId: string,

    @UploadedFile() file: any,
    @GetUser() user: CurrentUser,
  ) {
    if (!file) {
      throw new Error('Nenhum arquivo foi enviado');
    }

    const attachment = await this.medicalRecordsService.addAttachment(
      recordId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      file.originalname,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      file.size,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      file.path,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      file.mimetype.split('/')[1],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      file.mimetype,
      user.id,
    );

    return attachment;
  }

  @Delete('attachments/:attachmentId')
  @Roles('DOCTOR')
  @ApiOperation({
    summary: 'Remover anexo de registro médico',
  })
  @ApiResponse({
    status: 200,
    description: 'Anexo removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Anexo não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para remover este anexo',
  })
  async removeAttachment(
    @Param('attachmentId') attachmentId: string,
    @GetUser() user: CurrentUser,
  ) {
    return this.medicalRecordsService.removeAttachment(attachmentId, user.id);
  }
}
