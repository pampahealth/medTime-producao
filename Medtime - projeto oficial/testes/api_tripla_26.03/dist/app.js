"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const mobile_routes_js_1 = require("./routes/mobile.routes.js");
const receitas_routes_js_1 = require("./routes/receitas.routes.js");
const app = (0, express_1.default)();
exports.app = app;
app.disable("x-powered-by");
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" }));
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
app.use("/api", receitas_routes_js_1.receitasRoutes);
app.use("/api", mobile_routes_js_1.mobileRoutes);
app.use((err, _req, res, _next) => {
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(500).json({ error: message });
});
