export {
  getDataHojeFormatada,
  getDataHojeYmd,
  formatarDataBR,
  parseDataBR,
  dataBRParaInput,
  inputParaDataBR,
  calcularValidadeReceita,
  validarIntervaloHorarios,
  gerarDiasTratamento,
  dataHoraParaISO,
  dataBRParaYmd,
  parseDataFlex,
  calcularDataVencimentoReceita,
  calcularRenovacoesMensais,
  contadorVencimentoReceita,
} from './datas-e-horarios';
export type { RenovacaoMensal } from './datas-e-horarios';

import { gerarDiasTratamento, dataHoraParaISO, dataBRParaYmd } from './datas-e-horarios';

/** Converte yyyy-mm-dd para dd/mm/yyyy para uso em funções que esperam data BR. */
function ymdParaBR(ymd: string): string {
  if (!ymd || !ymd.includes('-')) return ymd;
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Gera a lista de datas/horas ISO para enviar à API de horários.
 * Um item para cada dose em cada dia do tratamento.
 * dataInicioYmd: yyyy-mm-dd (valor de input type="date").
 */
export function gerarHorariosISO(
  dataInicioYmd: string,
  duracaoDias: number,
  horariosTomadas: string[]
): string[] {
  const dataBR = ymdParaBR(dataInicioYmd);
  const dias = gerarDiasTratamento(dataBR, duracaoDias);
  const result: string[] = [];
  for (const dia of dias) {
    const ymd = dia;
    for (const h of horariosTomadas) {
      if (!h?.trim()) continue;
      const iso = dataHoraParaISO(ymd, h.trim());
      if (iso) result.push(iso);
    }
  }
  return result;
}
