import { Request, Response } from "express";
import { supabase, SCHEMA, TABLES } from "@/configs/supabase";
import { AppError } from "@/utils/AppErrors";
import { z } from "zod";

const createSchema = z.object({
  a004_cartao_sus: z.string().regex(/^\d+$/, "Cartão SUS apenas números").max(20),
  a004_nome: z.string().min(1, "Nome obrigatório").max(200),
  a004_celular: z.string().max(20).optional().nullable(),
  a004_cpf: z.string().max(11).optional().nullable(),
  a004_data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  a004_ativo: z.boolean().optional(),
  a004_app_instalado: z.enum(["S", "N"]).default("N"),
  a004_id_prefeitura: z.string().uuid("ID prefeitura inválido").optional(),
});

const optionalStringOrNull = (maxLen: number) =>
  z.union([z.string(), z.null(), z.literal("")]).transform((v) => {
    if (v === null || v === undefined || v === "") return null;
    return String(v).trim().slice(0, maxLen) || null;
  }).optional();

const updateSchema = z.object({
  a004_cartao_sus: z.string().regex(/^\d+$/).max(20).optional(),
  a004_nome: z.string().min(1).max(200).optional(),
  a004_celular: optionalStringOrNull(20),
  a004_cpf: optionalStringOrNull(11),
  a004_data_nascimento: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null(), z.literal("")]).transform((v) => (v === "" || v === null || v === undefined ? null : v)).optional().nullable(),
  a004_ativo: z.boolean().optional(),
  a004_app_instalado: z.enum(["S", "N"]).optional(),
  a004_id_prefeitura: z.union([z.string().uuid(), z.string(), z.number()]).transform((v) => (v != null ? String(v) : undefined)).optional(),
});

/** Colunas opcionais que podem não existir no schema cache do PostgREST (Supabase) */
const OPTIONAL_COLUMNS = ["a004_cpf", "a004_data_nascimento"];

function isSchemaCacheColumnError(message: string): boolean {
  return /column.*schema cache|schema cache.*column|Could not find the .* column/i.test(message);
}

function payloadWithoutOptionalColumns<T extends Record<string, unknown>>(payload: T): T {
  const out = { ...payload };
  for (const col of OPTIONAL_COLUMNS) {
    delete out[col];
  }
  return out;
}

/** Colunas para fallback quando schema cache não tem colunas opcionais */
const FALLBACK_SELECT =
  "a004_id_paciente,a004_cartao_sus,a004_nome,a004_celular,a004_ativo,a004_app_instalado,a004_created_at,a004_id_prefeitura";

class PacientesController {
  async index(req: Request, res: Response) {
    const idPrefeitura = req.query.id_prefeitura as string | undefined;
    let q = supabase.schema(SCHEMA).from(TABLES.pacientes).select("*").order("a004_nome");
    if (idPrefeitura) q = q.eq("a004_id_prefeitura", idPrefeitura);
    const { data, error } = await q;
    if (error) {
      if (isSchemaCacheColumnError(error.message)) {
        let retryQ = supabase.schema(SCHEMA).from(TABLES.pacientes).select(FALLBACK_SELECT).order("a004_nome");
        if (idPrefeitura) retryQ = retryQ.eq("a004_id_prefeitura", idPrefeitura);
        const r = await retryQ;
        if (r.error) throw new AppError(r.error.message, 400);
        return res.json(r.data ?? []);
      }
      throw new AppError(error.message, 400);
    }
    res.json(data ?? []);
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.pacientes).select("*").eq("a004_id_paciente", id).single();
    if (error || !data) {
      if (error && isSchemaCacheColumnError(error.message)) {
        const retry = await supabase.schema(SCHEMA).from(TABLES.pacientes).select(FALLBACK_SELECT).eq("a004_id_paciente", id).single();
        if (retry.error || !retry.data) throw new AppError("Paciente não encontrado", 404);
        return res.json(retry.data);
      }
      throw new AppError("Paciente não encontrado", 404);
    }
    res.json(data);
  }

  async create(req: Request, res: Response) {
    const body = createSchema.parse(req.body) as Record<string, unknown>;
    if (!body.a004_id_prefeitura) {
      const { data: prefs } = await supabase.schema(SCHEMA).from(TABLES.prefeitura).select("a001_id_prefeitura").limit(1);
      const first = prefs?.[0] as { a001_id_prefeitura: string } | undefined;
      if (first?.a001_id_prefeitura) body.a004_id_prefeitura = first.a001_id_prefeitura;
      else throw new AppError("Nenhuma prefeitura cadastrada. Cadastre uma prefeitura antes de criar paciente.", 400);
    }
    let { data, error } = await supabase.schema(SCHEMA).from(TABLES.pacientes).insert(body).select().single();
    if (error && isSchemaCacheColumnError(error.message)) {
      const bodyWithoutOptional = payloadWithoutOptionalColumns(body);
      const retry = await supabase.schema(SCHEMA).from(TABLES.pacientes).insert(bodyWithoutOptional).select().single();
      if (retry.error) throw new AppError(retry.error.message, 400);
      data = retry.data;
      error = retry.error;
    }
    if (error) throw new AppError(error.message, 400);
    res.status(201).json(data);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.message, 400);
    const body = parsed.data as Record<string, unknown>;
    const payload: Record<string, unknown> = {};
    const allowedKeys = [
      "a004_cartao_sus", "a004_nome", "a004_celular", "a004_cpf", "a004_data_nascimento",
      "a004_ativo", "a004_app_instalado", "a004_id_prefeitura",
    ];
    for (const key of allowedKeys) {
      if (key in body && body[key] !== undefined) payload[key] = body[key];
    }
    if (Object.keys(payload).length === 0) throw new AppError("Nenhum campo válido para atualizar", 400);
    let { data, error } = await supabase.schema(SCHEMA).from(TABLES.pacientes).update(payload).eq("a004_id_paciente", id).select().single();
    if (error && isSchemaCacheColumnError(error.message)) {
      const bodyWithoutOptional = payloadWithoutOptionalColumns(payload);
      const retry = await supabase.schema(SCHEMA).from(TABLES.pacientes).update(bodyWithoutOptional).eq("a004_id_paciente", id).select().single();
      if (retry.error) throw new AppError(retry.error.message, 400);
      data = retry.data;
      error = retry.error;
    }
    if (error) throw new AppError(error.message, 400);
    if (!data) throw new AppError("Paciente não encontrado", 404);
    res.json(data);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { error } = await supabase.schema(SCHEMA).from(TABLES.pacientes).delete().eq("a004_id_paciente", id);
    if (error) throw new AppError(error.message, 400);
    res.status(204).send();
  }
}

export { PacientesController };
