import { copyFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const frontDir = join(rootDir, "apps", "FrontEnd");
const apiDir = join(rootDir, "apps", "ProjetoRotas");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: "inherit",
      shell: process.platform === "win32"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Falha ao executar: ${command} ${args.join(" ")}`));
    });
  });
}

function copyEnvIfMissing(target, sample) {
  if (!existsSync(target) && existsSync(sample)) {
    copyFileSync(sample, target);
    const targetRel = relative(rootDir, target);
    const sampleRel = relative(rootDir, sample);
    console.log(`Criado ${targetRel} a partir de ${sampleRel}.`);
  }
}

async function main() {
  console.log("Instalando dependencias da API...");
  await run("npm", ["ci", "--prefix", apiDir]);

  console.log("Instalando dependencias do FrontEnd...");
  await run("npm", ["ci", "--legacy-peer-deps", "--prefix", frontDir]);

  copyEnvIfMissing(join(frontDir, ".env.local"), join(frontDir, ".env.example"));
  copyEnvIfMissing(join(apiDir, ".env"), join(apiDir, ".env.example"));

  console.log("\nSetup concluido.");
  console.log("Proximo passo: npm run dev:all");
}

main().catch((error) => {
  console.error(`Erro no setup: ${error.message}`);
  process.exit(1);
});
