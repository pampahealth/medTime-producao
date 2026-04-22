import { Request, Response } from "express";
import { supabase, SCHEMA, TABLES } from "@/configs/supabase";
import { AppError } from "@/utils/AppErrors";
import { z } from "zod";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createSchema = z.object({
  a006_id_receita: z.string().uuid("ID receita inválido"),
  a006_id_medicamento: z.union([z.string().uuid(), z.string(), z.number()]).transform((v) => (v != null ? String(v) : undefined)),
  a006_quantidade_total: z.number().optional().nullable(),
  a006_frequencia_dia: z.number().int().min(1).optional().nullable(),
  a006_duracao_dias: z.number().int().min(1).optional().nullable(),
  a006_observacao: z.string().optional().nullable(),
  a006_id_prefeitura: z.union([z.string(), z.number()]).optional().transform((v) => (v != null ? String(v) : undefined)),
});

const createSchemaPartial = z.object({
  a006_id_receita: z.union([z.string().uuid(), z.string(), z.number()]).transform((v) => (v != null ? String(v) : undefined)).optional(),
  a006_id_medicamento: z.union([z.string().uuid(), z.string(), z.number()]).transform((v) => (v != null ? String(v) : undefined)).optional(),
  a006_quantidade_total: z.number().optional().nullable(),
  a006_frequencia_dia: z.number().int().min(1).optional().nullable(),
  a006_duracao_dias: z.number().int().min(1).optional().nullable(),
  a006_observacao: z.string().optional().nullable(),
  a006_id_prefeitura: z.union([z.string().uuid(), z.string(), z.number()]).transform((v) => (v != null ? String(v) : undefined)).optional(),
});
const updateSchema = createSchemaPartial.partial();

class ReceitaMedicamentosController {
  async index(req: Request, res: Response) {
    const idReceitaRaw = req.query.id_receita;
    const idReceita = typeof idReceitaRaw === "string" ? idReceitaRaw.trim() : undefined;
    const idPrefeitura = req.query.id_prefeitura as string | undefined;
    let q = supabase.schema(SCHEMA).from(TABLES.receita_medicamentos).select("*").order("a006_created_at", { ascending: false });
    if (idReceita) q = q.eq("a006_id_receita", idReceita);
    if (idPrefeitura) q = q.eq("a006_id_prefeitura", idPrefeitura);
    const { data, error } = await q;
    if (error) throw new AppError(error.message, 400);
    res.json(data);
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.receita_medicamentos).select("*").eq("a006_id_rm", id).single();
    if (error || !data) throw new AppError("Registro não encontrado", 404);
    res.json(data);
  }

  async create(req: Request, res: Response) {
    const body = createSchema.parse(req.body) as Record<string, unknown>;
    const prefeituraId = body.a006_id_prefeitura as string | undefined;
    if (!prefeituraId || !uuidRegex.test(prefeituraId)) {
      const { data: prefs } = await supabase.schema(SCHEMA).from(TABLES.prefeitura).select("a001_id_prefeitura").limit(1);
      const first = prefs?.[0] as { a001_id_prefeitura: string } | undefined;
      if (first?.a001_id_prefeitura) body.a006_id_prefeitura = first.a001_id_prefeitura;
      else throw new AppError("Nenhuma prefeitura cadastrada. Cadastre uma prefeitura antes de criar vínculo.", 400);
    }
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.receita_medicamentos).insert(body).select().single();
    if (error) throw new AppError(error.message, 400);
    res.status(201).json(data);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const body = updateSchema.parse(req.body);
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.receita_medicamentos).update(body).eq("a006_id_rm", id).select().single();
    if (error) throw new AppError(error.message, 400);
    if (!data) throw new AppError("Registro não encontrado", 404);
    res.json(data);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { error } = await supabase.schema(SCHEMA).from(TABLES.receita_medicamentos).delete().eq("a006_id_rm", id);
    if (error) throw new AppError(error.message, 400);
    res.status(204).send();
  }
}

export { ReceitaMedicamentosController };
