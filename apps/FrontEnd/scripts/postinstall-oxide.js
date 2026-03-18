#!/usr/bin/env node
/**
 * Garante que o binding nativo do Tailwind (@tailwindcss/oxide-linux-x64-gnu)
 * seja encontrado pelo @tailwindcss/oxide. O npm às vezes não instala
 * optionalDependencies no top-level; se existir dentro de @tailwindcss/vite,
 * criamos um symlink.
 */
const fs = require("fs");
const path = require("path");

const base = path.join(__dirname, "..", "node_modules", "@tailwindcss");
const targetDir = path.join(base, "oxide-linux-x64-gnu");
const sourceDir = path.join(base, "vite", "node_modules", "@tailwindcss", "oxide-linux-x64-gnu");

if (!fs.existsSync(targetDir) && fs.existsSync(sourceDir)) {
  try {
    fs.symlinkSync(path.relative(base, sourceDir), targetDir);
    console.log("postinstall: symlink @tailwindcss/oxide-linux-x64-gnu criado.");
  } catch (e) {
    console.warn("postinstall: aviso - não foi possível criar symlink oxide:", e.message);
  }
}
