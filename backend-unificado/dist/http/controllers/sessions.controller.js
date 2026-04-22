"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsController = void 0;
const zod_1 = require("zod");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
class SessionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async login(req, res) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Payload invalido" });
            return;
        }
        try {
            const result = await this.service.login(parsed.data.email, parsed.data.password);
            res.status(200).json(result);
        }
        catch {
            res.status(401).json({ error: "Credenciais invalidas" });
        }
    }
}
exports.SessionsController = SessionsController;
