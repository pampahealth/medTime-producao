"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const env_1 = require("../../infra/config/env");
const jwt_1 = require("../../infra/auth/jwt");
const http_error_1 = require("../../domain/http-error");
function authMiddleware(req, res, next) {
    if (!env_1.env.AUTH_REQUIRED) {
        next();
        return;
    }
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Token ausente" });
        return;
    }
    const token = auth.slice("Bearer ".length);
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = payload;
        next();
    }
    catch {
        next(new http_error_1.HttpError(401, "Token invalido", "AUTH_INVALID_TOKEN"));
    }
}
