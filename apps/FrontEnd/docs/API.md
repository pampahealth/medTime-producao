
# Documentação da API - MedTime

## Visão Geral

Esta documentação descreve todos os endpoints da API REST do sistema MedTime para gerenciamento de pacientes, medicamentos, receitas e agendamento de horários de medicação.

**Base URL**: `/next_api`

**Autenticação**: Todas as rotas requerem autenticação via token JWT (enviado via cookie).

**Formato de Resposta**: Todas as respostas seguem o padrão:

```json
{
  "success": true,
  "data": { ... }
}
```

**Formato de Erro**:

```json
{
  "success": false,
  "errorMessage": "Mensagem de erro",
  "errorCode": "CODIGO_ERRO"
}
```

---

## 1. Pacientes

### 1.1 Listar Pacientes

**Endpoint**: `GET /next_api/pacientes`

**Descrição**: Retorna lista de pacientes do usuário autenticado.

**Query Parameters**:
- `limit` (opcional): Número máximo de registros (padrão: 10)
- `offset` (opcional): Número de registros a pular (padrão: 0)
- `search` (opcional): Busca por nome do paciente

**Exemplo de Requisição**:
```http
GET /next_api/pacientes?limit=20&offset=0&search=João
```

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "id_prefeitura": 1,
      "cartao_sus": "123456789012345",
      "cpf": "12345678901",
      "nome": "João Silva",
      "data_nascimento": "1980-05-15",
      "celular": "11987654321",
      "celular_validado": false,
      "app_instalado": false,
      "consentimento_lgpd": false,
      "ativo": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 1.2 Criar Paciente

**Endpoint**: `POST /next_api/pacientes`

**Descrição**: Cria um novo paciente.

**Body** (JSON):
```json
{
  "id_prefeitura": 1,
  "cartao_sus": "123456789012345",
  "cpf": "12345678901",
  "nome": "João Silva",
  "data_nascimento": "1980-05-15",
  "celular": "11987654321"
}
```

**Campos Obrigatórios**:
- `id_prefeitura` (number): ID da prefeitura
- `cartao_sus` (string): Número do Cartão SUS (apenas números)
- `nome` (string): Nome completo do paciente

**Campos Opcionais**:
- `cpf` (string): CPF com 11 dígitos
- `data_nascimento` (string): Data no formato YYYY-MM-DD
- `celular` (string): Número de celular

**Validações**:
- Cartão SUS deve conter apenas números
- CPF deve ter exatamente 11 dígitos (se fornecido)

**Exemplo de Resposta** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 123,
    "id_prefeitura": 1,
    "cartao_sus": "123456789012345",
    "cpf": "12345678901",
    "nome": "João Silva",
    "data_nascimento": "1980-05-15",
    "celular": "11987654321",
    "celular_validado": false,
    "app_instalado": false,
    "consentimento_lgpd": false,
    "ativo": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Possíveis Erros**:
- `400`: Cartão SUS é obrigatório
- `400`: Nome é obrigatório
- `400`: ID da prefeitura é obrigatório
- `400`: CPF deve ter 11 dígitos
- `400`: Cartão SUS deve conter apenas números
- `401`: Usuário não autenticado

---

### 1.3 Atualizar Paciente

**Endpoint**: `PUT /next_api/pacientes?id={id}`

**Descrição**: Atualiza dados de um paciente existente.

**Query Parameters**:
- `id` (obrigatório): ID do paciente

**Body** (JSON):
```json
{
  "nome": "João Silva Santos",
  "cartao_sus": "123456789012345",
  "cpf": "12345678901",
  "data_nascimento": "1980-05-15",
  "celular": "11987654321",
  "ativo": true
}
```

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João Silva Santos",
    "cartao_sus": "123456789012345",
    "cpf": "12345678901",
    "data_nascimento": "1980-05-15",
    "celular": "11987654321",
    "ativo": true,
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

**Possíveis Erros**:
- `400`: ID é obrigatório
- `400`: CPF deve ter 11 dígitos
- `400`: Cartão SUS deve conter apenas números
- `404`: Paciente não encontrado

---

### 1.4 Desativar Paciente

**Endpoint**: `DELETE /next_api/pacientes?id={id}`

**Descrição**: Desativa um paciente (soft delete).

