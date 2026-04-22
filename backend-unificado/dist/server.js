"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./infra/config/env");
app_1.app.listen(env_1.env.PORT, () => {
    console.log(`Backend unificado rodando na porta ${env_1.env.PORT}`);
});
