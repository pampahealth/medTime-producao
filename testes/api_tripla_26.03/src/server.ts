import { env } from "./config/env.js";
import { app } from "./app.js";

app.listen(env.PORT, () => {
  console.log(`API tripla rodando na porta ${env.PORT}`);
});
