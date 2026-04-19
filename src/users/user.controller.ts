import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CurrentUser } from '../auth/interfaces/current-user.interface';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo usuário' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'O usuário foi criado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email ou CPF já estão em uso.',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<any> {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar usuários com paginação' })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: String,
    description: 'Número de registros para pular',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: String,
    description: 'Número de registros para retornar (máx 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de usuários retornada com sucesso.',
  })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<any> {
    const skipNum = skip ? parseInt(skip) : 0;
    const takeNum = take ? parseInt(take) : 10;

    if (skipNum < 0 || takeNum < 0) {
      throw new BadRequestException('skip e take devem ser maiores que 0');
    }

    if (takeNum > 100) {
      throw new BadRequestException('take não pode ser maior que 100');
    }

    return this.userService.findAll(skipNum, takeNum);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar um usuário pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário encontrado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sem permissão para visualizar este usuário.',
  })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: CurrentUser,
  ): Promise<any> {
    return this.userService.findOne(id, user.id, user.role);
  }

  @Get('email/:email')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar um usuário pelo Email' })
  @ApiParam({ name: 'email', description: 'Email do usuário' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário encontrado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado.',
  })
  async findByEmail(@Param('email') email: string): Promise<any> {
    return this.userService.findByEmail(email);
  }

  @Get('cpf/:cpf')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar um usuário pelo CPF' })
  @ApiParam({ name: 'cpf', description: 'CPF do usuário' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário encontrado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado.',
  })
  async findByCPF(@Param('cpf') cpf: string): Promise<any> {
    return this.userService.findByCPF(cpf);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar dados de um usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário atualizado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email ou CPF já estão em uso por outro usuário.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sem permissão para atualizar este usuário.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: CurrentUser,
  ): Promise<any> {
    return this.userService.update(id, updateUserDto, user.id, user.role);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover um usuário do sistema' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário removido com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sem permissão para deletar este usuário.',
  })
  async remove(
    @Param('id') id: string,
    @GetUser() user: CurrentUser,
  ): Promise<any> {
    return this.userService.remove(id, user.id, user.role);
  }
}
