import { Request, Response } from "express";
import { supabase, SCHEMA, TABLES } from "@/configs/supabase";
import { AppError } from "@/utils/AppErrors";
import { z } from "zod";

const createSchema = z.object({
  a001_cnpj: z.string().min(1, "CNPJ obrigatório").max(80),
  a001_apelido: z.string().max(30).default("Android"),
});

const updateSchema = createSchema.partial();

class PrefeituraController {
  async index(_req: Request, res: Response) {
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.prefeitura).select("*").order("a001_cnpj");
    if (error) throw new AppError(error.message, 400);
    res.json(data);
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.prefeitura).select("*").eq("a001_id_prefeitura", id).single();
    if (error || !data) throw new AppError("Prefeitura não encontrada", 404);
    res.json(data);
  }

  async create(req: Request, res: Response) {
    const body = createSchema.parse(req.body);
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.prefeitura).insert(body).select().single();
    if (error) throw new AppError(error.message, 400);
    res.status(201).json(data);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const body = updateSchema.parse(req.body);
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.prefeitura).update(body).eq("a001_id_prefeitura", id).select().single();
    if (error) throw new AppError(error.message, 400);
    if (!data) throw new AppError("Prefeitura não encontrada", 404);
    res.json(data);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { error } = await supabase.schema(SCHEMA).from(TABLES.prefeitura).delete().eq("a001_id_prefeitura", id);
    if (error) throw new AppError(error.message, 400);
    res.status(204).send();
  }
}

export { PrefeituraController };
