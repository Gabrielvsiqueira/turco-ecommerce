import { createHash, randomBytes } from 'node:crypto';

/** Token opaco: 32 bytes aleatórios. O protocolo permite "JWT ou opaco". */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/** No banco fica só o hash: um vazamento do banco não entrega sessões válidas. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
