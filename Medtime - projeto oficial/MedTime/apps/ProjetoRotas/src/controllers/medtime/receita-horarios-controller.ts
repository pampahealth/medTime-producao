import { Request, Response } from "express";
import { supabase, SCHEMA, TABLES } from "@/configs/supabase";
import { AppError } from "@/utils/AppErrors";
import { z } from "zod";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createSchema = z.object({
  a007_id_rm: z.string().uuid("ID receita_medicamento inválido"),
  a007_id_prefeitura: z.union([z.string(), z.number()]).optional().transform((v) => (v != null ? String(v) : undefined)),
  a007_data_hora_disparo: z.string().min(1, "Data/hora disparo obrigatória"),
  a007_data_hora_desligado: z.string().optional().nullable(),
  a007_tomou: z.boolean().optional().nullable(),
  a007_sms_enviado: z.boolean().default(false),
  a007_data_sms: z.string().optional().nullable(),
  a007_tentativas: z.number().int().min(0).default(0),
});

const updateSchema = createSchema.partial();

class ReceitaHorariosController {
  async index(req: Request, res: Response) {
    const idRm = req.query.id_rm as string | undefined;
    const idPrefeitura = req.query.id_prefeitura as string | undefined;
    let q = supabase.schema(SCHEMA).from(TABLES.receita_horarios).select("*").order("a007_data_hora_disparo", { ascending: false });
    if (idRm) q = q.eq("a007_id_rm", idRm);
    if (idPrefeitura) q = q.eq("a007_id_prefeitura", idPrefeitura);
    const { data, error } = await q;
    if (error) throw new AppError(error.message, 400);
    res.json(data);
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.receita_horarios).select("*").eq("a007_id_horario", id).single();
    if (error || !data) throw new AppError("Horário não encontrado", 404);
    res.json(data);
  }

  async create(req: Request, res: Response) {
    const body = createSchema.parse(req.body) as Record<string, unknown>;
    const prefeituraId = body.a007_id_prefeitura as string | undefined;
    if (!prefeituraId || !uuidRegex.test(prefeituraId)) {
      const { data: prefs } = await supabase.schema(SCHEMA).from(TABLES.prefeitura).select("a001_id_prefeitura").limit(1);
      const first = prefs?.[0] as { a001_id_prefeitura: string } | undefined;
      if (first?.a001_id_prefeitura) body.a007_id_prefeitura = first.a001_id_prefeitura;
      else throw new AppError("Nenhuma prefeitura cadastrada. Cadastre uma prefeitura antes de criar horário.", 400);
    }
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.receita_horarios).insert(body).select().single();
    if (error) throw new AppError(error.message, 400);
    res.status(201).json(data);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const body = updateSchema.parse(req.body);
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.receita_horarios).update(body).eq("a007_id_horario", id).select().single();
    if (error) throw new AppError(error.message, 400);
    if (!data) throw new AppError("Horário não encontrado", 404);
    res.json(data);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { error } = await supabase.schema(SCHEMA).from(TABLES.receita_horarios).delete().eq("a007_id_horario", id);
    if (error) throw new AppError(error.message, 400);
    res.status(204).send();
  }
}

export { ReceitaHorariosController };
