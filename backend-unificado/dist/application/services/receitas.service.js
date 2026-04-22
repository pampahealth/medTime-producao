"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceitasService = void 0;
function digitsOnly(value) {
    return value.replace(/\D/g, "");
}
function extrairHorario(valor) {
    if (!valor)
        return null;
    const match = String(valor).match(/(\d{2}:\d{2}:\d{2})/);
    return match?.[1] ?? null;
}
function extrairData(valor) {
    if (!valor)
        return null;
    const match = String(valor).match(/^(\d{4}-\d{2}-\d{2})/);
    return match?.[1] ?? null;
}
function ehSomenteHora(valor) {
    return /^\d{2}:\d{2}(:\d{2})?$/.test(valor.trim());
}
function normalizarHora(hora) {
    if (/^\d{2}:\d{2}$/.test(hora.trim()))
        return `${hora.trim()}:00`;
    return hora.trim();
}
function somarDias(yyyyMmDd, dias) {
    const base = new Date(`${yyyyMmDd}T00:00:00`);
    if (Number.isNaN(base.getTime()))
        return yyyyMmDd;
    base.setDate(base.getDate() + dias);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, "0");
    const d = String(base.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function detectarCicloHorarios(horarios) {
    if (horarios.length <= 1)
        return 1;
    const first = horarios[0];
    for (let i = 1; i < horarios.length; i++)
        if (horarios[i] === first)
            return i;
    return Math.max(1, new Set(horarios).size);
}
function normalizarDataHoraTomadas(raw, dataBase) {
    if (raw.length === 0)
        return [];
    const base = dataBase && /^\d{4}-\d{2}-\d{2}$/.test(dataBase) ? dataBase : null;
    if (!base)
        return raw;
    if (!raw.every((v) => ehSomenteHora(v)))
        return raw;
    const horas = raw.map(normalizarHora);
    const ciclo = detectarCicloHorarios(horas);
    return horas.map((hora, idx) => `${somarDias(base, Math.floor(idx / ciclo))}T${hora}`);
}
class ReceitasService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    mapear(raw) {
        const saida = [];
        for (const r of raw) {
            const paciente = Array.isArray(r.a004_pacientes) ? r.a004_pacientes[0] : r.a004_pacientes;
            const medicamentos = [];
            for (const rm of r.a006_receita_medicamentos ?? []) {
                const med = Array.isArray(rm.a003_medicamentos) ? rm.a003_medicamentos[0] : rm.a003_medicamentos;
                if (!med)
                    continue;
                const rawTomadas = (rm.a007_receita_horarios ?? [])
                    .map((h) => String(h.a007_data_hora_disparo ?? "").trim())
                    .filter((v) => v.length > 0);
                const datasHoraTomadas = normalizarDataHoraTomadas(rawTomadas, r.a005_data_receita ?? null);
                const horarios = datasHoraTomadas.map((v) => v.trim()).filter((v) => v.length > 0);
                const tomadas = datasHoraTomadas.map((dataHora) => ({
                    data_hora: dataHora,
                    data: extrairData(dataHora),
                    hora: extrairHorario(dataHora),
                }));
                medicamentos.push({
                    nome_medicamento: med.a003_nome,
                    nome_imagem_medicamento: `${med.a003_nome}.png`,
                    imagem_medicamento: med.a003_imagem_base64 ?? "",
                    horario: datasHoraTomadas[0] ?? null,
                    horarios,
                    data_hora_tomada: datasHoraTomadas[0] ?? null,
                    datas_hora_tomadas: datasHoraTomadas,
                    tomadas,
                });
            }
            if (medicamentos.length === 0)
                continue;
            saida.push({
                data_receita: r.a005_data_receita,
                cartao_sus: paciente?.a004_cartao_sus ?? "",
                nome_paciente: paciente?.a004_nome ?? "",
                medicamentos,
            });
        }
        return saida;
    }
    async porData(dataReceita) {
        return this.mapear(await this.repository.buscarPorData(dataReceita));
    }
    async porIntervaloData(dataInicio, dataFim) {
        return this.mapear(await this.repository.buscarPorIntervaloData(dataInicio, dataFim));
    }
    async porNomePaciente(nomePaciente) {
        return this.mapear(await this.repository.buscarPorNomePaciente(nomePaciente));
    }
    async porCartaoSus(cartaoSus) {
        return this.mapear(await this.repository.buscarPorCartaoSus(digitsOnly(cartaoSus)));
    }
    async coletaCompleta(filtros) {
        if (filtros.cartao_sus?.trim()) {
            const dados = await this.porCartaoSus(filtros.cartao_sus);
            return { total: dados.length, filtro_aplicado: "cartao_sus", dados };
        }
        if (filtros.nome_paciente?.trim()) {
            const dados = await this.porNomePaciente(filtros.nome_paciente);
            return { total: dados.length, filtro_aplicado: "nome_paciente", dados };
        }
        if (filtros.data_inicio?.trim() && filtros.data_fim?.trim()) {
            const dados = await this.porIntervaloData(filtros.data_inicio, filtros.data_fim);
            return { total: dados.length, filtro_aplicado: "intervalo_data", dados };
        }
        if (filtros.data_inicio?.trim()) {
            const dados = await this.porData(filtros.data_inicio);
            return { total: dados.length, filtro_aplicado: "data", dados };
        }
        const limite = Math.max(1, Math.min(1000, Number(filtros.limite ?? 200)));
        const dados = this.mapear(await this.repository.buscarRecentes(limite));
        return { total: dados.length, filtro_aplicado: "recentes", limite_aplicado: limite, dados };
    }
}
exports.ReceitasService = ReceitasService;
