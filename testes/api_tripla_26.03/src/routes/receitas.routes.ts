import { Router } from "express";
import { ReceitasController } from "../controllers/receitas.controller.js";
import { ReceitasRepository } from "../repositories/receitas.repository.js";
import { ReceitasService } from "../services/receitas.service.js";

const router = Router();
const controller = new ReceitasController(new ReceitasService(new ReceitasRepository()));

router.get("/receitas/por-data", (req, res, next) => controller.porData(req, res).catch(next));
router.get("/receitas/por-paciente", (req, res, next) => controller.porNomePaciente(req, res).catch(next));
router.get("/receitas/por-cartao-sus", (req, res, next) => controller.porCartaoSus(req, res).catch(next));

export { router as receitasRoutes };
