/**
 * Regras de negócio para datas e horários do agendamento de medicamentos.
 * Funções puras para facilitar testes e baixo acoplamento.
 */

const FORMATO_DATA_BR = 'dd/mm/yyyy';

/**
 * Retorna a data de hoje no formato dd/mm/yyyy (apenas dia/mês/ano).
 */
export function getDataHojeFormatada(): string {
  const hoje = new Date();
  return formatarDataBR(hoje);
}

/**
 * Retorna a data de hoje em yyyy-mm-dd (para valor de input type="date").
 */
export function getDataHojeYmd(): string {
  const hoje = new Date();
  const y = hoje.getFullYear();
  const m = String(hoje.getMonth() + 1).padStart(2, '0');
  const d = String(hoje.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formata uma Date ou string ISO para dd/mm/yyyy.
 */
export function formatarDataBR(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) return '';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Converte string dd/mm/yyyy para objeto Date (meia-noite UTC local).
 */
export function parseDataBR(str: string): Date | null {
  if (!str?.trim()) return null;
  const [dia, mes, ano] = str.trim().split('/').map(Number);
  if (!dia || !mes || !ano || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const d = new Date(ano, mes - 1, dia);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * Converte string dd/mm/yyyy para yyyy-mm-dd (valor para input type="date").
 */
export function dataBRParaInput(str: string): string {
  const d = parseDataBR(str);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Converte valor de input type="date" (yyyy-mm-dd) para dd/mm/yyyy.
 */
export function inputParaDataBR(value: string): string {
  if (!value?.trim()) return '';
  const d = new Date(value + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return '';
  return formatarDataBR(d);
}

/**
 * Calcula a validade da receita: data de início + duração em dias.
 * Retorno em dd/mm/yyyy. O último dia de uso é (inicio + duracaoDias - 1).
 * A "validade" aqui é considerada como o último dia do tratamento.
 */
export function calcularValidadeReceita(
  dataInicioStr: string,
  duracaoDias: number
): string {
  const inicio = parseDataBR(dataInicioStr);
  if (!inicio || duracaoDias < 1) return '';
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + duracaoDias - 1);
  return formatarDataBR(fim);
}

/**
 * Converte horário "HH:mm" para minutos desde meia-noite (0-1439).
 */
function horarioParaMinutos(horario: string): number | null {
  if (!horario?.trim()) return null;
  const [h, m] = horario.trim().split(':').map(Number);
  if (h == null || m == null || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/**
 * Valida se o intervalo entre horários das tomadas respeita o mínimo em horas.
 * Horários são considerados em ordem circular (ex.: 08:00, 16:00, 00:00).
 * Retorna { valido, mensagem }.
 */
export function validarIntervaloHorarios(
  horarios: string[],
  intervaloMinimoHoras: number
): { valido: boolean; mensagem?: string } {
  if (intervaloMinimoHoras < 0) {
    return { valido: true };
  }
  const minutos = horarios
    .map(horarioParaMinutos)
    .filter((m): m is number => m !== null);
  if (minutos.length !== horarios.length || minutos.length === 0) {
    return { valido: false, mensagem: 'Preencha todos os horários no formato HH:mm.' };
  }
  const minutosPorDia = 24 * 60;
  const intervaloMinimoMinutos = intervaloMinimoHoras * 60;
  const ordenados = [...minutos].sort((a, b) => a - b);

  for (let i = 0; i < ordenados.length; i++) {
    const atual = ordenados[i];
    const proximo = i === ordenados.length - 1 ? ordenados[0] + minutosPorDia : ordenados[i + 1];
    const intervalo = proximo - atual;
    if (intervalo < intervaloMinimoMinutos) {
      return {
        valido: false,
        mensagem: `O intervalo entre as tomadas deve ser de no mínimo ${intervaloMinimoHoras}h. Ajuste os horários.`,
      };
    }
  }
  return { valido: true };
}

/**
 * Gera lista de datas ISO (yyyy-mm-dd) do primeiro ao último dia do tratamento.
 */
export function gerarDiasTratamento(
  dataInicioStr: string,
  duracaoDias: number
): string[] {
  const inicio = parseDataBR(dataInicioStr);
  if (!inicio || duracaoDias < 1) return [];
  const dias: string[] = [];
  const d = new Date(inicio);
  for (let i = 0; i < duracaoDias; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dias.push(`${y}-${m}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

/**
 * Dado uma data (yyyy-mm-dd) e um horário "HH:mm", retorna ISO string (UTC) para a API.
 * Usa o fuso local para construir o instante correto.
 */
export function dataHoraParaISO(dataYmd: string, horarioHhMm: string): string {
  if (!dataYmd || !horarioHhMm?.trim()) return '';
  const [h, m] = horarioHhMm.trim().split(':').map(Number);
  if (h == null || m == null) return '';
  const [y, mo, day] = dataYmd.split('-').map(Number);
  if (!y || !mo || day == null) return '';
  const d = new Date(y, mo - 1, day, h, m ?? 0, 0);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

/**
 * Converte dd/mm/yyyy para yyyy-mm-dd para uso interno em geracao de horarios.
 */
export function dataBRParaYmd(str: string): string {
  const d = parseDataBR(str);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse de data aceitando yyyy-mm-dd ou dd/mm/yyyy.
 */
export function parseDataFlex(str: string): Date | null {
  if (!str?.trim()) return null;
  const s = str.trim();
  if (s.includes('-')) {
    const d = new Date(s + 'T12:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return parseDataBR(s);
}

const MESES_VALIDADE_RECEITA = 6;

/**
 * Calcula a data de vencimento da receita: data de início + 6 meses.
 * Retorno em dd/mm/yyyy.
 */
export function calcularDataVencimentoReceita(
  dataInicioStr: string,
  mesesValidade: number = MESES_VALIDADE_RECEITA
): string {
  const inicio = parseDataFlex(dataInicioStr);
  if (!inicio) return '';
  const vencimento = new Date(inicio);
  vencimento.setMonth(vencimento.getMonth() + mesesValidade);
  return formatarDataBR(vencimento);
}

export interface RenovacaoMensal {
  mes: number;
  data: Date;
  dataBR: string;
  label: string;
}

/**
 * Lista as 6 datas de renovação mensal (1º ao 6º mês a partir do início).
 * A 6ª corresponde ao vencimento da receita.
 */
export function calcularRenovacoesMensais(
  dataInicioStr: string,
  mesesValidade: number = MESES_VALIDADE_RECEITA
): RenovacaoMensal[] {
  const inicio = parseDataFlex(dataInicioStr);
  if (!inicio) return [];
  const result: RenovacaoMensal[] = [];
  for (let mes = 1; mes <= mesesValidade; mes++) {
    const d = new Date(inicio);
    d.setMonth(d.getMonth() + mes);
    result.push({
      mes,
      data: d,
      dataBR: formatarDataBR(d),
      label: mes === mesesValidade ? `Vencimento (${mes}º mês)` : `Renovação ${mes}º mês`,
    });
  }
  return result;
}

/**
 * Retorna quantos meses restam até o vencimento e a próxima data de renovação.
 * dataInicioStr: yyyy-mm-dd ou dd/mm/yyyy.
 */
export function contadorVencimentoReceita(
  dataInicioStr: string,
  mesesValidade: number = MESES_VALIDADE_RECEITA
): { restamMeses: number; proximaRenovacaoBR: string; proximaRenovacaoMes: number; vencida: boolean } {
  const inicio = parseDataFlex(dataInicioStr);
  if (!inicio) {
    return { restamMeses: 0, proximaRenovacaoBR: '', proximaRenovacaoMes: 0, vencida: true };
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(inicio);
  vencimento.setMonth(vencimento.getMonth() + mesesValidade);
  vencimento.setHours(0, 0, 0, 0);
  if (hoje >= vencimento) {
    return { restamMeses: 0, proximaRenovacaoBR: formatarDataBR(vencimento), proximaRenovacaoMes: mesesValidade, vencida: true };
  }
  const renovacoes = calcularRenovacoesMensais(dataInicioStr, mesesValidade);
  let proxima = renovacoes[renovacoes.length - 1];
  for (const r of renovacoes) {
    const d = new Date(r.data);
    d.setHours(0, 0, 0, 0);
    if (d > hoje) {
      proxima = r;
      break;
    }
  }
  const restamMeses = Math.max(0, Math.ceil((vencimento.getTime() - hoje.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
  return {
    restamMeses,
    proximaRenovacaoBR: proxima.dataBR,
    proximaRenovacaoMes: proxima.mes,
    vencida: false,
  };
}
