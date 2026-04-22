"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicamentosRepository = void 0;
const supabase_1 = require("../../infra/db/supabase");
class MedicamentosRepository {
    async listarAtivos(limit = 500) {
        const safeLimit = Math.max(1, Math.min(2000, limit));
        const { data, error } = await supabase_1.supabase
            .schema(supabase_1.SUPABASE_SCHEMA)
            .from("a003_medicamentos")
            .select("a003_id_medicamento,a003_nome,a003_imagem_base64,a003_ativo")
            .eq("a003_ativo", true)
            .order("a003_nome", { ascending: true })
            .limit(safeLimit);
        if (error)
            throw new Error(`Erro ao listar medicamentos: ${error.message}`);
        return (data ?? []).map((m) => ({
            id: String(m.a003_id_medicamento),
            nome: String(m.a003_nome ?? ""),
            imagem_base64: m.a003_imagem_base64 ? String(m.a003_imagem_base64) : null,
            ativo: Boolean(m.a003_ativo),
        }));
    }
}
exports.MedicamentosRepository = MedicamentosRepository;
