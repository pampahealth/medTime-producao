# MedTime+app Monorepo

Monorepo com tres frentes do projeto MedTime:

- `backend-unificado/`: backend principal unificado (Express + Supabase).
- `MedTime/`: web (Next.js) e legado parcial.
- `api-buscas/`: API legada de integracao (em transicao).
- `mobile/`: aplicativo Android.

## Estrutura

```text
MedTime+app/
├── README.md
├── docs/
│   ├── setup/
│   │   ├── linux.md
│   │   ├── windows.md
│   │   └── macos.md
│   ├── arquitetura/
│   │   └── visao-geral.md
│   └── operacao/
│       └── troubleshooting.md
├── MedTime/
├── backend-unificado/
├── api-buscas/
└── mobile/
```

## Requisitos

- Git
- Node.js 20 LTS (recomendado)
- npm 10+
- Java 17 (para Android)
- Android Studio (para `mobile/`)
- Python 3.10+ (para `testes/api_tripla_26.03/viewer_api_tripla.py`)

## Setup rapido

1. Clone o repositorio e entre na pasta raiz.
2. Copie os templates `.env.example` conforme a documentacao abaixo.
3. Instale as dependencias por app.
4. Rode cada modulo conforme necessidade.

Detalhes por sistema operacional:

- [Linux](./docs/setup/linux.md)
- [Windows](./docs/setup/windows.md)
- [macOS](./docs/setup/macos.md)

## Comandos principais

### Web + API interna (`MedTime/`)

```bash
cd MedTime
npm run install:all
npm run dev:api
npm run dev:front
```

### API de integracao (`testes/api_tripla_26.03/`)

```bash
cd backend-unificado
npm install
npm run dev
```

### Android (`mobile/`)

Linux/macOS:

```bash
cd mobile
./gradlew assembleDebug
```

Windows (PowerShell):

```powershell
cd mobile
.\gradlew.bat assembleDebug
```

## Variaveis de ambiente (matriz)

| Modulo | Arquivo modelo | Objetivo |
|---|---|---|
| Monorepo raiz | `.env.example` | Referencia consolidada de variaveis comuns |
| Web | `MedTime/apps/FrontEnd/.env.example` | PostgREST/auth/proxy |
| API ProjetoRotas | `MedTime/apps/ProjetoRotas/.env.example` | Supabase/JWT/API |
| Backend unificado | `backend-unificado/.env.example` | Porta, Supabase, JWT e auth |
| API Integracao legado | `api-buscas/.env.example` | Porta, Supabase e compatibilidade antiga |

## Documentacao

- Arquitetura geral: [`docs/arquitetura/visao-geral.md`](./docs/arquitetura/visao-geral.md)
- Troubleshooting e operacao: [`docs/operacao/troubleshooting.md`](./docs/operacao/troubleshooting.md)
- Guia por SO: [`docs/setup/`](./docs/setup/)

Documentacao legada detalhada do modulo `MedTime`:

- [`MedTime/CODE_REVIEW.md`](./MedTime/CODE_REVIEW.md)
- [`MedTime/DATABASE_ENTIDADES.md`](./MedTime/DATABASE_ENTIDADES.md)

