import "express-async-errors";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import { routes } from "./routes";
import { errorHandling } from "./middlewares/error-handling";
import { swaggerSpec } from "./configs/swagger";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(routes);
app.use(errorHandling);

export { app };
