import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './users/user.module';
import { PatientProfileModule } from './patient-profile/patient-profile.module';
import { AuthModule } from './auth/auth.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { AuditModule } from './audit/audit.module';
import { CommonModule } from './common/common.module';
import { SECURITY_CONFIG } from './config/security.constants';
import { AuthFailureInterceptor } from './auth/interceptors/auth-failure.interceptor';
import { AuditService } from './audit/audit.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: SECURITY_CONFIG.RATE_LIMIT.AUTH_TTL,
        limit: SECURITY_CONFIG.RATE_LIMIT.AUTH_LIMIT,
      },
    ]),
    CommonModule,
    PrismaModule,
    AuditModule,
    AuthModule,
    UserModule,
    PatientProfileModule,
    MedicalRecordsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthFailureInterceptor,
    },
  ],
})
export class AppModule {}
