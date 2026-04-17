import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientProfileDto {
  @ApiPropertyOptional({
    description: 'Número do cartão SUS do paciente',
    example: '123456789012345',
  })
  @IsOptional()
  @IsString({ message: 'Cartão SUS deve ser uma string' })
  susCard?: string;

  @ApiPropertyOptional({
    description: 'Tipo sanguíneo do paciente',
    example: 'O+',
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
  })
  @IsOptional()
  @IsString({ message: 'Tipo sanguíneo deve ser uma string' })
  bloodType?: string;

  @ApiPropertyOptional({
    description: 'Lista de alergias do paciente',
    example: ['Penicilina', 'Amendoim'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Alergias deve ser um array' })
  allergies?: string[];

  @ApiPropertyOptional({
    description: 'Lista de medicamentos de uso contínuo',
    example: ['Losartana 50mg', 'Metformina 500mg'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Medicamentos deve ser um array' })
  medications?: string[];

  @ApiPropertyOptional({
    description: 'Lista de condições médicas pré-existentes',
    example: ['Diabetes Tipo 2', 'Hipertensão'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Condições médicas deve ser um array' })
  medicalConditions?: string[];
}
