# Projeto Rotas + Front

Monorepo com **FrontEnd** (Next.js) e **ProjetoRotas** (API Express + Supabase) para o sistema MedTime.

## Estrutura

```
.
├── apps/
│   ├── FrontEnd/     # Aplicação Next.js (porta 3000)
│   └── ProjetoRotas/ # API Express (porta 3333)
├── README.md
├── README-SINCRONIZACAO.md
├── .env.example
└── .gitignore
```

Raiz enxuta: só `apps/` (onde ficam as duas aplicações), READMEs e config.

## Quick start (qualquer maquina)

Pre-requisito unico: Node.js + npm instalados.

```bash
npm run setup
npm run dev:all
```

Esse fluxo:
- instala dependencias da API e do FrontEnd com `npm ci`;
- cria automaticamente `apps/FrontEnd/.env.local` e `apps/ProjetoRotas/.env` a partir dos arquivos `.env.example` (se ainda nao existirem);
- sobe API e FrontEnd juntos.

Endpoints locais:
- FrontEnd: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3333](http://localhost:3333)
- Swagger: `http://localhost:3333/api-docs`

## Execucao separada (opcional)

### So FrontEnd

```bash
npm run dev:front
```

### So Backend (ProjetoRotas)

```bash
npm run dev:api
```

### Front + Backend sincronizados (proxy)

1. Em `apps/FrontEnd/.env.local`:
   - `USE_BACKEND_PROXY=true`
   - `API_BACKEND_URL=http://localhost:3333`
2. Rode `npm run dev:all`.

Detalhes extras em [README-SINCRONIZACAO.md](./README-SINCRONIZACAO.md).

## Variáveis de ambiente

- **FrontEnd**: `apps/FrontEnd/.env.example` (PostgREST, auth, proxy).
- **ProjetoRotas**: `apps/ProjetoRotas/.env.example` (Supabase, JWT).

## Documentação

- [Sincronização Front ↔ Backend](./README-SINCRONIZACAO.md)
- FrontEnd: `apps/FrontEnd/README.md`, `apps/FrontEnd/docs/`
- ProjetoRotas: `apps/ProjetoRotas/base_do_supabase.sql` (schema)
