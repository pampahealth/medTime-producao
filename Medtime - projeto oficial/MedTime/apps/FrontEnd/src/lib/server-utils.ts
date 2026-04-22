// All the functions within this file will only be executed on the server side. Do not import this file when the web page is running
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function hashString(str: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(str, saltRounds);
}

export async function verifyHashString(
  str: string,
  hashedStr: string
): Promise<boolean> {
  return bcrypt.compare(str, hashedStr);
}

export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString("base64url");
}

export function pbkdf2Hash(text: string): string {
  const salt = process.env.HASH_SALT_KEY || "";
  return crypto.pbkdf2Sync(text, salt, 10000, 64, "sha256").toString("hex");
}

export function pbkdf2Verify(text: string, hash: string): boolean {
  const computedHash = pbkdf2Hash(text);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, "hex"),
    Buffer.from(hash, "hex")
  );
}

export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}
