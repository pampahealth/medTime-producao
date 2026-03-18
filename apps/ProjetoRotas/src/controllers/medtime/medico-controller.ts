import { Request, Response } from "express";
import { supabase, SCHEMA, TABLES } from "@/configs/supabase";
import { AppError } from "@/utils/AppErrors";
import { z } from "zod";

const createSchema = z.object({
  a002_nome_medico: z.string().min(1, "Nome obrigatório").max(80),
  a002_crm: z.string().min(1, "CRM obrigatório").max(10),
  a002_especialidade: z.string().max(100).optional(),
  a002_ativo: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

class MedicoController {
  async index(_req: Request, res: Response) {
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.medico).select("*").order("a002_nome_medico");
    if (error) throw new AppError(error.message, 400);
    res.json(data);
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.medico).select("*").eq("a002_id_medico", id).single();
    if (error || !data) throw new AppError("Médico não encontrado", 404);
    res.json(data);
  }

  async create(req: Request, res: Response) {
    const body = createSchema.parse(req.body);
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.medico).insert(body).select().single();
    if (error) throw new AppError(error.message, 400);
    res.status(201).json(data);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const body = updateSchema.parse(req.body);
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.medico).update(body).eq("a002_id_medico", id).select().single();
    if (error) throw new AppError(error.message, 400);
    if (!data) throw new AppError("Médico não encontrado", 404);
    res.json(data);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { error } = await supabase.schema(SCHEMA).from(TABLES.medico).delete().eq("a002_id_medico", id);
    if (error) throw new AppError(error.message, 400);
    res.status(204).send();
  }
}

export { MedicoController };
