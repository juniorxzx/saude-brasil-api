import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RecordType } from '@prisma/client';

export class UpdateMedicalRecordDto {
  @ApiProperty({
    description: 'Tipo de registro médico',
    enum: RecordType,
    required: false,
    example: 'CONSULTATION',
  })
  @IsEnum(RecordType)
  @IsOptional()
  type?: RecordType;

  @ApiProperty({
    description: 'Título do registro',
    required: false,
    example: 'Consulta de retorno',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Descrição detalhada do atendimento',
    required: false,
    example: 'Pressão arterial voltou ao normal...',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Observações adicionais',
    required: false,
    example: 'Continuar com a mesma medicação',
  })
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiProperty({
    description: 'Data do atendimento/exame',
    required: false,
    example: '2025-04-16T10:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  recordDate?: string;
}
