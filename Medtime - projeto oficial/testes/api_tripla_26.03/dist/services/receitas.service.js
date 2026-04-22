"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceitasService = void 0;
function digitsOnly(value) {
    return value.replace(/\D/g, "");
}
function normalizeText(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}
class ReceitasService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    mapear(raw) {
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
            .filter((item) => item !== null);
    }
    async porData(dataReceita) {
        const raw = await this.repository.buscarPorData(dataReceita);
        return this.mapear(raw);
    }
    async porIntervaloData(dataInicial, dataFinal) {
        const raw = await this.repository.buscarPorIntervaloData(dataInicial, dataFinal);
        return this.mapear(raw);
    }
    async porDiaMes(dia, mes) {
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
    async porMes(mes) {
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
    async porNomePaciente(nomePaciente) {
        const normalizedName = normalizeText(nomePaciente);
        const raw = await this.repository.buscarTodasReceitas();
        const filtrado = raw.filter((r) => {
            const paciente = Array.isArray(r.a004_pacientes) ? r.a004_pacientes[0] : r.a004_pacientes;
            const nomeBanco = normalizeText(String(paciente?.a004_nome ?? ""));
            return nomeBanco.includes(normalizedName);
        });
        return this.mapear(filtrado);
    }
    async porCartaoSus(cartaoSus) {
        const raw = await this.repository.buscarPorCartaoSus(digitsOnly(cartaoSus));
        return this.mapear(raw);
    }
}
exports.ReceitasService = ReceitasService;
