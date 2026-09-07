import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import type { PasswordHasher } from "../../application/ports/password-hasher.port";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Hashea contrasenas con `scrypt` de `node:crypto` (sin dependencias nuevas,
 * no hay acceso a npm en este entorno). Formato almacenado: `salt:key`, ambos
 * en hexadecimal.
 */
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const derivedKey = (await scrypt(plainPassword, salt, KEY_LENGTH)) as Buffer;

    return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
  }

  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    const [saltHex, keyHex] = passwordHash.split(":");

    if (!saltHex || !keyHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const storedKey = Buffer.from(keyHex, "hex");
    const derivedKey = (await scrypt(plainPassword, salt, storedKey.length)) as Buffer;

    if (derivedKey.length !== storedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, storedKey);
  }
}
