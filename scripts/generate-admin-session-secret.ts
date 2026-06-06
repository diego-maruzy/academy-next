import { randomBytes } from "node:crypto";

const secret = randomBytes(48).toString("base64");

console.log(`Adicione ao .env.local:

ADMIN_SESSION_SECRET=${secret}

Depois reinicie o servidor: npm run dev`);
