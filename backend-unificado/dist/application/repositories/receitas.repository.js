"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceitasRepository = void 0;
const supabase_1 = require("../../infra/db/supabase");
class ReceitasRepository {
    pageSize = 1000;
    baseSelect = `
    a005_id_receita,
    a005_data_receita,
    a005_id_paciente,
    a004_pacientes!inner(
      a004_id_paciente,
      a004_cartao_sus,
      a004_nome
    ),
    a006_receita_medicamentos(
      a003_medicamentos!inner(
        a003_nome,
        a003_imagem_base64
      ),
      a007_receita_horarios(
        a007_data_hora_disparo
      )
    )
  `;
    async loadPaged(queryFactory) {
        const result = [];
        let from = 0;
        while (true) {
            const to = from + this.pageSize - 1;
            const { data, error } = await queryFactory(from, to);
            if (error)
                throw new Error(`Erro ao paginar receitas: ${error.message}`);
            const chunk = data ?? [];
            result.push(...chunk);
            if (chunk.length < this.pageSize)
                break;
            from += this.pageSize;
        }
        return result;
    }
    buscarPorData(dataReceita) {
        return this.loadPaged(async (from, to) => (await supabase_1.supabase
            .schema(supabase_1.SUPABASE_SCHEMA)
            .from("a005_receitas")
            .select(this.baseSelect)
            .eq("a005_data_receita", dataReceita)
            .order("a005_data_receita", { ascending: true })
            .range(from, to)));
    }
    buscarPorIntervaloData(dataInicio, dataFim) {
        return this.loadPaged(async (from, to) => (await supabase_1.supabase
            .schema(supabase_1.SUPABASE_SCHEMA)
            .from("a005_receitas")
            .select(this.baseSelect)
            .gte("a005_data_receita", dataInicio)
            .lte("a005_data_receita", dataFim)
            .order("a005_data_receita", { ascending: true })
            .range(from, to)));
    }
    buscarPorNomePaciente(nomePaciente) {
        return this.loadPaged(async (from, to) => (await supabase_1.supabase
            .schema(supabase_1.SUPABASE_SCHEMA)
            .from("a005_receitas")
            .select(this.baseSelect)
            .ilike("a004_pacientes.a004_nome", `%${nomePaciente}%`)
            .order("a005_data_receita", { ascending: true })
            .range(from, to)));
    }
    async buscarPorCartaoSus(cartaoSus) {
        const { data: pacientes, error: pacientesError } = await supabase_1.supabase
            .schema(supabase_1.SUPABASE_SCHEMA)
            .from("a004_pacientes")
            .select("a004_id_paciente, a004_cartao_sus")
            .eq("a004_ativo", true);
        if (pacientesError) {
            throw new Error(`Erro ao buscar pacientes por cartao SUS: ${pacientesError.message}`);
        }
        const ids = (pacientes ?? [])
            .filter((p) => String(p.a004_cartao_sus ?? "").replace(/\D/g, "") === cartaoSus.replace(/\D/g, ""))
            .map((p) => p.a004_id_paciente)
            .filter(Boolean);
        if (ids.length === 0)
            return [];
        return this.loadPaged(async (from, to) => (await supabase_1.supabase
            .schema(supabase_1.SUPABASE_SCHEMA)
            .from("a005_receitas")
            .select(this.baseSelect)
            .in("a005_id_paciente", ids)
            .order("a005_data_receita", { ascending: true })
            .range(from, to)));
    }
    async buscarRecentes(limite = 200) {
        const safeLimit = Math.max(1, Math.min(1000, Number(limite) || 200));
        const { data, error } = await supabase_1.supabase
            .schema(supabase_1.SUPABASE_SCHEMA)
            .from("a005_receitas")
            .select(this.baseSelect)
            .order("a005_data_receita", { ascending: false })
            .limit(safeLimit);
        if (error)
            throw new Error(`Erro ao buscar receitas recentes: ${error.message}`);
        return data ?? [];
    }
}
exports.ReceitasRepository = ReceitasRepository;
