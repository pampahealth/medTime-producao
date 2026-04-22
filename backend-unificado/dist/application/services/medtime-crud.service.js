"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedtimeCrudService = void 0;
const supabase_1 = require("../../infra/db/supabase");
const TABLE_MAP = {
    prefeitura: "a001_prefeitura",
    medico: "a002_medico",
    medicamentos: "a003_medicamentos",
    pacientes: "a004_pacientes",
    receitas: "a005_receitas",
    "receita-medicamentos": "a006_receita_medicamentos",
    "receita-horarios": "a007_receita_horarios",
    usuario: "a008_usuario",
    "paciente-celulares": "a009_paciente_celulares",
    x001: "x001",
    x002: "x002",
};
function resolveTable(resource) {
    const table = TABLE_MAP[resource];
    if (!table)
        throw new Error(`Recurso nao suportado: ${resource}`);
    return table;
}
class MedtimeCrudService {
    async list(resource, query) {
        const table = resolveTable(resource);
        let qb = supabase_1.supabase.schema(supabase_1.SUPABASE_SCHEMA).from(table).select("*");
        for (const [key, value] of Object.entries(query)) {
            if (value == null)
                continue;
            if (key === "limit" || key === "offset" || key === "order")
                continue;
            qb = qb.eq(key, Array.isArray(value) ? value[0] : value);
        }
        const { data, error } = await qb;
        if (error)
            throw new Error(error.message);
        return data ?? [];
    }
    async getById(resource, id) {
        const table = resolveTable(resource);
        const idColumn = await this.detectIdColumn(table);
        const { data, error } = await supabase_1.supabase
            .schema(supabase_1.SUPABASE_SCHEMA)
            .from(table)
            .select("*")
            .eq(idColumn, id)
            .limit(1);
        if (error)
            throw new Error(error.message);
        return data?.[0] ?? null;
    }
    async create(resource, payload) {
        const table = resolveTable(resource);
        const { data, error } = await supabase_1.supabase.schema(supabase_1.SUPABASE_SCHEMA).from(table).insert(payload).select().limit(1);
        if (error)
            throw new Error(error.message);
        return data?.[0] ?? null;
    }
    async update(resource, id, payload) {
        const table = resolveTable(resource);
        const idColumn = await this.detectIdColumn(table);
        const { data, error } = await supabase_1.supabase
            .schema(supabase_1.SUPABASE_SCHEMA)
            .from(table)
            .update(payload)
            .eq(idColumn, id)
            .select()
            .limit(1);
        if (error)
            throw new Error(error.message);
        return data?.[0] ?? null;
    }
    async remove(resource, id) {
        const table = resolveTable(resource);
        const idColumn = await this.detectIdColumn(table);
        const { error } = await supabase_1.supabase.schema(supabase_1.SUPABASE_SCHEMA).from(table).delete().eq(idColumn, id);
        if (error)
            throw new Error(error.message);
    }
    async detectIdColumn(table) {
        if (table.startsWith("a001_"))
            return "a001_id_prefeitura";
        if (table.startsWith("a002_"))
            return "a002_id_medico";
        if (table.startsWith("a003_"))
            return "a003_id_medicamento";
        if (table.startsWith("a004_"))
            return "a004_id_paciente";
        if (table.startsWith("a005_"))
            return "a005_id_receita";
        if (table.startsWith("a006_"))
            return "a006_id_rm";
        if (table.startsWith("a007_"))
            return "a007_id_horario";
        if (table.startsWith("a008_"))
            return "a008_id";
        if (table.startsWith("a009_"))
            return "a009_id_celular";
        if (table === "x001")
            return "x001_id";
        if (table === "x002")
            return "x002_id";
        return "id";
    }
}
exports.MedtimeCrudService = MedtimeCrudService;
