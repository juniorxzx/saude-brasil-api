import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,

    MulterModule.register({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const uploadDir = path.join(
            process.cwd(),
            'uploads',
            'medical-records',
          );
          // Criar diretório se não existir
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          cb(null, uploadDir);
        },

        filename: (req: any, file: any, cb: any) => {
          // Gerar nome único com timestamp
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const ext = path.extname(file.originalname);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const name = path.basename(file.originalname, ext);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          cb(null, `${name}-${uniqueSuffix}${ext}`);
        },
      }),

      fileFilter: (req: any, file: any, cb: any) => {
        // Aceitar apenas PDF e imagens
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (allowedMimes.includes(file.mimetype)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          cb(null, true);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          cb(
            new Error('Apenas PDF, imagens e documentos Word são permitidos'),
            false,
          );
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  ],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
