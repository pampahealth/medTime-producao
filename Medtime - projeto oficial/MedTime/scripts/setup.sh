#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONT_DIR="$ROOT_DIR/apps/FrontEnd"
API_DIR="$ROOT_DIR/apps/ProjetoRotas"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Erro: comando '$1' nao encontrado no PATH."
    exit 1
  fi
}

copy_env_if_missing() {
  local target="$1"
  local sample="$2"
  local target_rel="${target#"$ROOT_DIR"/}"
  local sample_rel="${sample#"$ROOT_DIR"/}"

  if [[ ! -f "$target" && -f "$sample" ]]; then
    cp "$sample" "$target"
    echo "Criado $target_rel a partir de $sample_rel."
  fi
}

require_command node
require_command npm

echo "Instalando dependencias da API..."
npm ci --prefix "$API_DIR"

echo "Instalando dependencias do FrontEnd..."
npm ci --legacy-peer-deps --prefix "$FRONT_DIR"

copy_env_if_missing "$FRONT_DIR/.env.local" "$FRONT_DIR/.env.example"
copy_env_if_missing "$API_DIR/.env" "$API_DIR/.env.example"

echo
echo "Setup concluido."
echo "Proximo passo: npm run dev:all"