**Query Parameters**:
- `id` (obrigatório): ID do paciente

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```

**Possíveis Erros**:
- `400`: ID é obrigatório
- `404`: Paciente não encontrado

---

## 2. Medicamentos

### 2.1 Listar Medicamentos

**Endpoint**: `GET /next_api/medicamentos`

**Descrição**: Retorna lista de medicamentos.

**Query Parameters**:
- `limit` (opcional): Número máximo de registros (padrão: 10)
- `offset` (opcional): Número de registros a pular (padrão: 0)
- `search` (opcional): Busca por nome do medicamento
- `showInactive` (opcional): Se `true`, inclui medicamentos inativos (padrão: false)

**Exemplo de Requisição**:
```http
GET /next_api/medicamentos?limit=20&offset=0&search=Dipirona
```

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_prefeitura": 1,
      "nome": "Dipirona Sódica",
      "descricao": "Analgésico e antitérmico",
      "imagem_url": "https://example.com/dipirona.jpg",
      "principio_ativo": "Dipirona Sódica",
      "concentracao": "500mg",
      "forma_farmaceutica": "Comprimido",
      "ativo": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 2.2 Criar Medicamento

**Endpoint**: `POST /next_api/medicamentos`

**Descrição**: Cria um novo medicamento.

**Body** (JSON):
```json
{
  "id_prefeitura": 1,
  "nome": "Dipirona Sódica",
  "descricao": "Analgésico e antitérmico",
  "imagem_url": "https://example.com/dipirona.jpg",
  "principio_ativo": "Dipirona Sódica",
  "concentracao": "500mg",
  "forma_farmaceutica": "Comprimido"
}
```

**Campos Obrigatórios**:
- `id_prefeitura` (number): ID da prefeitura
- `nome` (string): Nome do medicamento

**Campos Opcionais**:
- `descricao` (string): Descrição do medicamento
- `imagem_url` (string): URL da imagem
- `principio_ativo` (string): Princípio ativo
- `concentracao` (string): Concentração
- `forma_farmaceutica` (string): Forma farmacêutica (comprimido, xarope, etc.)

**Exemplo de Resposta** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "id_prefeitura": 1,
    "nome": "Dipirona Sódica",
    "descricao": "Analgésico e antitérmico",
    "imagem_url": "https://example.com/dipirona.jpg",
    "principio_ativo": "Dipirona Sódica",
    "concentracao": "500mg",
    "forma_farmaceutica": "Comprimido",
    "ativo": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Possíveis Erros**:
- `400`: Nome do medicamento é obrigatório
- `400`: ID da prefeitura é obrigatório

---

### 2.3 Atualizar Medicamento

**Endpoint**: `PUT /next_api/medicamentos?id={id}`

**Descrição**: Atualiza dados de um medicamento existente.

**Query Parameters**:
- `id` (obrigatório): ID do medicamento

**Body** (JSON):
```json
{
  "nome": "Dipirona Sódica 500mg",
  "descricao": "Analgésico e antitérmico de uso oral",
  "concentracao": "500mg",
  "ativo": true
}
```

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "Dipirona Sódica 500mg",
    "descricao": "Analgésico e antitérmico de uso oral",
    "concentracao": "500mg",
    "ativo": true,
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

**Possíveis Erros**:
- `400`: ID é obrigatório
- `404`: Medicamento não encontrado

---

### 2.4 Desativar Medicamento

**Endpoint**: `DELETE /next_api/medicamentos?id={id}`

**Descrição**: Desativa um medicamento (soft delete).

**Query Parameters**:
- `id` (obrigatório): ID do medicamento

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ativo": false
  }
}
```

**Possíveis Erros**:
- `400`: ID é obrigatório
- `404`: Medicamento não encontrado

---

## 3. Receitas

### 3.1 Listar Receitas

**Endpoint**: `GET /next_api/receitas`

**Descrição**: Retorna lista de receitas do usuário autenticado.

**Query Parameters**:
- `limit` (opcional): Número máximo de registros (padrão: 10)
- `offset` (opcional): Número de registros a pular (padrão: 0)

**Exemplo de Requisição**:
```http
GET /next_api/receitas?limit=20&offset=0
```

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "id_paciente": 1,
      "id_prefeitura": 1,
      "data_receita": "2024-01-15",
      "data_registro": "2024-01-15T10:30:00Z",
      "origem_receita": "UBS Central",
      "subgrupo_origem": "Clínica Geral",
      "observacao": "Tratamento para hipertensão",
      "tipo_prescritor": "Médico",
      "num_notificacao": "REC-2024-001",
      "status": "ativa",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 3.2 Criar Receita

**Endpoint**: `POST /next_api/receitas`

**Descrição**: Cria uma nova receita.

