import { Module } from '@nestjs/common';
import { PatientProfileService } from './patient-profile.service';
import { PatientProfileController } from './patient-profile.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PatientProfileController],
  providers: [PatientProfileService],
})
export class PatientProfileModule {}
