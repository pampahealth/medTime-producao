"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileController = void 0;
const mobile_payload_1 = require("../../contracts/mobile.payload");
let ultimoPayloadMobile = null;
class MobileController {
    postReceitas(req, res) {
        const parsed = mobile_payload_1.mobilePayloadSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Payload invalido para envio ao app mobile",
                detalhes: parsed.error.issues,
            });
            return;
        }
        ultimoPayloadMobile = {
            origem: parsed.data.origem ?? "viewer_api_tripla",
            data_envio: parsed.data.data_envio?.trim() || new Date().toISOString(),
            dados: parsed.data.dados,
        };
        res.status(202).json({
            status: "recebido",
            destino: "app_mobile_pendente",
            recebido_em: new Date().toISOString(),
            possui_payload: true,
        });
    }
    getUltimo(_req, res) {
        if (!ultimoPayloadMobile) {
            res.status(404).json({ error: "Nenhum payload recebido para mobile ate o momento." });
            return;
        }
        res.status(200).json(ultimoPayloadMobile);
    }
    getUltimoPaciente(_req, res) {
        const dados = ultimoPayloadMobile?.dados;
        if (!Array.isArray(dados) || dados.length === 0) {
            res.status(404).json({ error: "Nenhum paciente disponivel no ultimo payload." });
            return;
        }
        const receita = dados[0];
        const nome = String(receita?.nome_paciente ?? "").trim();
        const cartao = String(receita?.cartao_sus ?? "").trim();
        if (!nome || !cartao) {
            res.status(404).json({ error: "Ultimo payload nao contem nome_paciente e cartao_sus validos." });
            return;
        }
        res.status(200).json({
            nome_paciente: nome,
            cartao_sus: cartao,
            data_envio: ultimoPayloadMobile?.data_envio ?? null,
        });
    }
}
exports.MobileController = MobileController;
