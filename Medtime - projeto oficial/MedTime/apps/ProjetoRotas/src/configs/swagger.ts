const swaggerSpec = {
  openapi: "3.0.0",
  info: { title: "API Medtime (Supabase)", version: "1.0.0", description: "Rotas sincronizadas com o schema medtime no Supabase." },
  servers: [{ url: "http://localhost:3333", description: "Local" }],
  paths: {
    "/sessions": {
      post: {
        summary: "Login",
        tags: ["Sessions"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" } } } } },
        },
        responses: { "200": { description: "Token e usuário" }, "401": { description: "E-mail ou senha incorretos" } },
      },
    },
    "/medtime/prefeitura": {
      get: { summary: "Listar prefeituras", tags: ["Prefeitura"], responses: { "200": { description: "Lista" } } },
      post: { summary: "Criar prefeitura", tags: ["Prefeitura"], responses: { "201": { description: "Criado" } } },
    },
    "/medtime/prefeitura/{id}": {
      get: { summary: "Buscar prefeitura por ID", tags: ["Prefeitura"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": {}, "404": {} } },
      put: { summary: "Atualizar prefeitura", tags: ["Prefeitura"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      delete: { summary: "Remover prefeitura", tags: ["Prefeitura"], parameters: [{ name: "id", in: "path", required: true }], responses: { "204": {} } },
    },
    "/medtime/medico": { get: { summary: "Listar médicos", tags: ["Médico"], responses: { "200": {} } }, post: { summary: "Criar médico", tags: ["Médico"], responses: { "201": {} } } },
    "/medtime/medico/{id}": {
      get: { summary: "Buscar médico por ID", tags: ["Médico"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      put: { summary: "Atualizar médico", tags: ["Médico"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      delete: { summary: "Remover médico", tags: ["Médico"], parameters: [{ name: "id", in: "path", required: true }], responses: { "204": {} } },
    },
    "/medtime/medicamentos": {
      get: { summary: "Listar medicamentos", tags: ["Medicamentos"], parameters: [{ name: "id_prefeitura", in: "query", schema: { type: "string", format: "uuid" } }], responses: { "200": {} } },
      post: { summary: "Criar medicamento", tags: ["Medicamentos"], responses: { "201": {} } },
    },
    "/medtime/medicamentos/{id}": {
      get: { summary: "Buscar medicamento por ID", tags: ["Medicamentos"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      put: { summary: "Atualizar medicamento", tags: ["Medicamentos"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      delete: { summary: "Remover medicamento", tags: ["Medicamentos"], parameters: [{ name: "id", in: "path", required: true }], responses: { "204": {} } },
    },
    "/medtime/pacientes": {
      get: { summary: "Listar pacientes", tags: ["Pacientes"], parameters: [{ name: "id_prefeitura", in: "query" }], responses: { "200": {} } },
      post: { summary: "Criar paciente", tags: ["Pacientes"], responses: { "201": {} } },
    },
    "/medtime/pacientes/{id}": {
      get: { summary: "Buscar paciente por ID", tags: ["Pacientes"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      put: { summary: "Atualizar paciente", tags: ["Pacientes"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      delete: { summary: "Remover paciente", tags: ["Pacientes"], parameters: [{ name: "id", in: "path", required: true }], responses: { "204": {} } },
    },
    "/medtime/receitas": {
      get: { summary: "Listar receitas", tags: ["Receitas"], parameters: [{ name: "id_prefeitura", in: "query" }, { name: "id_paciente", in: "query" }], responses: { "200": {} } },
      post: { summary: "Criar receita", tags: ["Receitas"], responses: { "201": {} } },
    },
    "/medtime/receitas/{id}": {
      get: { summary: "Buscar receita por ID", tags: ["Receitas"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      put: { summary: "Atualizar receita", tags: ["Receitas"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      delete: { summary: "Remover receita", tags: ["Receitas"], parameters: [{ name: "id", in: "path", required: true }], responses: { "204": {} } },
    },
    "/medtime/receita-medicamentos": {
      get: { summary: "Listar receita-medicamentos", tags: ["Receita Medicamentos"], parameters: [{ name: "id_receita", in: "query" }, { name: "id_prefeitura", in: "query" }], responses: { "200": {} } },
      post: { summary: "Criar receita-medicamento", tags: ["Receita Medicamentos"], responses: { "201": {} } },
    },
    "/medtime/receita-medicamentos/{id}": {
      get: { summary: "Buscar por ID", tags: ["Receita Medicamentos"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      put: { summary: "Atualizar", tags: ["Receita Medicamentos"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      delete: { summary: "Remover", tags: ["Receita Medicamentos"], parameters: [{ name: "id", in: "path", required: true }], responses: { "204": {} } },
    },
    "/medtime/receita-horarios": {
      get: { summary: "Listar receita-horários", tags: ["Receita Horários"], parameters: [{ name: "id_rm", in: "query" }, { name: "id_prefeitura", in: "query" }], responses: { "200": {} } },
      post: { summary: "Criar receita-horário", tags: ["Receita Horários"], responses: { "201": {} } },
    },
    "/medtime/receita-horarios/{id}": {
      get: { summary: "Buscar por ID", tags: ["Receita Horários"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      put: { summary: "Atualizar", tags: ["Receita Horários"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      delete: { summary: "Remover", tags: ["Receita Horários"], parameters: [{ name: "id", in: "path", required: true }], responses: { "204": {} } },
    },
    "/medtime/usuario": { get: { summary: "Listar usuários (sem senha)", tags: ["Usuário"], responses: { "200": {} } }, post: { summary: "Criar usuário", tags: ["Usuário"], responses: { "201": {} } } },
    "/medtime/usuario/{id}": {
      get: { summary: "Buscar usuário por ID", tags: ["Usuário"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      put: { summary: "Atualizar usuário", tags: ["Usuário"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      delete: { summary: "Remover usuário", tags: ["Usuário"], parameters: [{ name: "id", in: "path", required: true }], responses: { "204": {} } },
    },
    "/medtime/x001": { get: { summary: "Listar x001", tags: ["X001"], responses: { "200": {} } }, post: { summary: "Criar x001", tags: ["X001"], responses: { "201": {} } } },
    "/medtime/x001/{id}": {
      get: { summary: "Buscar x001 por ID", tags: ["X001"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      put: { summary: "Atualizar x001", tags: ["X001"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      delete: { summary: "Remover x001", tags: ["X001"], parameters: [{ name: "id", in: "path", required: true }], responses: { "204": {} } },
    },
    "/medtime/x002": { get: { summary: "Listar x002", tags: ["X002"], responses: { "200": {} } }, post: { summary: "Criar x002", tags: ["X002"], responses: { "201": {} } } },
    "/medtime/x002/{id}": {
      get: { summary: "Buscar x002 por ID", tags: ["X002"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      put: { summary: "Atualizar x002", tags: ["X002"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {}, "404": {} } },
      delete: { summary: "Remover x002", tags: ["X002"], parameters: [{ name: "id", in: "path", required: true }], responses: { "204": {} } },
    },
  },
};

export { swaggerSpec };
