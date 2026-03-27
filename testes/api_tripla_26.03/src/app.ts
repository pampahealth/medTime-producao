import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { receitasRoutes } from "./routes/receitas.routes.js";

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", receitasRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Erro interno";
  res.status(500).json({ error: message });
});

export { app };
