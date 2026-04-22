"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_js_1 = require("./config/env.js");
const app_js_1 = require("./app.js");
app_js_1.app.listen(env_js_1.env.PORT, () => {
    console.log(`API tripla rodando na porta ${env_js_1.env.PORT}`);
});
