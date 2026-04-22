"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const supabase_1 = require("../../infra/db/supabase");
const jwt_1 = require("../../infra/auth/jwt");
class SessionService {
    async login(email, password) {
        const { data, error } = await supabase_1.supabase
            .schema(supabase_1.SUPABASE_SCHEMA)
            .from("a008_usuario")
            .select("a008_id, a008_user_email, a008_user_senha, a008_user_tipo")
            .eq("a008_user_email", email)
            .limit(1);
        if (error)
            throw new Error(`Erro ao autenticar: ${error.message}`);
        const row = (data?.[0] ?? null);
        if (!row)
            throw new Error("Credenciais invalidas");
        const senhaBanco = String(row.a008_user_senha ?? "");
        // Compatibilidade: projeto legado armazena senha simples em alguns ambientes.
        const senhaOk = senhaBanco === password;
        if (!senhaOk)
            throw new Error("Credenciais invalidas");
        const token = (0, jwt_1.signToken)({
            sub: String(row.a008_id ?? email),
            email: String(row.a008_user_email ?? email),
            tipo: String(row.a008_user_tipo ?? "user"),
        });
        return {
            token,
            user: {
                id: String(row.a008_id ?? ""),
                email: String(row.a008_user_email ?? email),
                tipo: String(row.a008_user_tipo ?? "user"),
            },
        };
    }
}
exports.SessionService = SessionService;
