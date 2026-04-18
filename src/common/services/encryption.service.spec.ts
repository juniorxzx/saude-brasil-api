import { EncryptionService } from './encryption.service';
import { SECURITY_CONFIG } from '../../config/security.constants';

describe('EncryptionService', () => {
  let service: EncryptionService;

  const generateValidKey = () => {
    return 'a'.repeat(SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH * 2);
  };

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = generateValidKey();
    service = new EncryptionService();
  });

  describe('constructor', () => {
    it('should throw error if ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => new EncryptionService()).toThrow(
        'ENCRYPTION_KEY environment variable is required',
      );
    });

    it('should throw error if ENCRYPTION_KEY has invalid length', () => {
      process.env.ENCRYPTION_KEY = 'invalid-length';
      expect(() => new EncryptionService()).toThrow(
        `ENCRYPTION_KEY must be ${SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH} bytes`,
      );
    });
  });

  describe('encrypt', () => {
    it('should encrypt a string and return encrypted result', () => {
      const plaintext = 'Hello, World!';
      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toContain(':');
    });

    it('should return different ciphertext for the same plaintext (due to random IV)', () => {
      const plaintext = 'Hello, World!';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty string', () => {
      const encrypted = service.encrypt('');
      expect(encrypted).toBeDefined();
    });

    it('should handle special characters', () => {
      const plaintext = 'Special chars: @#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = service.encrypt(plaintext);
      expect(encrypted).toBeDefined();
    });

    it('should handle unicode characters', () => {
      const plaintext = 'Unicode: 你好世界 🎉 émoji';
      const encrypted = service.encrypt(plaintext);
      expect(encrypted).toBeDefined();
    });

    it('should handle long text', () => {
      const plaintext = 'A'.repeat(10000);
      const encrypted = service.encrypt(plaintext);
      expect(encrypted).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('should correctly decrypt encrypted text', () => {
      const plaintext = 'Hello, World!';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = 'Special chars: @#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'Unicode: 你好世界 🎉 émoji';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string', () => {
      const encrypted = service.encrypt('');
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should throw error for invalid encrypted text', () => {
      expect(() => service.decrypt('invalid')).toThrow();
    });
  });

  describe('hash', () => {
    it('should return a hash of the input data', () => {
      const data = 'test-data';
      const hash = service.hash(data);

      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64);
    });

    it('should return consistent hash for same input', () => {
      const data = 'test-data';
      const hash1 = service.hash(data);
      const hash2 = service.hash(data);

      expect(hash1).toBe(hash2);
    });

    it('should return different hash for different input', () => {
      const hash1 = service.hash('data1');
      const hash2 = service.hash('data2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyHash', () => {
    it('should return true for matching hash', () => {
      const data = 'test-data';
      const hash = service.hash(data);

      expect(service.verifyHash(data, hash)).toBe(true);
    });

    it('should return false for non-matching hash', () => {
      const data = 'test-data';
      const wrongHash = service.hash('different-data');

      expect(service.verifyHash(data, wrongHash)).toBe(false);
    });
  });

  describe('encryption/decryption roundtrip', () => {
    it('should correctly encrypt and decrypt various data types', () => {
      const testCases = [
        'simple text',
        'number 12345',
        'email@test.com',
        'cpf: 123.456.789-00',
        'medical record content',
        '{"key": "value", "nested": {"a": 1}}',
      ];

      testCases.forEach((testCase) => {
        const encrypted = service.encrypt(testCase);
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(testCase);
      });
    });
  });
});
