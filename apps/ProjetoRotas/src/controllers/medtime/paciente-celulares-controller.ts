import { Request, Response } from "express";
import { supabase, SCHEMA, TABLES } from "@/configs/supabase";
import { AppError } from "@/utils/AppErrors";
import { z } from "zod";

const createSchema = z.object({
  a009_id_paciente: z.string().uuid("ID paciente inválido"),
  a009_id_prefeitura: z.string().uuid().optional(),
  a009_modelo: z.string().min(1, "Modelo obrigatório").max(100),
  a009_marca: z.string().min(1, "Marca obrigatória").max(100),
  a009_numero_serie: z.string().max(100).optional().nullable(),
  a009_numero_contato: z.string().min(1, "Número de contato obrigatório").max(20),
  a009_tipo_celular: z.enum(["proprio", "cuidador"]),
  a009_nome_cuidador: z.string().max(200).optional().nullable(),
  a009_ativo: z.boolean().optional(),
});

const updateSchema = z.object({
  a009_id_paciente: z.string().uuid().optional(),
  a009_modelo: z.string().max(100).optional(),
  a009_marca: z.string().max(100).optional(),
  a009_numero_serie: z.string().max(100).optional().nullable(),
  a009_numero_contato: z.string().max(20).optional(),
  a009_tipo_celular: z.enum(["proprio", "cuidador"]).optional(),
  a009_nome_cuidador: z.string().max(200).optional().nullable(),
  a009_ativo: z.boolean().optional(),
}).partial();

class PacienteCelularesController {
  async index(req: Request, res: Response) {
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.paciente_celulares)
      .select("*")
      .order("a009_created_at", { ascending: false });
    if (error) throw new AppError(error.message, 400);
    res.json(data ?? []);
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.paciente_celulares)
      .select("*")
      .eq("a009_id_celular", id)
      .single();
    if (error || !data) throw new AppError("Celular não encontrado", 404);
    res.json(data);
  }

  async create(req: Request, res: Response) {
    const body = createSchema.parse(req.body) as Record<string, unknown>;
    if (!body.a009_id_prefeitura) {
      const { data: prefs } = await supabase.schema(SCHEMA).from(TABLES.prefeitura).select("a001_id_prefeitura").limit(1);
      const first = prefs?.[0] as { a001_id_prefeitura: string } | undefined;
      if (first?.a001_id_prefeitura) body.a009_id_prefeitura = first.a001_id_prefeitura;
      else throw new AppError("Nenhuma prefeitura cadastrada. Cadastre uma prefeitura antes.", 400);
    }
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.paciente_celulares)
      .insert(body)
      .select()
      .single();
    if (error) throw new AppError(error.message, 400);
    res.status(201).json(data);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.message, 400);
    const payload = parsed.data as Record<string, unknown>;
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.paciente_celulares)
      .update(payload)
      .eq("a009_id_celular", id)
      .select()
      .single();
    if (error) throw new AppError(error.message, 400);
    if (!data) throw new AppError("Celular não encontrado", 404);
    res.json(data);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { data: existing } = await supabase
      .schema(SCHEMA)
      .from(TABLES.paciente_celulares)
      .select("a009_id_celular")
      .eq("a009_id_celular", id)
      .single();
    if (!existing) throw new AppError("Celular não encontrado", 404);
    const { error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.paciente_celulares)
      .delete()
      .eq("a009_id_celular", id);
    if (error) throw new AppError(error.message, 400);
    res.json({ id });
  }
}

export { PacienteCelularesController };
