"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
if (!process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_KEY) {
    process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_KEY;
}
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().int().min(1).max(65535).default(3010),
    SUPABASE_URL: zod_1.z.string().url(),
    SUPABASE_ANON_KEY: zod_1.z.string().min(1),
    SUPABASE_SCHEMA: zod_1.z.string().min(1).default("medtime"),
    JWT_SECRET: zod_1.z.string().min(12),
    JWT_EXPIRES_IN: zod_1.z.string().default("1d"),
    AUTH_REQUIRED: zod_1.z
        .string()
        .optional()
        .transform((v) => String(v ?? "false").toLowerCase() === "true"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Variaveis de ambiente invalidas: ${details}`);
}
exports.env = parsed.data;