**Body** (JSON):
```json
{
  "id_paciente": 1,
  "id_prefeitura": 1,
  "data_receita": "2024-01-15",
  "origem_receita": "UBS Central",
  "subgrupo_origem": "Clínica Geral",
  "observacao": "Tratamento para hipertensão",
  "tipo_prescritor": "Médico",
  "num_notificacao": "REC-2024-001"
}
```

**Campos Obrigatórios**:
- `id_paciente` (number): ID do paciente
- `id_prefeitura` (number): ID da prefeitura
- `data_receita` (string): Data da receita (formato: YYYY-MM-DD)

**Campos Opcionais**:
- `origem_receita` (string): Origem da receita
- `subgrupo_origem` (string): Subgrupo de origem
- `observacao` (string): Observações gerais
- `tipo_prescritor` (string): Tipo do prescritor
- `num_notificacao` (string): Número de notificação

**Exemplo de Resposta** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 123,
    "id_paciente": 1,
    "id_prefeitura": 1,
    "data_receita": "2024-01-15",
    "data_registro": "2024-01-15T10:30:00Z",
    "origem_receita": "UBS Central",
    "subgrupo_origem": "Clínica Geral",
    "observacao": "Tratamento para hipertensão",
    "tipo_prescritor": "Médico",
    "num_notificacao": "REC-2024-001",
    "status": "ativa",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Possíveis Erros**:
- `400`: ID do paciente é obrigatório
- `400`: Data da receita é obrigatória
- `400`: ID da prefeitura é obrigatório
- `401`: Usuário não autenticado

---

### 3.3 Atualizar Receita

**Endpoint**: `PUT /next_api/receitas?id={id}`

**Descrição**: Atualiza dados de uma receita existente.

**Query Parameters**:
- `id` (obrigatório): ID da receita

**Body** (JSON):
```json
{
  "observacao": "Tratamento para hipertensão - ajuste de dosagem",
  "status": "ativa"
}
```

**Valores possíveis para `status`**:
- `ativa`
- `concluida`
- `cancelada`

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "observacao": "Tratamento para hipertensão - ajuste de dosagem",
    "status": "ativa",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

**Possíveis Erros**:
- `400`: ID é obrigatório
- `404`: Receita não encontrada

---

### 3.4 Cancelar Receita

**Endpoint**: `DELETE /next_api/receitas?id={id}`

**Descrição**: Cancela uma receita (altera status para 'cancelada').

