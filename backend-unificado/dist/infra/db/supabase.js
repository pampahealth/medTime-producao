"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.SUPABASE_SCHEMA = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("../config/env");
exports.SUPABASE_SCHEMA = env_1.env.SUPABASE_SCHEMA;
exports.supabase = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_ANON_KEY, {
    db: { schema: env_1.env.SUPABASE_SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false },
});
