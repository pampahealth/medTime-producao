"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const routes_1 = require("./http/routes");
const error_middleware_1 = require("./http/middlewares/error.middleware");
exports.app = (0, express_1.default)();
exports.app.disable("x-powered-by");
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json({ limit: "50mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" }));
exports.app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "backend-unificado" });
});
exports.app.use(routes_1.appRoutes);
exports.app.use((_req, res) => {
    res.status(404).json({ error: "Rota nao encontrada", code: "NOT_FOUND" });
});
exports.app.use(error_middleware_1.errorMiddleware);
