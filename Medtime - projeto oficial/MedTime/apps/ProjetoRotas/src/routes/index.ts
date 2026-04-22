import { Router } from "express";
import { sessionsRoutes } from "./sessions-routes";
import { medtimeRoutes } from "./medtime-routes";

const routes = Router();

routes.use("/sessions", sessionsRoutes);
routes.use("/medtime", medtimeRoutes);

export { routes };
