import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RecordType } from '@prisma/client';

export class CreateMedicalRecordDto {
  @ApiProperty({
    description: 'ID do paciente',
    example: 'clj456xyz789',
  })
  @IsString()
  @IsNotEmpty()
  pacienteId: string;

  @ApiProperty({
    description: 'Tipo de registro médico',
    enum: RecordType,
    example: 'CONSULTATION',
  })
  @IsEnum(RecordType)
  @IsNotEmpty()
  type: RecordType;

  @ApiProperty({
    description: 'Título do registro (ex: Consulta de rotina)',
    example: 'Consulta de hipertensão',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do atendimento ou exame',
    example: 'Paciente apresenta hipertensão controlada com medicação...',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Observações adicionais do médico',
    example: 'Retorno em 30 dias para verificação de pressão arterial',
    required: false,
  })
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiProperty({
    description: 'Data do atendimento/exame (ISO 8601)',
    example: '2025-04-16T10:30:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  recordDate: string;
}
