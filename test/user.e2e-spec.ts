import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('User API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();

    // Create admin user
    const adminEmail = `admin_${Date.now()}@test.com`;
    const adminPassword = 'AdminPass123!';

    await request(app.getHttpServer()).post('/auth/register').send({
      email: adminEmail,
      password: adminPassword,
      name: 'Test Admin',
      role: 'ADMIN',
      phone: '11900000000',
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    adminToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users (Criar Usuário)', () => {
    it('deve criar um usuário válido', () => {
      const createUserDto = {
        email: `user_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User',
        role: 'PATIENT',
        phone: '11999999999',
      };

      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createUserDto)
        .expect(201)
        .then((res: any) => {
          expect(res.body).toHaveProperty('id');
        });
    });

    it('deve falhar com email inválido', () => {
      const createUserDto = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createUserDto)
        .expect(400);
    });
  });
});
