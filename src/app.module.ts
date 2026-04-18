import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
  providers: [AppService],
})
export class AppModule {}
