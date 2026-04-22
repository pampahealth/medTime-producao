# Entidades do Banco de Dados (MedTime)

Este documento descreve, de forma **didática e detalhada**, as entidades (tabelas) usadas no projeto.

O repositório contém **dois “modelos” de banco**:

- **Modelo A — Supabase/ProjetoRotas (schema `medtime`, IDs UUID, colunas `a00x_*`)**  
  Fonte principal: `apps/ProjetoRotas/base_do_supabase.sql`
- **Modelo B — PostgREST/local (tabelas “legíveis”, IDs BIGSERIAL)**  
  Fonte principal: `apps/FrontEnd/docs/database/schema_postgrest.sql` e `apps/FrontEnd/docs/DATABASE-SCRIPTS.sql`

Na prática, o FrontEnd conversa com `/next_api/...`, que pode “projetar” dados do Modelo A para nomes amigáveis; então é normal você ver:

- No **banco**: `a005_receitas.a005_data_receita`  
- No **FrontEnd**: `receitas.data_receita`

---

## Modelo A — Supabase/ProjetoRotas (schema `medtime`)

### `medtime.a001_prefeitura` (Prefeituras)
Armazena a prefeitura/município ao qual dados do sistema pertencem (multi-tenant).

- **`a001_id_prefeitura`**: `UUID` *(PK, default `gen_random_uuid()`)*  
  Identificador único da prefeitura.
- **`a001_cnpj`**: `VARCHAR(80)` *(NOT NULL)*  
  CNPJ (no script base está como texto; validação pode ser aplicada via CHECK se desejar).
- **`a001_apelido`**: `VARCHAR(30)` *(NOT NULL, default `'Android'`)*  
  Nome curto/apelido usado para exibição.

**Relacionamentos**
- Referenciada por: `a003_medicamentos`, `a004_pacientes`, `a005_receitas`, `a006_receita_medicamentos`, `a007_receita_horarios`.

---

### `medtime.a002_medico` (Médicos)
Cadastro de médicos/prescritores.

- **`a002_id_medico`**: `UUID` *(PK, default `gen_random_uuid()`)*  
- **`a002_nome_medico`**: `VARCHAR(80)` *(NOT NULL)*  
- **`a002_crm`**: `VARCHAR(10)` *(NOT NULL, UNIQUE)*  

**Relacionamentos**
- Referenciado por: `a005_receitas.a005_id_medico` (opcional).

---

### `medtime.a003_medicamentos` (Medicamentos)
Catálogo de medicamentos.

- **`a003_id_medicamento`**: `UUID` *(PK, default `gen_random_uuid()`)*  
- **`a003_nome`**: `VARCHAR(200)` *(NOT NULL)*  
- **`a003_imagem_base64`**: `TEXT` *(NOT NULL)*  
  No projeto, isso é usado como “imagem_url” no front, mas no banco é um texto (frequentemente base64).
- **`a003_ativo`**: `BOOLEAN` *(NOT NULL, default `TRUE`)*  
- **`a003_created_at`**: `TIMESTAMPTZ` *(NOT NULL, default `now()`)*  
- **`a003_updated_at`**: `TIMESTAMPTZ` *(NOT NULL, default `now()`)*  
- **`a003_id_prefeitura`**: `UUID` *(NOT NULL, FK → `a001_prefeitura`, ON DELETE CASCADE)*  

**Índices**
- `ix_medicamentos_nome` em `a003_nome` (melhora busca por nome).

**Triggers**
- `trg_a003_medicamentos_updated_at` chama `medtime.fn_set_updated_at()` para manter `a003_updated_at`.

---

### `medtime.a004_pacientes` (Pacientes)
Cadastro de pacientes.

- **`a004_id_paciente`**: `UUID` *(PK, default `gen_random_uuid()`)*  
- **`a004_cartao_sus`**: `VARCHAR(20)` *(NOT NULL, UNIQUE, CHECK só números)*  
- **`a004_nome`**: `VARCHAR(200)` *(NOT NULL)*  
- **`a004_celular`**: `VARCHAR(20)` *(NULL)*  
- **`a004_cpf`**: `VARCHAR(11)` *(NULL)*  
- **`a004_data_nascimento`**: `DATE` *(NULL)*  
- **`a004_ativo`**: `BOOLEAN` *(NOT NULL, default `TRUE`)*  
- **`a004_app_instalado`**: `CHAR(1)` *(NOT NULL, default `'N'`, CHECK `'S'|'N'`)*  
  No FrontEnd normalmente é tratado como booleano.
