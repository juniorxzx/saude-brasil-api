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
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<any> {
    return this.userService.create(createUserDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
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
  async findOne(@Param('id') id: string): Promise<any> {
    return this.userService.findOne(id);
  }

  @Get('email/:email')
  @HttpCode(HttpStatus.OK)
  async findByEmail(@Param('email') email: string): Promise<any> {
    return this.userService.findByEmail(email);
  }

  @Get('cpf/:cpf')
  @HttpCode(HttpStatus.OK)
  async findByCPF(@Param('cpf') cpf: string): Promise<any> {
    return this.userService.findByCPF(cpf);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<any> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<any> {
    return this.userService.remove(id);
  }
}
