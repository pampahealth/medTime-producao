"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceitasRepository = void 0;
const supabase_js_1 = require("../config/supabase.js");
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
      )
    )
  `;
    async carregarReceitasPaginadas(montarQuery) {
        const todas = [];
        let from = 0;
        while (true) {
            const to = from + this.pageSize - 1;
            const { data, error } = await montarQuery(from, to);
            if (error) {
                throw new Error(`Erro ao paginar receitas: ${error.message}`);
            }
            const chunk = (data ?? []);
            todas.push(...chunk);
            if (chunk.length < this.pageSize) {
                break;
            }
            from += this.pageSize;
        }
        return todas;
    }
    async buscarPorData(dataReceita) {
        return this.carregarReceitasPaginadas(async (from, to) => supabase_js_1.supabase
            .schema(supabase_js_1.SCHEMA)
            .from("a005_receitas")
            .select(this.baseSelect)
            .eq("a005_data_receita", dataReceita)
            .order("a005_data_receita", { ascending: true })
            .range(from, to));
    }
    async buscarPorIntervaloData(dataInicial, dataFinal) {
        return this.carregarReceitasPaginadas(async (from, to) => supabase_js_1.supabase
            .schema(supabase_js_1.SCHEMA)
            .from("a005_receitas")
            .select(this.baseSelect)
            .gte("a005_data_receita", dataInicial)
            .lte("a005_data_receita", dataFinal)
            .order("a005_data_receita", { ascending: true })
            .range(from, to));
    }
    async buscarTodasComData() {
        return this.carregarReceitasPaginadas(async (from, to) => supabase_js_1.supabase
            .schema(supabase_js_1.SCHEMA)
            .from("a005_receitas")
            .select(this.baseSelect)
            .not("a005_data_receita", "is", null)
            .order("a005_data_receita", { ascending: true })
            .range(from, to));
    }
    async buscarTodasReceitas() {
        return this.carregarReceitasPaginadas(async (from, to) => supabase_js_1.supabase
            .schema(supabase_js_1.SCHEMA)
            .from("a005_receitas")
            .select(this.baseSelect)
            .order("a005_data_receita", { ascending: true })
            .range(from, to));
    }
    async buscarPorNomePaciente(nomePaciente) {
        return this.carregarReceitasPaginadas(async (from, to) => supabase_js_1.supabase
            .schema(supabase_js_1.SCHEMA)
            .from("a005_receitas")
            .select(this.baseSelect)
            .ilike("a004_pacientes.a004_nome", `%${nomePaciente}%`)
            .order("a005_data_receita", { ascending: true })
            .range(from, to));
    }
    async buscarPorCartaoSus(cartaoSus) {
        const { data: pacientes, error: pacientesError } = await supabase_js_1.supabase
            .schema(supabase_js_1.SCHEMA)
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
        if (ids.length === 0) {
            return [];
        }
        return this.carregarReceitasPaginadas(async (from, to) => supabase_js_1.supabase
            .schema(supabase_js_1.SCHEMA)
            .from("a005_receitas")
            .select(this.baseSelect)
            .in("a005_id_paciente", ids)
            .order("a005_data_receita", { ascending: true })
            .range(from, to));
    }
}
exports.ReceitasRepository = ReceitasRepository;
