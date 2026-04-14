import { randomBytes } from "node:crypto";

export function newSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}
