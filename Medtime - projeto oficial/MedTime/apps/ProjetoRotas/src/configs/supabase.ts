import { createClient } from "@supabase/supabase-js";
import { AppError } from "@/utils/AppErrors";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new AppError(
    "SUPABASE_URL e SUPABASE_ANON_KEY devem estar definidos no .env (valores em base_do_supabase.sql)",
    500
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SCHEMA = "medtime" as const;

export const TABLES = {
  prefeitura: "a001_prefeitura",
  medico: "a002_medico",
  medicamentos: "a003_medicamentos",
  pacientes: "a004_pacientes",
  receitas: "a005_receitas",
  receita_medicamentos: "a006_receita_medicamentos",
  receita_horarios: "a007_receita_horarios",
  usuario: "a008_usuario",
  paciente_celulares: "a009_paciente_celulares",
  x001: "x001",
  x002: "x002",
} as const;
