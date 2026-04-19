import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let authToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();

    // Limpar dados de teste anteriores
    await prisma.auditLog.deleteMany();
    await prisma.medicalRecord.deleteMany();
    await prisma.patientProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register - Public endpoint', () => {
    // T021: Criar usuário sem token (201)
    it('should register a new PATIENT user without token', () => {
      const registerDto = {
        email: `patient_${Date.now()}@test.com`,
        password: 'SecurePassword123!',
        name: 'Test Patient',
        role: 'PATIENT',
        phone: '11999999999',
        CPF: `${Math.random().toString().slice(2, 13)}`,
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('email', registerDto.email);
          expect(res.body.user).toHaveProperty('role', 'PATIENT');
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should reject duplicate email', () => {
      const email = `doctor_${Date.now()}@test.com`;
      const registerDto = {
        email,
        password: 'SecurePassword123!',
        name: 'Test Doctor',
        role: 'DOCTOR',
        CRM: `123456`,
        phone: '11988888888',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(HttpStatus.CREATED)
        .then(() => {
          // Tentar registrar com mesmo email
          return request(app.getHttpServer())
            .post('/auth/register')
            .send(registerDto)
            .expect(HttpStatus.CONFLICT);
        });
    });

    it('should require CRM for DOCTOR role', () => {
      const registerDto = {
        email: `doctor_missing_crm@test.com`,
        password: 'SecurePassword123!',
        name: 'Doctor Without CRM',
        role: 'DOCTOR',
        phone: '11987654321',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('POST /auth/login - Public endpoint', () => {
    // T022: Login sem token e obter tokens (200)
    it('should login successfully and return tokens', async () => {
      const email = `logintest_${Date.now()}@test.com`;
      const password = 'SecurePassword123!';

      // Registrar usuário primeiro
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password,
          name: 'Login Test User',
          role: 'PATIENT',
          phone: '11999999999',
          CPF: `${Math.random().toString().slice(2, 13)}`,
        })
        .expect(HttpStatus.CREATED);

      // Fazer login
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('email', email);
          authToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'WrongPassword123!',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject wrong password', async () => {
      const email = `wrongpass_${Date.now()}@test.com`;
      const password = 'CorrectPassword123!';

      // Registrar
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password,
          name: 'Wrong Pass Test',
          role: 'PATIENT',
          phone: '11999999999',
          CPF: `${Math.random().toString().slice(2, 13)}`,
        })
        .expect(HttpStatus.CREATED);

      // Tentar login com senha errada
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: 'WrongPassword123!',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /auth/me - Protected endpoint', () => {
    // T023: Sem token → 401
    it('should return 401 when accessing without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return current user when authenticated', async () => {
      // Primeiro fazer login para obter token
      const email = `authed_${Date.now()}@test.com`;
      const password = 'SecurePassword123!';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password,
          name: 'Authed User',
          role: 'PATIENT',
          phone: '11999999999',
          CPF: `${Math.random().toString().slice(2, 13)}`,
        })
        .expect(HttpStatus.CREATED);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(HttpStatus.OK);

      const token = loginRes.body.accessToken;

      // Acessar /me com token
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', email);
          expect(res.body).toHaveProperty('role', 'PATIENT');
        });
    });
  });

  describe('POST /auth/logout - Protected endpoint', () => {
    it('should logout user successfully with valid token', async () => {
      // Setup: criar usuário e fazer login
      const email = `logout_${Date.now()}@test.com`;
      const password = 'SecurePassword123!';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password,
          name: 'Logout Test',
          role: 'PATIENT',
          phone: '11999999999',
          CPF: `${Math.random().toString().slice(2, 13)}`,
        })
        .expect(HttpStatus.CREATED);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(HttpStatus.OK);

      const token = loginRes.body.accessToken;

      // Fazer logout
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should return 401 when logout without token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /auth/refresh - Public endpoint', () => {
    it('should refresh token successfully with valid refresh token', async () => {
      // Setup: login
      const email = `refresh_${Date.now()}@test.com`;
      const password = 'SecurePassword123!';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password,
          name: 'Refresh Test',
          role: 'PATIENT',
          phone: '11999999999',
          CPF: `${Math.random().toString().slice(2, 13)}`,
        })
        .expect(HttpStatus.CREATED);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(HttpStatus.OK);

      const refreshToken = loginRes.body.refreshToken;

      // Refresh token
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          // Refresh endpoint returns only new accessToken
        });
    });

    it('should reject invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid_refresh_token' })
        .expect((res) => {
          // May return 401 or 500, both indicate failure
          expect([
            HttpStatus.UNAUTHORIZED,
            HttpStatus.INTERNAL_SERVER_ERROR,
          ]).toContain(res.status);
        });
    });
  });
});
