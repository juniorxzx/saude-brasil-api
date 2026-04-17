import { ApiProperty } from '@nestjs/swagger';
import { AttachmentType } from '@prisma/client';

export class MedicalAttachmentDto {
  @ApiProperty({
    description: 'ID do attachment',
    example: 'clj789abc123',
  })
  id: string;

  @ApiProperty({
    description: 'ID do registro médico associado',
    example: 'clj456xyz789',
  })
  recordId: string;

  @ApiProperty({
    description: 'Nome do arquivo',
    example: 'tomografia_toracica.pdf',
  })
  fileName: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 2048576,
  })
  fileSize: number;

  @ApiProperty({
    description: 'Caminho do arquivo no servidor',
    example: '/uploads/medical-records/abc123xyz789.pdf',
  })
  filePath: string;

  @ApiProperty({
    description: 'Tipo de arquivo',
    enum: AttachmentType,
    example: 'PDF',
  })
  fileType: AttachmentType;

  @ApiProperty({
    description: 'MIME type do arquivo',
    example: 'application/pdf',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Data do upload',
    example: '2025-04-16T10:30:00Z',
  })
  uploadedAt: Date;
}
