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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
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
  async findOne(@Param('id') id: string): Promise<any> {
    return this.userService.findOne(id);
  }

  @Get('email/:email')
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
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<any> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
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
  async remove(@Param('id') id: string): Promise<any> {
    return this.userService.remove(id);
  }
}
