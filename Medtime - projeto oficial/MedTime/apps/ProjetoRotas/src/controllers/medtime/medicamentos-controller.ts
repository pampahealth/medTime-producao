import { Request, Response } from "express";
import { supabase, SCHEMA, TABLES } from "@/configs/supabase";
import { AppError } from "@/utils/AppErrors";
import { z } from "zod";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createSchema = z.object({
  a003_nome: z.string().min(1, "Nome obrigatório").max(200),
  a003_imagem_base64: z.string().optional().nullable().transform((v) => (v && v.trim() ? v : " ")),
  a003_ativo: z.boolean().default(true),
  a003_id_prefeitura: z.string().optional(),
  a003_descricao: z.string().optional().nullable(),
  a003_principio_ativo: z.string().max(200).optional().nullable(),
  a003_concentracao: z.string().max(100).optional().nullable(),
  a003_forma_farmaceutica: z.string().max(100).optional().nullable(),
});

const updateSchema = z.object({
  a003_nome: z.string().min(1).max(200).optional(),
  a003_imagem_base64: z.string().optional(),
  a003_ativo: z.boolean().optional(),
  a003_id_prefeitura: z.union([z.string().uuid(), z.string(), z.number()]).transform((v) => (v != null ? String(v) : undefined)).optional(),
  a003_descricao: z.string().optional().nullable(),
  a003_principio_ativo: z.string().max(200).optional().nullable(),
  a003_concentracao: z.string().max(100).optional().nullable(),
  a003_forma_farmaceutica: z.string().max(100).optional().nullable(),
});

class MedicamentosController {
  async index(req: Request, res: Response) {
    const idPrefeitura = req.query.id_prefeitura as string | undefined;
    const showInactive = req.query.showInactive === "true" || req.query.showInactive === true;
    let q = supabase.schema(SCHEMA).from(TABLES.medicamentos).select("*").order("a003_nome");
    if (idPrefeitura) q = q.eq("a003_id_prefeitura", idPrefeitura);
    if (!showInactive) q = q.eq("a003_ativo", true);
    const { data, error } = await q;
    if (error) throw new AppError(error.message, 400);
    res.json(data);
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.medicamentos).select("*").eq("a003_id_medicamento", id).single();
    if (error || !data) throw new AppError("Medicamento não encontrado", 404);
    res.json(data);
  }

  async create(req: Request, res: Response) {
    const body = createSchema.parse(req.body) as Record<string, unknown>;
    if (!body.a003_imagem_base64 || String(body.a003_imagem_base64).trim() === "") {
      body.a003_imagem_base64 = " ";
    }
    const prefeituraId = body.a003_id_prefeitura as string | undefined;
    if (!prefeituraId || !uuidRegex.test(prefeituraId)) {
      const { data: prefs } = await supabase.schema(SCHEMA).from(TABLES.prefeitura).select("a001_id_prefeitura").limit(1);
      const first = prefs?.[0] as { a001_id_prefeitura: string } | undefined;
      if (first?.a001_id_prefeitura) body.a003_id_prefeitura = first.a001_id_prefeitura;
      else throw new AppError("Nenhuma prefeitura cadastrada. Cadastre uma prefeitura antes de criar medicamento.", 400);
    }
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.medicamentos).insert(body).select().single();
    if (error) throw new AppError(error.message, 400);
    res.status(201).json(data);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const body = updateSchema.parse(req.body);
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.medicamentos).update(body).eq("a003_id_medicamento", id).select().single();
    if (error) throw new AppError(error.message, 400);
    if (!data) throw new AppError("Medicamento não encontrado", 404);
    res.json(data);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { error } = await supabase.schema(SCHEMA).from(TABLES.medicamentos).delete().eq("a003_id_medicamento", id);
    if (error) throw new AppError(error.message, 400);
    res.status(204).send();
  }
}

export { MedicamentosController };
