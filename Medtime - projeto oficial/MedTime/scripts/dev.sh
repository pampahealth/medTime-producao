#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

port_in_use() {
  local port="$1"
  while IFS= read -r line; do
    case "$line" in
      *":$port "*|*":$port")
        return 0
        ;;
    esac
  done < <(ss -ltn)
  return 1
}

cleanup() {
  trap - EXIT INT TERM
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" >/dev/null 2>&1; then
    kill "$API_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${FRONT_PID:-}" ]] && kill -0 "$FRONT_PID" >/dev/null 2>&1; then
    kill "$FRONT_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

if port_in_use 3333; then
  echo "Erro: porta 3333 ja esta em uso. Encerre o processo atual da API e tente novamente."
  exit 1
fi

if port_in_use 3000; then
  echo "Erro: porta 3000 ja esta em uso. Encerre o processo atual do FrontEnd e tente novamente."
  exit 1
fi

echo "Iniciando API (porta 3333)..."
npm run dev:api --prefix "$ROOT_DIR" &
API_PID=$!

echo "Iniciando FrontEnd (porta 3000)..."
npm run dev:front --prefix "$ROOT_DIR" &
FRONT_PID=$!

echo
echo "Aplicacao em execucao."
echo "- FrontEnd: http://localhost:3000"
echo "- API:      http://localhost:3333"
echo "Pressione Ctrl+C para encerrar os dois processos."

wait -n "$API_PID" "$FRONT_PID"
