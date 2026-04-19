import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('MedicalRecords (e2e) - Authentication & Authorization', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let doctorToken: string;
  let doctorId: string;

  let patientToken: string;
  let patientId: string;

  let recordId: string;

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

    // Setup: criar médico
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

    // Setup: criar paciente
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

    // Criar perfil de paciente
    await request(app.getHttpServer())
      .post('/patient-profile')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        bloodType: 'O+',
        allergies: [],
        medications: [],
        medicalConditions: [],
      });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /medical-records - Protected endpoint', () => {
    // T024: Sem token → 401
    it('should return 401 when accessing without token', () => {
      return request(app.getHttpServer())
        .get('/medical-records')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/medical-records')
        .set('Authorization', 'Bearer invalid_token')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return records for DOCTOR who created them', async () => {
      // Criar um record como médico
      const createRes = await request(app.getHttpServer())
        .post('/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          pacienteId: patientId,
          type: 'CONSULTATION',
          title: 'Checkup',
          description: 'Regular checkup',
          recordDate: new Date().toISOString(),
        })
        .expect(HttpStatus.CREATED);

      recordId = createRes.body.id;

      // Listar como médico
      return request(app.getHttpServer())
        .get('/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should return only patient own records when PATIENT', () => {
      return request(app.getHttpServer())
        .get('/medical-records')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // Paciente deve ver os records criados para ele
          if (res.body.length > 0) {
            res.body.forEach((record: any) => {
              expect(record.pacienteId).toBe(patientId);
            });
          }
        });
    });
  });

  describe('GET /medical-records/:id - Protected endpoint with owner check', () => {
    // T025: Token expirado → 401 (será testado com JWT mockado em production)
    it('should return 403 when DOCTOR tries to access record created by another doctor', async () => {
      // Criar outro médico
      const otherDoctorEmail = `doctor2_${Date.now()}@test.com`;
      const otherDoctorPassword = 'DoctorPass123!';
      const otherDoctorRegRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: otherDoctorEmail,
          password: otherDoctorPassword,
          name: 'Other Doctor',
          role: 'DOCTOR',
          CRM: `${Math.random().toString().slice(2, 8)}`,
          phone: '11977777777',
        });

      const otherDoctorLoginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: otherDoctorEmail, password: otherDoctorPassword });

      const otherDoctorToken = otherDoctorLoginRes.body.accessToken;

      // Tentar acessar record criado por outro médico
      return request(app.getHttpServer())
        .get(`/medical-records/${recordId}`)
        .set('Authorization', `Bearer ${otherDoctorToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 200 when PATIENT accesses own record', () => {
      return request(app.getHttpServer())
        .get(`/medical-records/${recordId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', recordId);
          expect(res.body).toHaveProperty('pacienteId', patientId);
        });
    });

    it('should return 200 when DOCTOR accesses own record', () => {
      return request(app.getHttpServer())
        .get(`/medical-records/${recordId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', recordId);
        });
    });
  });

  describe('POST /medical-records - Role-based access', () => {
    // T026: PATIENT tenta criar record → 403
    it('should return 403 when PATIENT tries to create medical record', () => {
      return request(app.getHttpServer())
        .post('/medical-records')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          pacienteId: patientId,
          type: 'CONSULTATION',
          title: 'Self Checkup',
          description: 'Self diagnosed',
          recordDate: new Date().toISOString(),
        })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should allow DOCTOR to create medical record', () => {
      return request(app.getHttpServer())
        .post('/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          pacienteId: patientId,
          type: 'CONSULTATION',
          title: 'Follow-up',
          description: 'Follow-up consultation',
          recordDate: new Date().toISOString(),
        })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('doctorId', doctorId);
          expect(res.body).toHaveProperty('pacienteId', patientId);
        });
    });
  });

  describe('PUT /medical-records/:id - Owner check', () => {
    // T027: DOCTOR tenta editar record de outro → 403
    it('should return 403 when DOCTOR tries to edit record created by another doctor', async () => {
      // Criar outro médico
      const otherDoctor2Email = `doctor3_${Date.now()}@test.com`;
      const otherDoctor2Password = 'DoctorPass123!';
      const otherDoctor2RegRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: otherDoctor2Email,
          password: otherDoctor2Password,
          name: 'Other Doctor 2',
          role: 'DOCTOR',
          CRM: `${Math.random().toString().slice(2, 8)}`,
          phone: '11966666666',
        });

      const otherDoctor2LoginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: otherDoctor2Email, password: otherDoctor2Password });

      const otherDoctor2Token = otherDoctor2LoginRes.body.accessToken;

      // Tentar editar
      return request(app.getHttpServer())
        .patch(`/medical-records/${recordId}`)
        .set('Authorization', `Bearer ${otherDoctor2Token}`)
        .send({
          title: 'Hacked Title',
          description: 'Hacked description',
        })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should allow DOCTOR to edit own record', () => {
      return request(app.getHttpServer())
        .patch(`/medical-records/${recordId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          title: 'Updated Checkup',
          description: 'Updated description',
        })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', 'Updated Checkup');
        });
    });

    it('should return 403 when PATIENT tries to edit record', () => {
      return request(app.getHttpServer())
        .patch(`/medical-records/${recordId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          title: 'Patient Hack',
        })
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('DELETE /medical-records/:id - Owner check', () => {
    it('should return 403 when trying to delete without permission', async () => {
      // Criar outro médico
      const otherDoctor3Email = `doctor4_${Date.now()}@test.com`;
      const otherDoctor3Password = 'DoctorPass123!';
      const otherDoctor3RegRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: otherDoctor3Email,
          password: otherDoctor3Password,
          name: 'Other Doctor 3',
          role: 'DOCTOR',
          CRM: `${Math.random().toString().slice(2, 8)}`,
          phone: '11955555555',
        });

      const otherDoctor3LoginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: otherDoctor3Email, password: otherDoctor3Password });

      const otherDoctor3Token = otherDoctor3LoginRes.body.accessToken;

      return request(app.getHttpServer())
        .delete(`/medical-records/${recordId}`)
        .set('Authorization', `Bearer ${otherDoctor3Token}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should allow DOCTOR to delete own record', () => {
      return request(app.getHttpServer())
        .delete(`/medical-records/${recordId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(HttpStatus.OK);
    });
  });
});
