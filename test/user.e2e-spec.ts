import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('User API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users (Criar Usuário)', () => {
    it('deve criar um usuário válido', () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'PATIENT',
        phone: '11999999999',
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201)
        .then((res: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          expect(res.body).toHaveProperty('id');
        });
    });

    it('deve falhar com email inválido', () => {
      const createUserDto = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(400);
    });
  });
});