**Query Parameters**:
- `id` (obrigatório): ID da receita

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```

**Possíveis Erros**:
- `400`: ID é obrigatório
- `404`: Receita não encontrada

---

## 4. Receita-Medicamentos (Associação)

### 4.1 Listar Medicamentos de uma Receita

**Endpoint**: `GET /next_api/receita-medicamentos`

**Descrição**: Retorna lista de medicamentos associados a receitas.

**Query Parameters**:
- `limit` (opcional): Número máximo de registros (padrão: 10)
- `offset` (opcional): Número de registros a pular (padrão: 0)
- `id_receita` (opcional): Filtrar por ID da receita

**Exemplo de Requisição**:
```http
GET /next_api/receita-medicamentos?id_receita=1
```

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "id_receita": 1,
      "id_medicamento": 1,
      "id_prefeitura": 1,
      "quantidade_total": 60,
      "quantidade_minima_calculada": 60,
      "frequencia_dia": 2,
      "duracao_dias": 30,
      "dias_dispensar": 30,
      "observacao": "Tomar após as refeições",
      "posologia": "1 comprimido de 12 em 12 horas",
      "via_administracao": "Oral",
      "status": "ativo",
      "data_inicio": "2024-01-15",
      "data_fim": "2024-02-14",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 4.2 Adicionar Medicamento à Receita

**Endpoint**: `POST /next_api/receita-medicamentos`

**Descrição**: Adiciona um medicamento a uma receita existente.

**Body** (JSON):
```json
{
  "id_receita": 1,
  "id_medicamento": 1,
  "id_prefeitura": 1,
  "quantidade_total": 60,
  "frequencia_dia": 2,
  "duracao_dias": 30,
  "dias_dispensar": 30,
  "observacao": "Tomar após as refeições",
  "posologia": "1 comprimido de 12 em 12 horas",
  "via_administracao": "Oral",
  "data_inicio": "2024-01-15",
  "data_fim": "2024-02-14"
}
```

**Campos Obrigatórios**:
- `id_receita` (number): ID da receita
- `id_medicamento` (number): ID do medicamento
- `id_prefeitura` (number): ID da prefeitura

**Campos Opcionais**:
- `quantidade_total` (number): Quantidade total do medicamento
- `frequencia_dia` (number): Frequência por dia (≥ 1)
- `duracao_dias` (number): Duração em dias (≥ 1)
- `dias_dispensar` (number): Dias para dispensar
- `observacao` (string): Observações
- `posologia` (string): Posologia
- `via_administracao` (string): Via de administração
- `data_inicio` (string): Data de início (YYYY-MM-DD)
- `data_fim` (string): Data de fim (YYYY-MM-DD)

**Cálculo Automático**:
- `quantidade_minima_calculada` = `frequencia_dia` × `duracao_dias`

**Exemplo de Resposta** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 123,
    "id_receita": 1,
    "id_medicamento": 1,
    "id_prefeitura": 1,
    "quantidade_total": 60,
    "quantidade_minima_calculada": 60,
    "frequencia_dia": 2,
    "duracao_dias": 30,
    "dias_dispensar": 30,
    "observacao": "Tomar após as refeições",
    "posologia": "1 comprimido de 12 em 12 horas",
    "via_administracao": "Oral",
    "status": "ativo",
    "data_inicio": "2024-01-15",
    "data_fim": "2024-02-14",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Possíveis Erros**:
- `400`: ID da receita é obrigatório
- `400`: ID do medicamento é obrigatório
- `400`: ID da prefeitura é obrigatório
- `401`: Usuário não autenticado

---

### 4.3 Atualizar Medicamento da Receita

**Endpoint**: `PUT /next_api/receita-medicamentos?id={id}`

**Descrição**: Atualiza dados de um medicamento associado a uma receita.

**Query Parameters**:
- `id` (obrigatório): ID do registro de receita-medicamento

**Body** (JSON):
```json
{
  "quantidade_total": 90,
  "frequencia_dia": 3,
  "duracao_dias": 30,
  "observacao": "Tomar após as refeições - dosagem ajustada"
}
```

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "quantidade_total": 90,
    "quantidade_minima_calculada": 90,
    "frequencia_dia": 3,
    "duracao_dias": 30,
    "observacao": "Tomar após as refeições - dosagem ajustada",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

**Possíveis Erros**:
- `400`: ID é obrigatório
- `404`: Item de receita não encontrado

---

### 4.4 Cancelar Medicamento da Receita

**Endpoint**: `DELETE /next_api/receita-medicamentos?id={id}`

**Descrição**: Cancela um medicamento de uma receita (altera status para 'cancelado').

**Query Parameters**:
- `id` (obrigatório): ID do registro de receita-medicamento

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```

**Possíveis Erros**:
- `400`: ID é obrigatório
- `404`: Item de receita não encontrado

---

## 5. Horários de Medicação

### 5.1 Listar Horários

**Endpoint**: `GET /next_api/receita-horarios`

**Descrição**: Retorna lista de horários configurados para medicamentos.

**Query Parameters**:
- `limit` (opcional): Número máximo de registros (padrão: 10)
- `offset` (opcional): Número de registros a pular (padrão: 0)
- `id_receita_medicamento` (opcional): Filtrar por ID do medicamento da receita

**Exemplo de Requisição**:
```http
GET /next_api/receita-horarios?id_receita_medicamento=1
```

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "id_receita_medicamento": 1,
      "horario": "08:00:00",
      "data_inicio": "2024-01-15",
      "data_fim": "2024-02-14",
      "domingo": false,
      "segunda": true,
      "terca": true,
      "quarta": true,
      "quinta": true,
      "sexta": true,
      "sabado": false,
      "observacao": "Tomar em jejum",
      "ativo": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 5.2 Criar Horário

**Endpoint**: `POST /next_api/receita-horarios`

**Descrição**: Cria um novo horário para um medicamento.

**Body** (JSON):
```json
{
  "id_receita_medicamento": 1,
  "horario": "08:00:00",
  "data_inicio": "2024-01-15",
  "data_fim": "2024-02-14",
  "domingo": false,
  "segunda": true,
  "terca": true,
  "quarta": true,
  "quinta": true,
  "sexta": true,
  "sabado": false,
  "observacao": "Tomar em jejum"
}
```

**Campos Obrigatórios**:
- `id_receita_medicamento` (number): ID do medicamento da receita
- `horario` (string): Horário no formato HH:MM:SS

**Campos Opcionais**:
- `data_inicio` (string): Data de início (YYYY-MM-DD)
- `data_fim` (string): Data de fim (YYYY-MM-DD)
- `domingo` (boolean): Tomar aos domingos (padrão: false)
- `segunda` (boolean): Tomar às segundas (padrão: false)
- `terca` (boolean): Tomar às terças (padrão: false)
- `quarta` (boolean): Tomar às quartas (padrão: false)
- `quinta` (boolean): Tomar às quintas (padrão: false)
- `sexta` (boolean): Tomar às sextas (padrão: false)
- `sabado` (boolean): Tomar aos sábados (padrão: false)
- `observacao` (string): Observações

