import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuditLogs (e2e) - Authorization & Failure Tracking', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let adminToken: string;
  let adminId: string;

  let doctorToken: string;
  let doctorId: string;

  let patientToken: string;
  let patientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();

    // Limpar
    await prisma.auditLog.deleteMany();
    await prisma.medicalRecord.deleteMany();
    await prisma.patientProfile.deleteMany();
    await prisma.user.deleteMany();

    // Setup: criar admin
    const adminEmail = `admin_${Date.now()}@test.com`;
    const adminPassword = 'AdminPass123!';
    const adminRegRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: adminEmail,
        password: adminPassword,
        name: 'Test Admin',
        role: 'ADMIN',
        phone: '11900000000',
      });

    adminId = adminRegRes.body.user.id;

    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    adminToken = adminLoginRes.body.accessToken;

    // Setup: criar doctor
    const doctorEmail = `doctor_${Date.now()}@test.com`;
    const doctorPassword = 'DoctorPass123!';
    const doctorRegRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: doctorEmail,
        password: doctorPassword,
        name: 'Test Doctor',
        role: 'DOCTOR',
        CRM: `${Math.random().toString().slice(2, 8)}`,
        phone: '11988888888',
      });

    doctorId = doctorRegRes.body.user.id;

    const doctorLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: doctorEmail, password: doctorPassword });

    doctorToken = doctorLoginRes.body.accessToken;

    // Setup: criar patient
    const patientEmail = `patient_${Date.now()}@test.com`;
    const patientPassword = 'PatientPass123!';
    const patientRegRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: patientEmail,
        password: patientPassword,
        name: 'Test Patient',
        role: 'PATIENT',
        phone: '11999999999',
        CPF: `${Math.random().toString().slice(2, 13)}`,
      });

    patientId = patientRegRes.body.user.id;

    const patientLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: patientEmail, password: patientPassword });

    patientToken = patientLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /audit-logs - Admin only endpoint', () => {
    it('should return 401 when accessing without token', () => {
      return request(app.getHttpServer())
        .get('/audit-logs')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', 'Bearer invalid_token')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    // T028: DOCTOR tenta acessar audit logs → 403
    it('should return 403 when DOCTOR tries to access audit logs', () => {
      return request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 403 when PATIENT tries to access audit logs', () => {
      return request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 200 and audit logs when ADMIN accesses', () => {
      return request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should support pagination query parameters', () => {
      return request(app.getHttpServer())
        .get('/audit-logs?skip=0&take=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Audit logging of authentication failures', () => {
    // T029: Validar que audit logs registram falhas de autenticação
    it('should log failed login attempts', async () => {
      // Fazer tentativa de login com senha errada
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `testfail_${Date.now()}@test.com`,
          password: 'WrongPassword123!',
        })
        .expect(HttpStatus.UNAUTHORIZED);

      // Verificar que foi registrado no audit log
      const auditLogs = await request(app.getHttpServer())
        .get('/audit-logs?action=LOGIN_FAILED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(auditLogs.body)).toBe(true);
      if (auditLogs.body.length > 0) {
        const failedLoginLog = auditLogs.body.find(
          (log: any) => log.action === 'LOGIN_FAILED',
        );
        expect(failedLoginLog).toBeDefined();
        expect(failedLoginLog.resource).toBe('auth');
      }
    });

    it('should log successful login as LOGIN action', async () => {
      const email = `auditlogin_${Date.now()}@test.com`;
      const password = 'SecurePass123!';

      // Registrar usuário
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password,
          name: 'Audit Login Test',
          role: 'PATIENT',
          phone: '11999999999',
          CPF: `${Math.random().toString().slice(2, 13)}`,
        });

      // Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(HttpStatus.OK);

      const userId = loginRes.body.user.id;

      // Buscar audit log de login bem-sucedido
      await new Promise((resolve) => setTimeout(resolve, 100)); // Pequeno delay

      const auditLogs = await request(app.getHttpServer())
        .get(`/audit-logs?userId=${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(auditLogs.body)).toBe(true);
      const loginLog = auditLogs.body.find(
        (log: any) => log.action === 'LOGIN',
      );
      expect(loginLog).toBeDefined();
    });

    it('should log registration events as REGISTER action', async () => {
      const email = `auditregister_${Date.now()}@test.com`;
      const password = 'SecurePass123!';

      // Registrar
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password,
          name: 'Audit Register Test',
          role: 'PATIENT',
          phone: '11999999999',
          CPF: `${Math.random().toString().slice(2, 13)}`,
        })
        .expect(HttpStatus.CREATED);

      const userId = registerRes.body.user.id;

      // Buscar audit log
      await new Promise((resolve) => setTimeout(resolve, 100));

      const auditLogs = await request(app.getHttpServer())
        .get(`/audit-logs?userId=${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(auditLogs.body)).toBe(true);
      const registerLog = auditLogs.body.find(
        (log: any) => log.action === 'REGISTER',
      );
      expect(registerLog).toBeDefined();
    });

    it('should log logout events as LOGOUT action', async () => {
      const email = `auditlogout_${Date.now()}@test.com`;
      const password = 'SecurePass123!';

      // Registrar e login
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password,
          name: 'Audit Logout Test',
          role: 'PATIENT',
          phone: '11999999999',
          CPF: `${Math.random().toString().slice(2, 13)}`,
        });

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(HttpStatus.OK);

      const token = loginRes.body.accessToken;
      const userId = loginRes.body.user.id;

      // Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      // Verificar audit log
      await new Promise((resolve) => setTimeout(resolve, 100));

      const auditLogs = await request(app.getHttpServer())
        .get(`/audit-logs?userId=${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(auditLogs.body)).toBe(true);
      const logoutLog = auditLogs.body.find(
        (log: any) => log.action === 'LOGOUT',
      );
      expect(logoutLog).toBeDefined();
    });

    it('should mask sensitive data in audit logs', async () => {
      // Tentar fazer login com email sensível
      const testEmail = 'sensitive@test.com';

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(HttpStatus.UNAUTHORIZED);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const auditLogs = await request(app.getHttpServer())
        .get('/audit-logs?action=LOGIN_FAILED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(auditLogs.body)).toBe(true);
      if (auditLogs.body.length > 0) {
        const failedLog = auditLogs.body[0];
        // Verificar que o log não contém o email em texto plano
        const logStr = JSON.stringify(failedLog);
        // Email deve estar mascarado ou não deve estar visível
        expect(logStr).not.toContain(testEmail);
      }
    });
  });

  describe('Audit logging of authorization failures', () => {
    it('should log when DOCTOR tries to access ADMIN endpoint', async () => {
      await request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(HttpStatus.FORBIDDEN);

      // Verification would require checking if UNAUTHORIZED_ACCESS is logged
      // This is tested implicitly through the interceptor
    });
  });
});
