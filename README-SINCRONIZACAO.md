# Sincronização FrontEnd ↔ ProjetoRotas

Como usar o FrontEnd (Next.js) junto com o backend ProjetoRotas (Express) para testes.

## Visão geral

- **FrontEnd** (`apps/FrontEnd/`): aplicação Next.js que consome a API via `/next_api/*`.
- **ProjetoRotas** (`apps/ProjetoRotas/`): API Express (Supabase) com rotas em `/sessions` e `/medtime/*`.

Com o proxy ativo, as chamadas do front para medicamentos, médicos, pacientes, receitas etc. vão para o ProjetoRotas, com mapeamento automático entre os campos do backend (`a003_nome`, etc.) e os do front (`nome`, `id`, etc.).

---

## Como iniciar o projeto pelo terminal

Sempre inicie **primeiro a API** e **depois o FrontEnd** (em outro terminal).

### 1. Iniciar a API (ProjetoRotas) — backend

**Opção A — Dentro da pasta do backend:**

```bash
cd apps/ProjetoRotas
npm run dev
```

**Opção B — Pela raiz do projeto:**

```bash
npm run dev:api
```

- API disponível em **http://localhost:3333**
- Documentação Swagger: **http://localhost:3333/api-docs**

### 2. Iniciar o FrontEnd (Next.js)

Abra **outro terminal** e execute:

**Opção A — Dentro da pasta do frontend:**

```bash
cd apps/FrontEnd
npm run dev
```

**Opção B — Pela raiz do projeto:**

```bash
npm run dev:front
```

- Frontend disponível em **http://localhost:3000**

### Ordem recomendada

1. Subir a **API** (ProjetoRotas).
2. Subir o **FrontEnd**.
3. Acessar o sistema em **http://localhost:3000**.

### Porta 3333 em uso (Linux)

Se aparecer erro de porta já em uso:

```bash
fuser -k 3333/tcp
```

Depois inicie a API novamente.

---

## Como rodar para testar (primeira vez / setup)

### 1. Backend (ProjetoRotas)

```bash
cd apps/ProjetoRotas
cp .env.example .env
# Ajuste SUPABASE_URL, SUPABASE_ANON_KEY e JWT_SECRET no .env
npm install
npm run dev
```

Servidor em **http://localhost:3333**.

### 2. FrontEnd

```bash
cd apps/FrontEnd
cp .env.example .env
# No .env, defina:
# USE_BACKEND_PROXY=true
# API_BACKEND_URL=http://localhost:3333
npm install --legacy-peer-deps
npm run dev
```

Aplicação em **http://localhost:3000**.

### 3. Variáveis de ambiente (FrontEnd)

| Variável            | Descrição                    | Exemplo                 |
|---------------------|-----------------------------|-------------------------|
| `USE_BACKEND_PROXY` | Ativa o proxy ProjetoRotas  | `true`                  |
| `API_BACKEND_URL`   | URL base do ProjetoRotas    | `http://localhost:3333` |

Com `USE_BACKEND_PROXY=false`, o front usa as rotas próprias do Next.js (PostgREST/auth local).

## Mapeamento de rotas

| FrontEnd (`/next_api/...`) | ProjetoRotas        |
|---------------------------|----------------------|
| `GET/POST /medicamentos`  | `/medtime/medicamentos` |
| `GET/PUT/DELETE /medicamentos?id=:id` | `/medtime/medicamentos/:id` |
| `GET/POST /medicos`       | `/medtime/medico`   |
| `GET/POST /pacientes`     | `/medtime/pacientes` |
| `GET/POST /receitas`      | `/medtime/receitas` |
| `GET/POST /receita-medicamentos` | `/medtime/receita-medicamentos` |
| `GET/POST /receita-horarios` | `/medtime/receita-horarios` |
| `GET/POST /prefeitura`    | `/medtime/prefeitura` |
| `POST /auth/login`        | `POST /sessions`    |

O front envia `id` na query (`?id=...`) ou no path (ex.: `PUT /next_api/pacientes/uuid`); o proxy vira path param no backend (`/recurso/:id`).

## Tabelas do Supabase alteráveis pelo projeto

Com o proxy ativo (`USE_BACKEND_PROXY=true`), **todas** as tabelas do schema `medtime` no Supabase podem ser alteradas (CRUD) via API e pelo FrontEnd:

| Tabela (Supabase)           | Recurso no front (`/next_api/...`) | Backend (`/medtime/...`)     |
|----------------------------|------------------------------------|-----------------------------|
| a001_prefeitura            | prefeitura                         | prefeitura                  |
| a002_medico                | medicos                            | medico                      |
| a003_medicamentos          | medicamentos                       | medicamentos                |
| a004_pacientes             | pacientes                          | pacientes                   |
| a005_receitas              | receitas                           | receitas                    |
| a006_receita_medicamentos   | receita-medicamentos               | receita-medicamentos        |
| a007_receita_horarios      | receita-horarios                   | receita-horarios            |
| a008_usuario               | usuario                            | usuario                     |
| x001                       | x001                               | x001                        |
| x002                       | x002                               | x002                        |

Os recursos **usuario**, **x001** e **x002** têm mapeamento de campos (ex.: front `email` ↔ backend `a008_user_email`). A senha do usuario nunca é devolvida pela API.

## Login

Com proxy ativo, `POST /next_api/auth/login` é encaminhado para `POST /sessions` do ProjetoRotas. A resposta `{ token, user }` define o cookie de autenticação no front (accessToken/refreshToken).

## Observações

- ProjetoRotas usa **UUID** para ids; o proxy devolve como string. O front pode exibir e reenviar normalmente.
- O backend exige `a003_imagem_base64` em medicamentos; quando o front manda `imagem_url` vazio, o proxy envia um placeholder.
- Rotas que não existem no ProjetoRotas (ex.: `agendamentos`, `paciente-celulares`) continuam nas rotas do Next.js; com proxy ativo, só os recursos da tabela acima vão para o ProjetoRotas.
