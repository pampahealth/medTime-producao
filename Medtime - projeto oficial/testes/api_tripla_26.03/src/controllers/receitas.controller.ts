import type { Request, Response } from "express";
import { z } from "zod";
import { ReceitasService } from "../services/receitas.service.js";

const dataSchema = z.string().min(2, "data_receita invalida");
const nomeSchema = z.string().min(2, "nome_paciente deve ter ao menos 2 caracteres");
const cartaoSchema = z.string().min(10, "cartao_sus invalido");

type DataFiltro =
  | { tipo: "dataCompleta"; isoDate: string };

function toIsoDate(ano: number, mes: number, dia: number): string | null {
  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) {
    return null;
  }

  const date = new Date(ano, mes - 1, dia);
  if (date.getFullYear() !== ano || date.getMonth() !== mes - 1 || date.getDate() !== dia) {
    return null;
  }

  const mm = String(mes).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");
  return `${ano}-${mm}-${dd}`;
}

function parseDataFiltro(input: string): DataFiltro | null {
  const value = input.trim();
  const anoAtual = new Date().getFullYear();

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { tipo: "dataCompleta", isoDate: value };
  }

  const normalized = value.replace(/[.\s-]+/g, "/");

  const anoFinal = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (anoFinal) {
    const [, dd, mm, yyyy] = anoFinal;
    const iso = toIsoDate(Number(yyyy), Number(mm), Number(dd));
    return iso ? { tipo: "dataCompleta", isoDate: iso } : null;
  }

  const anoInicio = normalized.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (anoInicio) {
    const [, yyyy, dd, mm] = anoInicio;
    const iso = toIsoDate(Number(yyyy), Number(mm), Number(dd));
    return iso ? { tipo: "dataCompleta", isoDate: iso } : null;
  }

  const diaMes = normalized.match(/^(\d{2})\/(\d{2})$/);
  if (diaMes) {
    const [, dd, mm] = diaMes;
    const iso = toIsoDate(anoAtual, Number(mm), Number(dd));
    return iso ? { tipo: "dataCompleta", isoDate: iso } : null;
  }

  const dia = normalized.match(/^(\d{2})$/);
  if (dia) {
    const diaNum = Number(dia[1]);
    const mesAtual = new Date().getMonth() + 1;
    const iso = toIsoDate(anoAtual, mesAtual, diaNum);
    return iso ? { tipo: "dataCompleta", isoDate: iso } : null;
  }

  return null;
}

export class ReceitasController {
  constructor(private readonly service: ReceitasService) {}

  async porData(req: Request, res: Response): Promise<void> {
    const rawInicio = String(req.query.data_receita_inicio ?? req.query.data_receita ?? "");
    const parsedInicio = dataSchema.safeParse(rawInicio);
    if (!parsedInicio.success) {
      res.status(400).json({ error: parsedInicio.error.issues[0]?.message ?? "Parametro invalido" });
      return;
    }
    const filtroInicio = parseDataFiltro(parsedInicio.data);
    if (!filtroInicio) {
      res.status(400).json({
        error:
          "data_receita deve estar em um dos formatos: DD, DD/MM, DD/MM/YYYY, YYYY/DD/MM, DD.MM, DD.MM.YYYY, YYYY.DD.MM, DD MM, DD MM YYYY ou YYYY DD MM"
      });
      return;
    }

    const rawFim = String(req.query.data_receita_fim ?? "").trim();
    let result;

    if (!rawFim) {
      result = await this.service.porData(filtroInicio.isoDate);
    } else {
      const parsedFim = dataSchema.safeParse(rawFim);
      if (!parsedFim.success) {
        res.status(400).json({ error: parsedFim.error.issues[0]?.message ?? "Parametro invalido" });
        return;
      }

      const filtroFim = parseDataFiltro(parsedFim.data);
      if (!filtroFim) {
        res.status(400).json({
          error:
            "data_receita_fim deve estar em um dos formatos: DD, DD/MM, DD/MM/YYYY, YYYY/DD/MM, DD.MM, DD.MM.YYYY, YYYY.DD.MM, DD MM, DD MM YYYY ou YYYY DD MM"
        });
        return;
      }

      const dataInicio = filtroInicio.isoDate <= filtroFim.isoDate ? filtroInicio.isoDate : filtroFim.isoDate;
      const dataFim = filtroInicio.isoDate <= filtroFim.isoDate ? filtroFim.isoDate : filtroInicio.isoDate;
      result = await this.service.porIntervaloData(dataInicio, dataFim);
    }

    res.status(200).json(result);
  }

  async porNomePaciente(req: Request, res: Response): Promise<void> {
    const parsed = nomeSchema.safeParse(String(req.query.nome_paciente ?? ""));
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Parametro invalido" });
      return;
    }
    const result = await this.service.porNomePaciente(parsed.data);
    res.status(200).json(result);
  }

  async porCartaoSus(req: Request, res: Response): Promise<void> {
    const parsed = cartaoSchema.safeParse(String(req.query.cartao_sus ?? ""));
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Parametro invalido" });
      return;
    }
    const result = await this.service.porCartaoSus(parsed.data);
    res.status(200).json(result);
  }
}
