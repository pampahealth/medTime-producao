"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.SCHEMA = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_js_1 = require("./env.js");
exports.SCHEMA = env_js_1.env.SUPABASE_SCHEMA;
exports.supabase = (0, supabase_js_1.createClient)(env_js_1.env.SUPABASE_URL, env_js_1.env.SUPABASE_ANON_KEY, {
    db: { schema: env_js_1.env.SUPABASE_SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false }
});
