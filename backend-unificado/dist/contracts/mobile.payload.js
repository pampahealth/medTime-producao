"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mobilePayloadSchema = void 0;
const zod_1 = require("zod");
exports.mobilePayloadSchema = zod_1.z.object({
    origem: zod_1.z.string().optional(),
    data_envio: zod_1.z.string().optional(),
    dados: zod_1.z.unknown(),
});
