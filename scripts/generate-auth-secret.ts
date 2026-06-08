import { randomBytes } from "node:crypto";

const secret = randomBytes(32).toString("base64url");

console.log("Adicione ao .env.local:\n");
console.log(`AUTH_SECRET=${secret}`);
