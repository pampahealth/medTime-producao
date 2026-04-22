import { Request, Response } from "express";
import { supabase, SCHEMA, TABLES } from "@/configs/supabase";
import { AppError } from "@/utils/AppErrors";
import { z } from "zod";

const createSchema = z.object({
  x001_codigo: z.string().max(50).optional(),
  x001_nome: z.string().max(50).optional(),
  x001_valor: z.string().max(50).optional(),
  x001_descricao: z.string().max(50).optional(),
});

const updateSchema = createSchema.partial();

class X001Controller {
  async index(_req: Request, res: Response) {
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.x001).select("*").order("x001_codigo");
    if (error) throw new AppError(error.message, 400);
    res.json(data);
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.x001).select("*").eq("x001_id", id).single();
    if (error || !data) throw new AppError("Registro não encontrado", 404);
    res.json(data);
  }

  async create(req: Request, res: Response) {
    const body = createSchema.parse(req.body);
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.x001).insert(body).select().single();
    if (error) throw new AppError(error.message, 400);
    res.status(201).json(data);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const body = updateSchema.parse(req.body);
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.x001).update(body).eq("x001_id", id).select().single();
    if (error) throw new AppError(error.message, 400);
    if (!data) throw new AppError("Registro não encontrado", 404);
    res.json(data);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { error } = await supabase.schema(SCHEMA).from(TABLES.x001).delete().eq("x001_id", id);
    if (error) throw new AppError(error.message, 400);
    res.status(204).send();
  }
}

export { X001Controller };
