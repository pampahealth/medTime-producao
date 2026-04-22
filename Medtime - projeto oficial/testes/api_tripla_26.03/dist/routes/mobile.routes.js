"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mobileRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.mobileRoutes = router;
const payloadSchema = zod_1.z.object({
    origem: zod_1.z.literal("viewer_api_tripla").optional(),
    data_envio: zod_1.z.string().optional(),
    dados: zod_1.z.unknown()
});
router.post("/mobile/receitas", (req, res) => {
    const parsed = payloadSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            error: "Payload invalido para envio ao app mobile",
            detalhes: parsed.error.issues
        });
        return;
    }
    res.status(202).json({
        status: "recebido",
        destino: "app_mobile_pendente",
        recebido_em: new Date().toISOString()
    });
});
