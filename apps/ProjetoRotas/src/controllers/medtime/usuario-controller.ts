import { Request, Response } from "express";
import { supabase, SCHEMA, TABLES } from "@/configs/supabase";
import { AppError } from "@/utils/AppErrors";
import { z } from "zod";
import { hash } from "bcrypt";

const createSchema = z.object({
  a008_user_email: z.string().email("E-mail inválido").max(80),
  a008_user_senha: z.string().min(6, "Senha mínimo 6 caracteres").max(80),
  a008_user_tipo: z.string().min(1, "Tipo obrigatório").max(80),
});

const updateSchema = z.object({
  a008_user_email: z.string().email().max(80).optional(),
  a008_user_senha: z.string().min(6).max(80).optional(),
  a008_user_tipo: z.string().max(80).optional(),
});

class UsuarioController {
  async index(_req: Request, res: Response) {
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.usuario).select("a008_id, a008_user_email, a008_user_tipo").order("a008_user_email");
    if (error) throw new AppError(error.message, 400);
    res.json(data);
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.usuario).select("a008_id, a008_user_email, a008_user_tipo").eq("a008_id", id).single();
    if (error || !data) throw new AppError("Usuário não encontrado", 404);
    res.json(data);
  }

  async create(req: Request, res: Response) {
    const body = createSchema.parse(req.body);
    const senhaHash = await hash(body.a008_user_senha, 10);
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.usuario).insert({
      a008_user_email: body.a008_user_email,
      a008_user_senha: senhaHash,
      a008_user_tipo: body.a008_user_tipo,
    }).select("a008_id, a008_user_email, a008_user_tipo").single();
    if (error) throw new AppError(error.message, 400);
    res.status(201).json(data);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const body = updateSchema.parse(req.body);
    const payload: Record<string, unknown> = {};
    if (body.a008_user_email !== undefined) payload.a008_user_email = body.a008_user_email;
    if (body.a008_user_tipo !== undefined) payload.a008_user_tipo = body.a008_user_tipo;
    if (body.a008_user_senha) payload.a008_user_senha = await hash(body.a008_user_senha, 10);
    if (Object.keys(payload).length === 0) throw new AppError("Nenhum campo válido para atualizar", 400);
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.usuario).update(payload).eq("a008_id", id).select("a008_id, a008_user_email, a008_user_tipo").single();
    if (error) throw new AppError(error.message, 400);
    if (!data) throw new AppError("Usuário não encontrado", 404);
    res.json(data);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { error } = await supabase.schema(SCHEMA).from(TABLES.usuario).delete().eq("a008_id", id);
    if (error) throw new AppError(error.message, 400);
    res.status(204).send();
  }
}

export { UsuarioController };
