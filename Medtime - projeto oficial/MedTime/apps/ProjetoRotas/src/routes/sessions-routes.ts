import { Router } from "express";
import { SessionsController } from "@/controllers/sessions-controller";

const sessionsRoutes = Router();
const sessionsController = new SessionsController();

sessionsRoutes.post("/", sessionsController.handle);

export { sessionsRoutes };
