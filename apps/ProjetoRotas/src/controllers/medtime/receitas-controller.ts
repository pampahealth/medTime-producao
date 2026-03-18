import { Request, Response } from "express";
import { supabase, SCHEMA, TABLES } from "@/configs/supabase";
import { AppError } from "@/utils/AppErrors";
import { z } from "zod";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createSchema = z.object({
  a005_id_paciente: z.string().uuid("ID paciente inválido"),
  a005_id_medico: z.string().uuid().optional().nullable(),
  a005_data_receita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato YYYY-MM-DD"),
  a005_data_registro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  a005_origem_receita: z.string().max(80).optional().nullable(),
  a005_subgrupo_origem: z.string().max(80).optional().nullable(),
  a005_observacao: z.string().optional().nullable(),
  a005_tipo_prescritor: z.string().max(30).optional().nullable(),
  a005_num_notificacao: z.string().max(40).optional().nullable(),
  a005_id_prefeitura: z.string().optional(),
});

const updateSchema = z.object({
  a005_id_paciente: z.union([z.string().uuid(), z.string(), z.number()]).transform((v) => (v != null ? String(v) : undefined)).optional(),
  a005_id_medico: z.union([z.string().uuid(), z.string(), z.number()]).transform((v) => (v != null ? String(v) : undefined)).optional().nullable(),
  a005_data_receita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  a005_data_registro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  a005_origem_receita: z.string().max(80).optional().nullable(),
  a005_subgrupo_origem: z.string().max(80).optional().nullable(),
  a005_observacao: z.string().optional().nullable(),
  a005_tipo_prescritor: z.string().max(30).optional().nullable(),
  a005_num_notificacao: z.string().max(40).optional().nullable(),
  a005_id_prefeitura: z.union([z.string().uuid(), z.string(), z.number()]).transform((v) => (v != null ? String(v) : undefined)).optional(),
}).partial();

class ReceitasController {
  async index(req: Request, res: Response) {
    const idPrefeitura = req.query.id_prefeitura as string | undefined;
    const idPaciente = req.query.id_paciente as string | undefined;
    const comMedicamentosOnly = req.query.com_medicamentos_only === "true" || req.query.com_medicamentos_only === "1";
    const limitParam = req.query.limit as string | undefined;
    const limit = Math.min(Math.max(parseInt(limitParam || "10000", 10) || 10000, 1), 10000);
    const pageSize = 100;
    const minRows = 20; // mínimo para a lista do combobox
    const all: unknown[] = [];
    const seenIds = new Set<string>();
    let offset = 0;
    const maxRequests = 200; // evita loop infinito (ex.: quando o servidor retorna 1 por request)
    let requests = 0;

    // Para MEDTIME: só retornar receitas que têm ao menos um medicamento vinculado (evita receita em branco)
    let idsComMedicamentos: Set<string> | null = null;
    if (comMedicamentosOnly) {
      const { data: rowsRm } = await supabase
        .schema(SCHEMA)
        .from(TABLES.receita_medicamentos)
        .select("a006_id_receita");
      idsComMedicamentos = new Set(
        (rowsRm ?? []).map((r: { a006_id_receita: string }) => String(r.a006_id_receita ?? "").trim()).filter(Boolean)
      );
    }

    while (all.length < limit && requests < maxRequests) {
      let q = supabase
        .schema(SCHEMA)
        .from(TABLES.receitas)
        .select("*");
      if (idPrefeitura) q = q.eq("a005_id_prefeitura", idPrefeitura);
      if (idPaciente) q = q.eq("a005_id_paciente", idPaciente);
      q = q.order("a005_created_at", { ascending: false }).range(offset, offset + pageSize - 1);
      const { data, error } = await q;
      if (error) throw new AppError(error.message, 400);
      const page = (data ?? []) as unknown[];
      for (const row of page) {
        const id = String((row as { a005_id_receita?: string })?.a005_id_receita ?? "").trim();
        if (!id || seenIds.has(id)) continue;
        if (idsComMedicamentos !== null && !idsComMedicamentos.has(id)) continue; // só listar receitas com medicamentos
        seenIds.add(id);
        all.push(row);
        if (all.length >= limit) break;
      }
      if (page.length === 0) break;
      if (page.length < pageSize && all.length >= minRows) break; // última página e já temos o mínimo
      offset += pageSize;
      requests++;
    }

    res.json(all.slice(0, limit));
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.receitas).select("*").eq("a005_id_receita", id).single();
    if (error || !data) throw new AppError("Receita não encontrada", 404);
    res.json(data);
  }

  async create(req: Request, res: Response) {
    const body = createSchema.parse(req.body) as Record<string, unknown>;
    const prefeituraId = body.a005_id_prefeitura as string | undefined;
    if (!prefeituraId || !uuidRegex.test(prefeituraId)) {
      const { data: prefs } = await supabase.schema(SCHEMA).from(TABLES.prefeitura).select("a001_id_prefeitura").limit(1);
      const first = prefs?.[0] as { a001_id_prefeitura: string } | undefined;
      if (first?.a001_id_prefeitura) body.a005_id_prefeitura = first.a001_id_prefeitura;
      else throw new AppError("Nenhuma prefeitura cadastrada. Cadastre uma prefeitura antes de criar receita.", 400);
    }
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.receitas).insert(body).select().single();
    if (error) throw new AppError(error.message, 400);
    res.status(201).json(data);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const body = updateSchema.parse(req.body);
    const { data, error } = await supabase.schema(SCHEMA).from(TABLES.receitas).update(body).eq("a005_id_receita", id).select().single();
    if (error) throw new AppError(error.message, 400);
    if (!data) throw new AppError("Receita não encontrada", 404);
    res.json(data);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { error } = await supabase.schema(SCHEMA).from(TABLES.receitas).delete().eq("a005_id_receita", id);
    if (error) throw new AppError(error.message, 400);
    res.status(204).send();
  }
}

export { ReceitasController };