**Exemplo de Resposta** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 123,
    "id_receita_medicamento": 1,
    "horario": "08:00:00",
    "data_inicio": "2024-01-15",
    "data_fim": "2024-02-14",
    "domingo": false,
    "segunda": true,
    "terca": true,
    "quarta": true,
    "quinta": true,
    "sexta": true,
    "sabado": false,
    "observacao": "Tomar em jejum",
    "ativo": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Possíveis Erros**:
- `400`: ID do medicamento da receita é obrigatório
- `400`: Horário é obrigatório
- `401`: Usuário não autenticado

---

### 5.3 Atualizar Horário

**Endpoint**: `PUT /next_api/receita-horarios?id={id}`

**Descrição**: Atualiza um horário existente.

**Query Parameters**:
- `id` (obrigatório): ID do horário

**Body** (JSON):
```json
{
  "horario": "09:00:00",
  "observacao": "Tomar após o café da manhã",
  "domingo": true
}
```

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "horario": "09:00:00",
    "observacao": "Tomar após o café da manhã",
    "domingo": true,
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

**Possíveis Erros**:
- `400`: ID é obrigatório
- `404`: Horário não encontrado

---

### 5.4 Desativar Horário

**Endpoint**: `DELETE /next_api/receita-horarios?id={id}`

**Descrição**: Desativa um horário (soft delete).

**Query Parameters**:
- `id` (obrigatório): ID do horário

**Exemplo de Resposta** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```

**Possíveis Erros**:
- `400`: ID é obrigatório
- `404`: Horário não encontrado

---

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado com sucesso |
| 400 | Bad Request - Dados inválidos ou faltando |
| 401 | Unauthorized - Não autenticado |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro no servidor |

---

## Fluxo de Uso Recomendado

### 1. Cadastro de Paciente
```
POST /next_api/pacientes
```

### 2. Cadastro de Medicamentos
```
POST /next_api/medicamentos (para cada medicamento)
```

### 3. Criação de Receita
```
POST /next_api/receitas
```

### 4. Associação de Medicamentos à Receita
```
POST /next_api/receita-medicamentos (para cada medicamento)
```

### 5. Configuração de Horários
```
POST /next_api/receita-horarios (para cada horário de cada medicamento)
```

---

## Exemplos de Integração

### Exemplo: Criar Receita Completa

```javascript
// 1. Criar receita
const receita = await api.post('/receitas', {
  id_paciente: 1,
  id_prefeitura: 1,
  data_receita: '2024-01-15',
  observacao: 'Tratamento para hipertensão'
});

// 2. Adicionar medicamento à receita
const receitaMedicamento = await api.post('/receita-medicamentos', {
  id_receita: receita.id,
  id_medicamento: 1,
  id_prefeitura: 1,
  frequencia_dia: 2,
  duracao_dias: 30,
  posologia: '1 comprimido de 12 em 12 horas'
});

// 3. Configurar horários
await api.post('/receita-horarios', {
  id_receita_medicamento: receitaMedicamento.id,
  horario: '08:00:00',
  data_inicio: '2024-01-15',
  data_fim: '2024-02-14',
  segunda: true,
  terca: true,
  quarta: true,
  quinta: true,
  sexta: true
});

await api.post('/receita-horarios', {
  id_receita_medicamento: receitaMedicamento.id,
  horario: '20:00:00',
  data_inicio: '2024-01-15',
  data_fim: '2024-02-14',
  segunda: true,
  terca: true,
  quarta: true,
  quinta: true,
  sexta: true
});
```

---

## Notas Importantes

1. **Autenticação**: Todas as rotas requerem token JWT válido
2. **Soft Delete**: As operações DELETE não removem registros, apenas marcam como inativos/cancelados
3. **Filtros por Usuário**: Usuários não-admin só visualizam seus próprios dados
4. **Validações**: Todos os campos obrigatórios são validados no backend
5. **Timestamps**: Todos os registros incluem `created_at` e `updated_at`
6. **Relacionamentos**: Respeite a ordem de criação: Paciente → Receita → Receita-Medicamento → Horários

---

## Suporte

Para dúvidas ou problemas com a API, consulte a documentação técnica completa ou entre em contato com a equipe de desenvolvimento.
