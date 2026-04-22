"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const http_error_1 = require("../../domain/http-error");
function errorMiddleware(err, _req, res, _next) {
    if (err instanceof http_error_1.HttpError) {
        res.status(err.status).json({ error: err.message, code: err.code });
        return;
    }
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(500).json({ error: message, code: "INTERNAL_ERROR" });
}
