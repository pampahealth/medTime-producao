"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacientesRepository = void 0;
const supabase_1 = require("../../infra/db/supabase");
class PacientesRepository {
    async listarAtivos(limit = 500) {
        const safeLimit = Math.max(1, Math.min(2000, limit));
        const { data, error } = await supabase_1.supabase
            .schema(supabase_1.SUPABASE_SCHEMA)
            .from("a004_pacientes")
            .select("a004_id_paciente,a004_cartao_sus,a004_nome,a004_celular,a004_data_nascimento")
            .eq("a004_ativo", true)
            .order("a004_nome", { ascending: true })
            .limit(safeLimit);
        if (error)
            throw new Error(`Erro ao listar pacientes: ${error.message}`);
        return (data ?? []).map((p) => ({
            id: String(p.a004_id_paciente),
            cartao_sus: String(p.a004_cartao_sus ?? ""),
            nome: String(p.a004_nome ?? ""),
            celular: p.a004_celular ? String(p.a004_celular) : null,
            data_nascimento: p.a004_data_nascimento ? String(p.a004_data_nascimento) : null,
        }));
    }
}
exports.PacientesRepository = PacientesRepository;