- **`a004_created_at`**: `TIMESTAMPTZ` *(NOT NULL, default `now()`)*  
- **`a004_id_prefeitura`**: `UUID` *(NOT NULL, FK → `a001_prefeitura`, ON DELETE CASCADE)*  

**Observação**
- O script `base_do_supabase.sql` inclui `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para colunas opcionais, para facilitar evolução do schema.

---

### `medtime.a005_receitas` (Receitas)
Cabeçalho da receita (prescrição).

- **`a005_id_receita`**: `UUID` *(PK, default `gen_random_uuid()`)*  
- **`a005_id_paciente`**: `UUID` *(NOT NULL, FK → `a004_pacientes`, ON DELETE CASCADE)*  
- **`a005_id_medico`**: `UUID` *(NULL, FK → `a002_medico`, ON DELETE SET NULL)*  
- **`a005_data_receita`**: `DATE` *(NOT NULL)*  
- **`a005_data_registro`**: `DATE` *(NULL)*  
- **`a005_origem_receita`**: `VARCHAR(80)` *(NULL)*  
- **`a005_subgrupo_origem`**: `VARCHAR(80)` *(NULL)*  
- **`a005_observacao`**: `TEXT` *(NULL)*  
- **`a005_tipo_prescritor`**: `VARCHAR(30)` *(NULL)*  
- **`a005_num_notificacao`**: `VARCHAR(40)` *(NULL)*  
- **`a005_pronta_envio`**: `BOOLEAN` *(NOT NULL, default `FALSE`)*  
  Flag de workflow: indica que o usuário marcou a receita como “pronta para envio”.
- **`a005_codigo_envio`**: `VARCHAR(80)` *(NULL)*  
  Código único vinculado à receita quando marcada como “pronta para envio”.
- **`a005_created_at`**: `TIMESTAMPTZ` *(NOT NULL, default `now()`)*  
- **`a005_id_prefeitura`**: `UUID` *(NOT NULL, FK → `a001_prefeitura`, ON DELETE CASCADE)*  

**Índices recomendados (no projeto já existe)**
- `ux_a005_receitas_codigo_envio` *(UNIQUE parcial)*: garante unicidade quando `a005_codigo_envio` não é nulo.

---

### `medtime.a006_receita_medicamentos` (Itens da receita)
Itens/linhas da receita: cada medicamento prescrito dentro de uma receita.

- **`a006_id_rm`**: `UUID` *(PK, default `gen_random_uuid()`)*  
- **`a006_id_receita`**: `UUID` *(NOT NULL, FK → `a005_receitas`, ON DELETE CASCADE)*  
- **`a006_id_medicamento`**: `UUID` *(NOT NULL, FK → `a003_medicamentos`, ON DELETE CASCADE)*  
- **`a006_quantidade_total`**: `NUMERIC(18,3)` *(NULL)*  
- **`a006_frequencia_dia`**: `INT` *(NULL, CHECK >= 1 quando não nulo)*  
- **`a006_duracao_dias`**: `INT` *(NULL, CHECK >= 1 quando não nulo)*  
- **`a006_observacao`**: `TEXT` *(NULL)*  
- **`a006_created_at`**: `TIMESTAMPTZ` *(NOT NULL, default `now()`)*  
- **`a006_id_prefeitura`**: `UUID` *(NOT NULL, FK → `a001_prefeitura`, ON DELETE CASCADE)*  

---

### `medtime.a007_receita_horarios` (Horários/Disparos)
Armazena os disparos (horários agendados) vinculados a cada item (`a006_id_rm`).

- **`a007_id_horario`**: `UUID` *(PK, default `gen_random_uuid()`)*  
- **`a007_id_rm`**: `UUID` *(NOT NULL, FK → `a006_receita_medicamentos`, ON DELETE CASCADE)*  
- **`a007_id_prefeitura`**: `UUID` *(NOT NULL, FK → `a001_prefeitura`, ON DELETE CASCADE)*  
- **`a007_data_hora_disparo`**: `TIMESTAMPTZ` *(NOT NULL)*  
  Data/hora exata do disparo (permite agendamentos por dia/horário).
- **`a007_data_hora_desligado`**: `TIMESTAMPTZ` *(NULL)*  
  Data/hora em que o evento foi “desligado”/finalizado (quando aplicável).
- **`a007_tomou`**: `BOOLEAN` *(NULL)*  
- **`a007_sms_enviado`**: `BOOLEAN` *(NOT NULL, default `FALSE`)*  
- **`a007_data_sms`**: `TIMESTAMPTZ` *(NULL)*  
- **`a007_tentativas`**: `INT` *(NOT NULL, default `0`, CHECK >= 0)*  
- **`a007_created_at`**: `TIMESTAMPTZ` *(NOT NULL, default `now()`)*  

---

### `medtime.a008_usuario` (Usuários)
Tabela simples de usuários do módulo `medtime` (não confundir com auth de outras partes do projeto).

- **`a008_id`**: `UUID` *(PK, default `gen_random_uuid()`)*  
- **`a008_user_email`**: `VARCHAR(80)` *(NOT NULL)*  
- **`a008_user_senha`**: `VARCHAR(80)` *(NOT NULL)*  
- **`a008_user_tipo`**: `VARCHAR(80)` *(NOT NULL)*  

---

### `medtime.x001` e `medtime.x002` (Tabelas auxiliares)
Tabelas genéricas de parametrização/cadastros auxiliares.

Campos de ambas:
- **`*_id`**: `UUID` *(PK, default `gen_random_uuid()`)*  
- **`*_codigo`**: `VARCHAR(50)` *(NULL)*  
- **`*_nome`**: `VARCHAR(50)` *(NULL)*  
- **`*_valor`**: `VARCHAR(50)` *(NULL)*  
- **`*_descricao`**: `VARCHAR(50)` *(NULL)*  

---

## Modelo B — PostgREST/local (tabelas “legíveis”)

Este modelo aparece nos scripts do FrontEnd e usa tabelas como `receitas`, `pacientes`, `receita_medicamentos` etc., normalmente com `id BIGSERIAL`.
Ele é útil para ambientes locais/legados e documentação, mas **não é idêntico** ao modelo `medtime.*` (por exemplo, alguns campos podem existir aqui e não no outro, e vice-versa).

As entidades/tabelas principais que aparecem no `schema_postgrest.sql` são:

- `prefeituras`
- `pacientes`
- `paciente_celulares`
- `medicamentos`
- `medicos`
- `receitas`
- `receita_medicamentos`
- `receita_horarios`
- `dispositivos`
- `interacoes_medicamentosas`
- `historico_medicamentos`
- `conflitos_horario`
- `agendamentos`
- `user_profiles`
- views: `vw_agendamento_medicamentos`, `vw_pacientes_completo`, `vw_receitas_ativas`, materialized view `vw_pivot_receitas`

> Se você quiser, eu posso gerar uma **segunda seção** com o detalhamento coluna-a-coluna desse Modelo B também (ele é bem grande), mas o foco do sistema hoje (ProjetoRotas + Supabase) é o **Modelo A**.

---

## Mapeamento (resumo) — Modelo A → nomes do FrontEnd

Exemplos importantes:

- **`medtime.a005_receitas` → `receitas`**
  - `a005_id_receita` → `id`
  - `a005_id_paciente` → `id_paciente`
  - `a005_id_medico` → `id_medico`
  - `a005_data_receita` → `data_receita`
  - `a005_data_registro` → `data_registro`
  - `a005_origem_receita` → `origem_receita`
  - `a005_subgrupo_origem` → `subgrupo_origem`
  - `a005_observacao` → `observacao`
  - `a005_tipo_prescritor` → `tipo_prescritor`
  - `a005_num_notificacao` → `num_notificacao`
  - `a005_pronta_envio` → `pronta_envio`
  - `a005_codigo_envio` → `codigo_envio`

Esse mapeamento é implementado no arquivo `apps/FrontEnd/src/lib/backend-proxy.ts`.

