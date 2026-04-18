import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { SECURITY_CONFIG } from '../../config/security.constants';

@Injectable()
export class EncryptionService {
  private readonly algorithm = SECURITY_CONFIG.ENCRYPTION.ALGORITHM;
  private readonly key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    this.key = Buffer.from(encryptionKey, 'hex');
    if (this.key.length !== SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH) {
      throw new Error(
        `ENCRYPTION_KEY must be ${SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH} bytes (${SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH * 2} hex characters)`,
      );
    }
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(SECURITY_CONFIG.ENCRYPTION.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  verifyHash(data: string, hash: string): boolean {
    return this.hash(data) === hash;
  }
}
