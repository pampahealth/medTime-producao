import net from "node:net";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const children = [];

function portInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close(() => resolve(false));
    });

    server.listen(port, "0.0.0.0");
  });
}

function runNpmScript(scriptName) {
  const child = spawn("npm", ["run", scriptName, "--prefix", rootDir], {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  children.push(child);
  return child;
}

function cleanupAndExit(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  process.exit(code);
}

async function main() {
  if (await portInUse(3333)) {
    console.error("Erro: porta 3333 ja esta em uso. Encerre a API atual e tente novamente.");
    process.exit(1);
  }
  if (await portInUse(3000)) {
    console.error("Erro: porta 3000 ja esta em uso. Encerre o FrontEnd atual e tente novamente.");
    process.exit(1);
  }

  console.log("Iniciando API (porta 3333)...");
  const api = runNpmScript("dev:api");

  console.log("Iniciando FrontEnd (porta 3000)...");
  const front = runNpmScript("dev:front");

  console.log("\nAplicacao em execucao.");
  console.log("- FrontEnd: http://localhost:3000");
  console.log("- API:      http://localhost:3333");
  console.log("Pressione Ctrl+C para encerrar os dois processos.");

  process.on("SIGINT", () => cleanupAndExit(0));
  process.on("SIGTERM", () => cleanupAndExit(0));

  api.on("exit", (code) => cleanupAndExit(code ?? 0));
  front.on("exit", (code) => cleanupAndExit(code ?? 0));
}

main().catch((error) => {
  console.error(`Erro ao iniciar ambiente: ${error.message}`);
  cleanupAndExit(1);
});
