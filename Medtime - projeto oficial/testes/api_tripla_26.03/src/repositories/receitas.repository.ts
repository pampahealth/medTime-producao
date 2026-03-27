import { SCHEMA, supabase } from "../config/supabase.js";

type ReceitaRaw = {
  a005_id_receita: string;
  a005_data_receita: string | null;
  a005_id_paciente?: string;
  a004_pacientes:
    | {
        a004_id_paciente?: string;
        a004_cartao_sus: string;
        a004_nome: string;
      }
    | Array<{
        a004_id_paciente?: string;
        a004_cartao_sus: string;
        a004_nome: string;
      }>;
  a006_receita_medicamentos: Array<{
    a003_medicamentos:
      | {
          a003_nome: string;
          a003_imagem_base64: string;
        }
      | Array<{
          a003_nome: string;
          a003_imagem_base64: string;
        }>;
  }>;
};

export class ReceitasRepository {
  private readonly pageSize = 1000;

  private baseSelect = `
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

  private async carregarReceitasPaginadas(
    montarQuery: (
      from: number,
      to: number
    ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>
  ): Promise<ReceitaRaw[]> {
    const todas: ReceitaRaw[] = [];
    let from = 0;

    while (true) {
      const to = from + this.pageSize - 1;
      const { data, error } = await montarQuery(from, to);
      if (error) {
        throw new Error(`Erro ao paginar receitas: ${error.message}`);
      }

      const chunk = (data ?? []) as unknown as ReceitaRaw[];
      todas.push(...chunk);

      if (chunk.length < this.pageSize) {
        break;
      }
      from += this.pageSize;
    }

    return todas;
  }

  async buscarPorData(dataReceita: string): Promise<ReceitaRaw[]> {
    return this.carregarReceitasPaginadas(async (from, to) =>
      supabase
        .schema(SCHEMA)
        .from("a005_receitas")
        .select(this.baseSelect)
        .eq("a005_data_receita", dataReceita)
        .order("a005_data_receita", { ascending: true })
        .range(from, to)
    );
  }

  async buscarPorIntervaloData(dataInicial: string, dataFinal: string): Promise<ReceitaRaw[]> {
    return this.carregarReceitasPaginadas(async (from, to) =>
      supabase
        .schema(SCHEMA)
        .from("a005_receitas")
        .select(this.baseSelect)
        .gte("a005_data_receita", dataInicial)
        .lte("a005_data_receita", dataFinal)
        .order("a005_data_receita", { ascending: true })
        .range(from, to)
    );
  }

  async buscarTodasComData(): Promise<ReceitaRaw[]> {
    return this.carregarReceitasPaginadas(async (from, to) =>
      supabase
        .schema(SCHEMA)
        .from("a005_receitas")
        .select(this.baseSelect)
        .not("a005_data_receita", "is", null)
        .order("a005_data_receita", { ascending: true })
        .range(from, to)
    );
  }

  async buscarTodasReceitas(): Promise<ReceitaRaw[]> {
    return this.carregarReceitasPaginadas(async (from, to) =>
      supabase
        .schema(SCHEMA)
        .from("a005_receitas")
        .select(this.baseSelect)
        .order("a005_data_receita", { ascending: true })
        .range(from, to)
    );
  }

  async buscarPorNomePaciente(nomePaciente: string): Promise<ReceitaRaw[]> {
    return this.carregarReceitasPaginadas(async (from, to) =>
      supabase
        .schema(SCHEMA)
        .from("a005_receitas")
        .select(this.baseSelect)
        .ilike("a004_pacientes.a004_nome", `%${nomePaciente}%`)
        .order("a005_data_receita", { ascending: true })
        .range(from, to)
    );
  }

  async buscarPorCartaoSus(cartaoSus: string): Promise<ReceitaRaw[]> {
    const { data: pacientes, error: pacientesError } = await supabase
      .schema(SCHEMA)
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

    return this.carregarReceitasPaginadas(async (from, to) =>
      supabase
        .schema(SCHEMA)
        .from("a005_receitas")
        .select(this.baseSelect)
        .in("a005_id_paciente", ids)
        .order("a005_data_receita", { ascending: true })
        .range(from, to)
    );
  }
}
