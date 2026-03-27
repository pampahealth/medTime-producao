import { ReceitasRepository } from "../repositories/receitas.repository.js";
import type { ReceitaResposta } from "../types/receita.js";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export class ReceitasService {
  constructor(private readonly repository: ReceitasRepository) {}

  private mapear(raw: Awaited<ReturnType<ReceitasRepository["buscarPorData"]>>): ReceitaResposta[] {
    return raw
      .map((r) => {
        const paciente = Array.isArray(r.a004_pacientes) ? r.a004_pacientes[0] : r.a004_pacientes;
        const medicamentos = (r.a006_receita_medicamentos ?? [])
          .map((rm) => (Array.isArray(rm.a003_medicamentos) ? rm.a003_medicamentos[0] : rm.a003_medicamentos))
          .filter(Boolean)
          .map((m) => ({
            nome_medicamento: m.a003_nome,
            nome_imagem_medicamento: `${m.a003_nome}.png`,
            imagem_medicamento: m.a003_imagem_base64
          }));

        if (medicamentos.length === 0) {
          return null;
        }

        return {
          data_receita: r.a005_data_receita,
          cartao_sus: paciente?.a004_cartao_sus ?? "",
          nome_paciente: paciente?.a004_nome ?? "",
          medicamentos
        };
      })
      .filter((item): item is ReceitaResposta => item !== null);
  }

  async porData(dataReceita: string): Promise<ReceitaResposta[]> {
    const raw = await this.repository.buscarPorData(dataReceita);
    return this.mapear(raw);
  }

  async porIntervaloData(dataInicial: string, dataFinal: string): Promise<ReceitaResposta[]> {
    const raw = await this.repository.buscarPorIntervaloData(dataInicial, dataFinal);
    return this.mapear(raw);
  }

  async porDiaMes(dia: number, mes: number): Promise<ReceitaResposta[]> {
    const raw = await this.repository.buscarTodasComData();
    const filtrado = raw.filter((r) => {
      if (!r.a005_data_receita) {
        return false;
      }
      const d = new Date(`${r.a005_data_receita}T00:00:00`);
      return d.getDate() === dia && d.getMonth() + 1 === mes;
    });
    return this.mapear(filtrado);
  }

  async porMes(mes: number): Promise<ReceitaResposta[]> {
    const raw = await this.repository.buscarTodasComData();
    const filtrado = raw.filter((r) => {
      if (!r.a005_data_receita) {
        return false;
      }
      const d = new Date(`${r.a005_data_receita}T00:00:00`);
      return d.getMonth() + 1 === mes;
    });
    return this.mapear(filtrado);
  }

  async porNomePaciente(nomePaciente: string): Promise<ReceitaResposta[]> {
    const normalizedName = normalizeText(nomePaciente);
    const raw = await this.repository.buscarTodasReceitas();

    const filtrado = raw.filter((r) => {
      const paciente = Array.isArray(r.a004_pacientes) ? r.a004_pacientes[0] : r.a004_pacientes;
      const nomeBanco = normalizeText(String(paciente?.a004_nome ?? ""));
      return nomeBanco.includes(normalizedName);
    });

    return this.mapear(filtrado);
  }

  async porCartaoSus(cartaoSus: string): Promise<ReceitaResposta[]> {
    const raw = await this.repository.buscarPorCartaoSus(digitsOnly(cartaoSus));
    return this.mapear(raw);
  }
}
