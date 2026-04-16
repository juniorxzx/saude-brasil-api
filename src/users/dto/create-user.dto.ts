import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';
import { UserRoleDto } from './types';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email!: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  password!: string;

  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name!: string;

  @IsOptional()
  @IsEnum(UserRoleDto, { message: 'Papel de usuário inválido' })
  role?: UserRoleDto = UserRoleDto.PATIENT;

  @IsOptional()
  phone?: string;

  @IsOptional()
  CPF?: string;

  @IsOptional()
  avatar?: string;
}
