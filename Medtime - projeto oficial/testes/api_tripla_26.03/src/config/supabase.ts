import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export const SCHEMA = env.SUPABASE_SCHEMA;

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  db: { schema: env.SUPABASE_SCHEMA },
  auth: { persistSession: false, autoRefreshToken: false }
});
