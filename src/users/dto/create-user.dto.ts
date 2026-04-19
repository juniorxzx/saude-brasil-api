import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRoleDto } from './types';

export class CreateUserDto {
  @ApiProperty({
    description: 'O endereço de email do usuário',
    example: 'usuario@exemplo.com.br',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email!: string;

  @ApiProperty({
    description: 'Senha forte do usuário',
    minLength: 8,
    example: 'senhaSecret#123',
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  password!: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João da Silva',
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name!: string;

  @ApiPropertyOptional({
    enum: UserRoleDto,
    description: 'Papel/nível de acesso do usuário no sistema',
    default: UserRoleDto.PATIENT,
  })
  @IsOptional()
  @IsEnum(UserRoleDto, { message: 'Papel de usuário inválido' })
  role?: UserRoleDto = UserRoleDto.PATIENT;

  @ApiPropertyOptional({
    description: 'Telefone de contato do usuário',
    example: '+5511999999999',
  })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'CPF do usuário',
    example: '123.456.789-00',
  })
  @IsOptional()
  CPF?: string;

  @ApiPropertyOptional({
    description: 'URL da imagem de perfil (avatar) do usuário',
    example: 'https://exemplo.com/avatar.jpg',
  })
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'CNPJ da clínica (obrigatório se role = CLINIC_MANAGER)',
    example: '12.345.678/0001-90',
  })
  @IsOptional()
  CNPJ?: string;

  @ApiPropertyOptional({
    description: 'CRM do médico (obrigatório se role = DOCTOR)',
    example: '123456/SP',
  })
  @IsOptional()
  CRM?: string;

  @ApiPropertyOptional({
    enum: ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'INACTIVE'],
    description: 'Status do usuário no sistema',
    default: 'PENDING_VERIFICATION',
  })
  @IsOptional()
  @IsEnum(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'INACTIVE'])
  status?: string;

  @ApiPropertyOptional({
    description: 'COREN do enfermeiro/técnico (obrigatório se aplicável)',
    example: '123456/SP',
  })
  @IsOptional()
  COREN?: string;
}
