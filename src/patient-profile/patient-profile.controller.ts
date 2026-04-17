import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    userId?: string;
    id?: string;
  };
}
import { PatientProfileService } from './patient-profile.service';
import { CreatePatientProfileDto, UpdatePatientProfileDto } from './dto';

@ApiTags('Patient Profile')
@ApiBearerAuth()
@Controller('patient-profile')
export class PatientProfileController {
  constructor(private readonly patientProfileService: PatientProfileService) {}

  private getUserIdFromRequest(req: Request): string {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId || authReq.user?.id;
    if (!userId) {
      throw new BadRequestException('Usuário não autenticado');
    }
    return userId;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar ou atualizar o perfil do paciente' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Perfil do paciente criado ou atualizado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Usuário não autenticado.',
  })
  async create(
    @Req() req: Request,
    @Body() createPatientProfileDto: CreatePatientProfileDto,
  ): Promise<any> {
    const userId = this.getUserIdFromRequest(req);
    return this.patientProfileService.create(userId, createPatientProfileDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar o perfil do paciente autenticado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil do paciente encontrado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Perfil do paciente não encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Usuário não autenticado.',
  })
  async findOne(@Req() req: Request): Promise<any> {
    const userId = this.getUserIdFromRequest(req);
    return this.patientProfileService.findOne(userId);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar o perfil do paciente autenticado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil do paciente atualizado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Perfil do paciente não encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Usuário não autenticado.',
  })
  async update(
    @Req() req: Request,
    @Body() updatePatientProfileDto: UpdatePatientProfileDto,
  ): Promise<any> {
    const userId = this.getUserIdFromRequest(req);
    return this.patientProfileService.update(userId, updatePatientProfileDto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover o perfil do paciente autenticado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil do paciente removido com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Perfil do paciente não encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Usuário não autenticado.',
  })
  async remove(@Req() req: Request): Promise<any> {
    const userId = this.getUserIdFromRequest(req);
    return this.patientProfileService.remove(userId);
  }
}
