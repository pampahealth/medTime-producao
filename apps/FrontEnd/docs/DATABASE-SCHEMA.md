
# Documentação do Esquema de Banco de Dados - MedTime

## Visão Geral

Este documento descreve todas as tabelas do sistema MedTime, um sistema de gerenciamento de medicamentos e receitas médicas para pacientes do SUS. O sistema permite o controle de prescrições, horários de medicação, alertas e acompanhamento de pacientes.

---

## Índice

1. [Tabelas de Autenticação](#tabelas-de-autenticação)
2. [Tabelas de Cadastros Básicos](#tabelas-de-cadastros-básicos)
3. [Tabelas de Receitas e Medicamentos](#tabelas-de-receitas-e-medicamentos)
4. [Tabelas de Controle e Monitoramento](#tabelas-de-controle-e-monitoramento)
5. [Tabelas de Histórico](#tabelas-de-histórico)

---

## Tabelas de Autenticação

### 1. `users`

**Objetivo**: Armazena os dados de autenticação dos usuários do sistema.

**Chave Primária**: `id`

**Chaves Estrangeiras**: Nenhuma

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único do usuário |
| `email` | varchar(255) | Email do usuário (único) |
| `password` | varchar(255) | Senha criptografada |
| `role` | varchar(255) | Papel do usuário no sistema (user ou admin) |
| `created_at` | timestamp | Data de criação do registro |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Unique em `email`

---

### 2. `sessions`

**Objetivo**: Gerencia as sessões ativas dos usuários no sistema.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `user_id` → `users.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único da sessão |
| `user_id` | bigint | Referência ao usuário |
| `ip` | varchar(255) | Endereço IP da sessão |
| `user_agent` | varchar(255) | Informações do navegador/dispositivo |
| `created_at` | timestamp | Data de criação da sessão |
| `updated_at` | timestamp | Data da última atualização |
| `refresh_at` | timestamp | Data do último refresh do token |

---

### 3. `refresh_tokens`

**Objetivo**: Armazena tokens de refresh para renovação de sessões.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `user_id` → `users.id`
- `session_id` → `sessions.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único do token |
| `user_id` | bigint | Referência ao usuário |
| `token` | text | Token de refresh criptografado |
| `session_id` | bigint | Referência à sessão |
| `revoked` | boolean | Indica se o token foi revogado |
| `expires_at` | timestamp | Data de expiração do token |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

---

### 4. `user_passcode`

**Objetivo**: Armazena códigos de verificação temporários para autenticação e recuperação de senha.

**Chave Primária**: `id`

**Chaves Estrangeiras**: Nenhuma

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `passcode` | varchar(255) | Código de verificação |
| `passcode_type` | varchar(255) | Tipo do código (EMAIL, SMS, etc) |
| `pass_object` | varchar(255) | Email ou telefone associado |
| `valid_until` | timestamp | Data de expiração (3 minutos) |
| `retry_count` | integer | Número de tentativas de uso |
| `revoked` | boolean | Indica se foi revogado |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Index em `pass_object`

---

## Tabelas de Cadastros Básicos

### 5. `user_profiles`

**Objetivo**: Armazena informações detalhadas do perfil dos usuários do sistema.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `user_id` → `users.id`
- `id_prefeitura` → `prefeituras.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `user_id` | bigint | Referência ao usuário (único) |
| `nome_completo` | varchar(200) | Nome completo do usuário |
| `tipo_usuario` | varchar(50) | Tipo: paciente, profissional_saude, acs, gestor_municipal, admin |
| `id_prefeitura` | bigint | Referência à prefeitura |
| `unidade_saude` | varchar(200) | Nome da unidade de saúde |
| `cargo` | varchar(100) | Cargo do profissional |
| `telefone` | varchar(20) | Telefone de contato |
| `avatar_url` | text | URL da foto de perfil |
| `preferencias_notificacao` | jsonb | Preferências de notificação (JSON) |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Unique em `user_id`
- Index em `tipo_usuario`
- Index em `id_prefeitura`

---

### 6. `prefeituras`

**Objetivo**: Cadastro das prefeituras/municípios que utilizam o sistema.

**Chave Primária**: `id`

**Chaves Estrangeiras**: Nenhuma

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `nome` | varchar(200) | Nome oficial da prefeitura |
| `cnpj` | varchar(18) | CNPJ da prefeitura (único) |
| `apelido` | varchar(100) | Nome curto/apelido |
| `ativo` | boolean | Indica se está ativa |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Unique em `cnpj`
- Index em `ativo`

---

### 7. `pacientes`

**Objetivo**: Cadastro dos pacientes do sistema SUS.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `user_id` → `users.id`
- `id_prefeitura` → `prefeituras.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `user_id` | bigint | Referência ao usuário |
| `id_prefeitura` | bigint | Referência à prefeitura |
| `cartao_sus` | varchar(20) | Número do cartão SUS (apenas números) |
| `cpf` | varchar(11) | CPF do paciente (11 dígitos) |
| `nome` | varchar(200) | Nome completo do paciente |
| `data_nascimento` | date | Data de nascimento |
| `celular` | varchar(20) | Número de celular |
| `celular_validado` | boolean | Indica se o celular foi validado |
| `app_instalado` | boolean | Indica se o app está instalado |
| `consentimento_lgpd` | boolean | Consentimento LGPD |
| `data_consentimento` | timestamp | Data do consentimento |
| `versao_termo_consentimento` | varchar(20) | Versão do termo aceito |
| `ativo` | boolean | Indica se está ativo |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Index em `user_id`
- Index em `id_prefeitura`
- Index em `cartao_sus`
- Index em `cpf`
- Index em `celular`

**Validações**:
- `cartao_sus`: apenas números
- `cpf`: 11 dígitos numéricos

---

### 8. `paciente_celulares`

**Objetivo**: Cadastro dos aparelhos celulares vinculados aos pacientes.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `user_id` → `users.id`
- `id_paciente` → `pacientes.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `user_id` | bigint | Referência ao usuário |
| `id_paciente` | bigint | Referência ao paciente |
| `modelo` | varchar(100) | Modelo do celular |
| `marca` | varchar(100) | Marca do celular |
| `numero_serie` | varchar(100) | Número de série do aparelho |
| `numero_contato` | varchar(20) | Número de telefone |
| `tipo_celular` | varchar(20) | Tipo: 'proprio' ou 'cuidador' |
| `nome_cuidador` | varchar(200) | Nome do cuidador (se aplicável) |
| `ativo` | boolean | Indica se está ativo |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Index em `user_id`
- Index em `id_paciente`
- Index em `numero_contato`
- Index em `tipo_celular`

**Validações**:
- `tipo_celular`: 'proprio' ou 'cuidador'

---

### 9. `medicos`

**Objetivo**: Cadastro dos médicos prescritores.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `user_id` → `users.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `user_id` | bigint | Referência ao usuário |
| `nome` | varchar(200) | Nome completo do médico |
| `crm` | varchar(20) | Número do CRM (apenas números) |
| `especialidade` | varchar(100) | Especialidade médica |
| `ativo` | boolean | Indica se está ativo |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Index em `user_id`
- Index em `crm`
- Index em `ativo`

**Validações**:
- `crm`: apenas números

---

### 10. `medicamentos`

**Objetivo**: Cadastro dos medicamentos disponíveis no sistema.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `id_prefeitura` → `prefeituras.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `id_prefeitura` | bigint | Referência à prefeitura |
| `nome` | varchar(200) | Nome comercial do medicamento |
| `descricao` | text | Descrição detalhada |
| `imagem_url` | text | URL da imagem do medicamento |
| `principio_ativo` | varchar(200) | Princípio ativo |
| `concentracao` | varchar(100) | Concentração (ex: 500mg) |
| `forma_farmaceutica` | varchar(100) | Forma: comprimido, cápsula, etc |
| `ativo` | boolean | Indica se está ativo |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Index em `id_prefeitura`
- Index em `nome`
- Index em `ativo`

---

## Tabelas de Receitas e Medicamentos

### 11. `receitas`

**Objetivo**: Armazena as receitas médicas prescritas aos pacientes.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `user_id` → `users.id`
- `id_paciente` → `pacientes.id`
- `id_prefeitura` → `prefeituras.id`
- `id_medico` → `medicos.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `user_id` | bigint | Referência ao usuário |
| `id_paciente` | bigint | Referência ao paciente |
| `id_prefeitura` | bigint | Referência à prefeitura |
| `id_medico` | bigint | Referência ao médico prescritor |
| `data_receita` | date | Data da prescrição |
| `data_registro` | timestamp | Data de registro no sistema |
| `origem_receita` | varchar(80) | Origem da receita |
| `subgrupo_origem` | varchar(80) | Subgrupo de origem |
| `observacao` | text | Observações gerais |
| `tipo_prescritor` | varchar(30) | Tipo do prescritor |
| `num_notificacao` | varchar(40) | Número de notificação |
| `status` | varchar(20) | Status: 'ativa', 'concluida', 'cancelada' |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Index em `user_id`
- Index em `id_paciente`
- Index em `id_prefeitura`
- Index em `data_receita`
- Index em `status`
- Index em `id_medico`

**Validações**:
- `status`: 'ativa', 'concluida' ou 'cancelada'

---

### 12. `receita_medicamentos`

**Objetivo**: Relaciona os medicamentos prescritos em cada receita com suas dosagens e instruções.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `user_id` → `users.id`
- `id_receita` → `receitas.id`
- `id_medicamento` → `medicamentos.id`
- `id_prefeitura` → `prefeituras.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `user_id` | bigint | Referência ao usuário |
| `id_receita` | bigint | Referência à receita |
| `id_medicamento` | bigint | Referência ao medicamento |
| `id_prefeitura` | bigint | Referência à prefeitura |
| `quantidade_total` | numeric(18,3) | Quantidade total prescrita |
| `quantidade_minima_calculada` | numeric(18,3) | Quantidade mínima calculada |
| `frequencia_dia` | integer | Frequência por dia (≥1) |
| `duracao_dias` | integer | Duração do tratamento em dias (≥1) |
| `dias_dispensar` | integer | Dias para dispensação |
| `observacao` | text | Observações específicas |
| `posologia` | text | Instruções de uso |
| `via_administracao` | varchar(50) | Via de administração |
| `status` | varchar(20) | Status: 'ativo', 'concluido', 'cancelado' |
| `data_inicio` | date | Data de início do tratamento |
| `data_fim` | date | Data de término do tratamento |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Index em `user_id`
- Index em `id_receita`
- Index em `id_medicamento`
- Index em `status`

**Validações**:
- `frequencia_dia`: ≥1
- `duracao_dias`: ≥1
- `status`: 'ativo', 'concluido' ou 'cancelado'

---

### 13. `receita_horarios`

**Objetivo**: Define os horários específicos para tomada de cada medicamento.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `user_id` → `users.id`
- `id_receita_medicamento` → `receita_medicamentos.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `user_id` | bigint | Referência ao usuário |
| `id_receita_medicamento` | bigint | Referência ao medicamento da receita |
| `horario` | time | Horário da tomada |
| `data_inicio` | date | Data de início |
| `data_fim` | date | Data de término |
| `domingo` | boolean | Tomar aos domingos |
| `segunda` | boolean | Tomar às segundas |
| `terca` | boolean | Tomar às terças |
| `quarta` | boolean | Tomar às quartas |
| `quinta` | boolean | Tomar às quintas |
| `sexta` | boolean | Tomar às sextas |
| `sabado` | boolean | Tomar aos sábados |
| `observacao` | text | Observações do horário |
| `dias_semana` | varchar(20) | Dias da semana (legado) |
| `ativo` | boolean | Indica se está ativo |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Index em `user_id`
- Index em `id_receita_medicamento`
- Index em `horario`
- Index composto em `data_inicio, data_fim`
- Index composto em `user_id, horario` (apenas ativos)

---

## Tabelas de Controle e Monitoramento

### 14. `dispositivos`

**Objetivo**: Gerencia os dispositivos móveis dos pacientes para envio de notificações.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `user_id` → `users.id`
- `id_paciente` → `pacientes.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `user_id` | bigint | Referência ao usuário |
| `id_paciente` | bigint | Referência ao paciente |
| `device_id` | varchar(255) | ID único do dispositivo |
| `device_name` | varchar(100) | Nome do dispositivo |
| `platform` | varchar(20) | Plataforma: 'android' ou 'ios' |
| `app_version` | varchar(20) | Versão do aplicativo |
| `os_version` | varchar(20) | Versão do sistema operacional |
| `ultima_sincronizacao` | timestamp | Data da última sincronização |
| `token_push` | text | Token para notificações push |
| `ativo` | boolean | Indica se está ativo |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Unique em `device_id`
- Index em `user_id`
- Index em `id_paciente`

**Validações**:
- `platform`: 'android' ou 'ios'

---

### 15. `conflitos_horario`

**Objetivo**: Registra conflitos de horários entre medicamentos que não devem ser tomados juntos.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `user_id` → `users.id`
- `id_paciente` → `pacientes.id`
- `id_horario_1` → `receita_horarios.id`
- `id_horario_2` → `receita_horarios.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `user_id` | bigint | Referência ao usuário |
| `id_paciente` | bigint | Referência ao paciente |
| `id_horario_1` | bigint | Primeiro horário em conflito |
| `id_horario_2` | bigint | Segundo horário em conflito |
| `data_conflito` | date | Data do conflito |
| `horario_conflito` | time | Horário do conflito |
| `severidade` | varchar(20) | Severidade: 'leve', 'moderada', 'grave' |
| `resolvido` | boolean | Indica se foi resolvido |
| `observacao` | text | Observações sobre o conflito |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Index em `user_id`
- Index em `id_paciente`
- Index em `data_conflito`
- Index em `resolvido`

**Validações**:
- `severidade`: 'leve', 'moderada' ou 'grave'

---

### 16. `interacoes_medicamentosas`

**Objetivo**: Cadastro de interações conhecidas entre medicamentos.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `id_medicamento_1` → `medicamentos.id`
- `id_medicamento_2` → `medicamentos.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `id_medicamento_1` | bigint | Primeiro medicamento |
| `id_medicamento_2` | bigint | Segundo medicamento |
| `severidade` | varchar(20) | Severidade: 'leve', 'moderada', 'grave' |
| `descricao` | text | Descrição da interação |
| `recomendacao` | text | Recomendações |
| `ativo` | boolean | Indica se está ativo |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Índices**:
- Unique composto em `id_medicamento_1, id_medicamento_2`
- Index em `id_medicamento_1`
- Index em `id_medicamento_2`
- Index em `severidade`

**Validações**:
- `severidade`: 'leve', 'moderada' ou 'grave'

---

## Tabelas de Histórico

### 17. `historico_medicamentos`

**Objetivo**: Registra todas as alterações realizadas nos cadastros de medicamentos.

**Chave Primária**: `id`

**Chaves Estrangeiras**: 
- `id_medicamento` → `medicamentos.id`
- `id_prefeitura` → `prefeituras.id`
- `alterado_por` → `users.id`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Identificador único |
| `id_medicamento` | bigint | Referência ao medicamento |
| `id_prefeitura` | bigint | Referência à prefeitura |
| `nome_anterior` | varchar(200) | Nome anterior do medicamento |
| `nome_novo` | varchar(200) | Nome novo do medicamento |
| `campo_alterado` | varchar(100) | Campo que foi alterado |
| `valor_anterior` | text | Valor anterior do campo |
| `valor_novo` | text | Valor novo do campo |
| `alterado_por` | bigint | Usuário que fez a alteração |
| `created_at` | timestamp | Data da alteração |

**Índices**:
- Index em `id_medicamento`
- Index em `created_at`

---

## Relacionamentos Principais

### Hierarquia de Entidades

```
prefeituras
    ├── medicamentos
    ├── pacientes
    │   ├── paciente_celulares
    │   ├── dispositivos
    │   └── receitas
    │       └── receita_medicamentos
    │           └── receita_horarios
    └── user_profiles

users
    ├── user_profiles
    ├── sessions
    │   └── refresh_tokens
    ├── medicos
    ├── pacientes
    └── receitas
```

### Fluxo de Prescrição

1. **Médico** (`medicos`) cria uma **Receita** (`receitas`) para um **Paciente** (`pacientes`)
2. A receita contém um ou mais **Medicamentos** (`receita_medicamentos`)
3. Cada medicamento tem **Horários** definidos (`receita_horarios`)
4. O sistema verifica **Interações** (`interacoes_medicamentosas`) e **Conflitos** (`conflitos_horario`)
5. Notificações são enviadas para os **Dispositivos** (`dispositivos`) do paciente

---

## Permissões e Segurança

### Roles do Sistema

- **app20260109065139cnigtntalr_v1_user**: Usuário padrão (acesso aos próprios dados)
- **app20260109065139cnigtntalr_v1_admin_user**: Administrador (acesso total)

### Tabelas Restritas (Apenas Admin)

- `users`
- `sessions`
- `refresh_tokens`
- `user_passcode`

### Tabelas com RLS (Row Level Security)

Todas as demais tabelas implementam controle de acesso baseado em `user_id`, garantindo que usuários só acessem seus próprios dados.

---

## Observações Importantes

1. **Auditoria**: Todas as tabelas possuem `created_at` e `updated_at` para rastreabilidade
2. **Soft Delete**: Uso de campos `ativo` para desativação lógica de registros
3. **LGPD**: Campos específicos para consentimento e controle de dados pessoais
4. **Validações**: Constraints de banco garantem integridade dos dados
5. **Índices**: Otimizados para consultas frequentes e relacionamentos

---

## Manutenção e Evolução

Para adicionar novas funcionalidades:

1. Criar tabela com campos `user_id`, `created_at`, `updated_at` e `ativo`
2. Adicionar índices apropriados
3. Configurar permissões para os roles
4. Documentar neste arquivo
5. Atualizar tipos TypeScript em `src/types/medtime.ts`

---

**Última Atualização**: Janeiro 2026  
**Versão do Schema**: 1.0  
**Ambiente**: PostgreSQL 14+
