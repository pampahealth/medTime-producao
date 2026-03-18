/**
 * Proxy para o backend ProjetoRotas.
 * Mapeia paths do FrontEnd (/next_api/medicamentos) para o backend (/medtime/medicamentos)
 * e normaliza request/response para o contrato esperado pelo FrontEnd.
 */

const API_BACKEND_URL = process.env.API_BACKEND_URL || "http://localhost:3333";

// ---- Mapeamento de path: segmento FrontEnd -> path backend ----
const PATH_MAP: Record<string, string> = {
  medicamentos: "medtime/medicamentos",
  medicos: "medtime/medico",
  pacientes: "medtime/pacientes",
  receitas: "medtime/receitas",
  "receita-medicamentos": "medtime/receita-medicamentos",
  "receita-horarios": "medtime/receita-horarios",
  prefeitura: "medtime/prefeitura",
  usuario: "medtime/usuario",
  "paciente-celulares": "medtime/paciente-celulares",
  x001: "medtime/x001",
  x002: "medtime/x002",
};

// ---- Mapeamento de colunas backend (a00x_*) para frontend (camelCase) ----
type FieldMap = Record<string, string>;

const MEDICAMENTOS_TO_FRONT: FieldMap = {
  a003_id_medicamento: "id",
  a003_nome: "nome",
  a003_imagem_base64: "imagem_url",
  a003_id_prefeitura: "id_prefeitura",
  a003_ativo: "ativo",
  a003_created_at: "created_at",
  a003_updated_at: "updated_at",
  a003_descricao: "descricao",
  a003_principio_ativo: "principio_ativo",
  a003_concentracao: "concentracao",
  a003_forma_farmaceutica: "forma_farmaceutica",
};

const MEDICAMENTOS_TO_BACK: FieldMap = {
  id: "a003_id_medicamento",
  nome: "a003_nome",
  imagem_url: "a003_imagem_base64",
  id_prefeitura: "a003_id_prefeitura",
  ativo: "a003_ativo",
  descricao: "a003_descricao",
  principio_ativo: "a003_principio_ativo",
  concentracao: "a003_concentracao",
  forma_farmaceutica: "a003_forma_farmaceutica",
};

const MEDICOS_TO_FRONT: FieldMap = {
  a002_id_medico: "id",
  a002_nome_medico: "nome",
  a002_crm: "crm",
  a002_especialidade: "especialidade",
  a002_ativo: "ativo",
};

const MEDICOS_TO_BACK: FieldMap = {
  nome: "a002_nome_medico",
  crm: "a002_crm",
  especialidade: "a002_especialidade",
  ativo: "a002_ativo",
};

const PACIENTES_TO_FRONT: FieldMap = {
  a004_id_paciente: "id",
  a004_cartao_sus: "cartao_sus",
  a004_nome: "nome",
  a004_celular: "celular",
  a004_cpf: "cpf",
  a004_data_nascimento: "data_nascimento",
  a004_ativo: "ativo",
  a004_id_prefeitura: "id_prefeitura",
  a004_app_instalado: "app_instalado",
  a004_created_at: "created_at",
};

const PACIENTES_TO_BACK: FieldMap = {
  cartao_sus: "a004_cartao_sus",
  nome: "a004_nome",
  celular: "a004_celular",
  cpf: "a004_cpf",
  data_nascimento: "a004_data_nascimento",
  ativo: "a004_ativo",
  id_prefeitura: "a004_id_prefeitura",
  app_instalado: "a004_app_instalado",
};

const RECEITAS_TO_FRONT: FieldMap = {
  a005_id_receita: "id",
  a005_id_paciente: "id_paciente",
  a005_id_medico: "id_medico",
  a005_data_receita: "data_receita",
  a005_data_registro: "data_registro",
  a005_origem_receita: "origem_receita",
  a005_subgrupo_origem: "subgrupo_origem",
  a005_observacao: "observacao",
  a005_tipo_prescritor: "tipo_prescritor",
  a005_num_notificacao: "num_notificacao",
  a005_id_prefeitura: "id_prefeitura",
  a005_created_at: "created_at",
};

const RECEITAS_TO_BACK: FieldMap = {
  id_paciente: "a005_id_paciente",
  id_medico: "a005_id_medico",
  data_receita: "a005_data_receita",
  data_registro: "a005_data_registro",
  origem_receita: "a005_origem_receita",
  subgrupo_origem: "a005_subgrupo_origem",
  observacao: "a005_observacao",
  tipo_prescritor: "a005_tipo_prescritor",
  num_notificacao: "a005_num_notificacao",
  id_prefeitura: "a005_id_prefeitura",
};

const RECEITA_MEDICAMENTOS_TO_FRONT: FieldMap = {
  a006_id_rm: "id",
  a006_id_receita: "id_receita",
  a006_id_medicamento: "id_medicamento",
  a006_quantidade_total: "quantidade_total",
  a006_frequencia_dia: "frequencia_dia",
  a006_duracao_dias: "duracao_dias",
  a006_observacao: "observacao",
  a006_id_prefeitura: "id_prefeitura",
  a006_created_at: "created_at",
};

const RECEITA_MEDICAMENTOS_TO_BACK: FieldMap = {
  id_receita: "a006_id_receita",
  id_medicamento: "a006_id_medicamento",
  quantidade_total: "a006_quantidade_total",
  frequencia_dia: "a006_frequencia_dia",
  duracao_dias: "a006_duracao_dias",
  observacao: "a006_observacao",
  id_prefeitura: "a006_id_prefeitura",
};

const RECEITA_HORARIOS_TO_FRONT: FieldMap = {
  a007_id_horario: "id",
  a007_id_rm: "id_receita_medicamento",
  a007_id_prefeitura: "id_prefeitura",
  a007_data_hora_disparo: "horario",
  a007_data_hora_desligado: "data_fim",
  a007_tomou: "tomou",
  a007_sms_enviado: "sms_enviado",
  a007_tentativas: "tentativas",
  a007_created_at: "created_at",
};

const RECEITA_HORARIOS_TO_BACK: FieldMap = {
  id_receita_medicamento: "a007_id_rm",
  id_prefeitura: "a007_id_prefeitura",
  horario: "a007_data_hora_disparo",
  data_fim: "a007_data_hora_desligado",
  tomou: "a007_tomou",
  sms_enviado: "a007_sms_enviado",
  tentativas: "a007_tentativas",
};

const PREFEITURA_TO_FRONT: FieldMap = {
  a001_id_prefeitura: "id",
  a001_cnpj: "cnpj",
  a001_apelido: "apelido",
};

const PREFEITURA_TO_BACK: FieldMap = {
  cnpj: "a001_cnpj",
  apelido: "a001_apelido",
};

const USUARIO_TO_FRONT: FieldMap = {
  a008_id: "id",
  a008_user_email: "email",
  a008_user_tipo: "tipo",
};

const USUARIO_TO_BACK: FieldMap = {
  id: "a008_id",
  email: "a008_user_email",
  senha: "a008_user_senha",
  tipo: "a008_user_tipo",
};

const X001_TO_FRONT: FieldMap = {
  x001_id: "id",
  x001_codigo: "codigo",
  x001_nome: "nome",
  x001_valor: "valor",
  x001_descricao: "descricao",
};

const X001_TO_BACK: FieldMap = {
  codigo: "x001_codigo",
  nome: "x001_nome",
  valor: "x001_valor",
  descricao: "x001_descricao",
};

const X002_TO_FRONT: FieldMap = {
  x002_id: "id",
  x002_codigo: "codigo",
  x002_nome: "nome",
  x002_valor: "valor",
  x002_descricao: "descricao",
};

const X002_TO_BACK: FieldMap = {
  codigo: "x002_codigo",
  nome: "x002_nome",
  valor: "x002_valor",
  descricao: "x002_descricao",
};

const PACIENTE_CELULARES_TO_FRONT: FieldMap = {
  a009_id_celular: "id",
  a009_id_paciente: "id_paciente",
  a009_id_prefeitura: "id_prefeitura",
  a009_modelo: "modelo",
  a009_marca: "marca",
  a009_numero_serie: "numero_serie",
  a009_numero_contato: "numero_contato",
  a009_tipo_celular: "tipo_celular",
  a009_nome_cuidador: "nome_cuidador",
  a009_ativo: "ativo",
  a009_created_at: "created_at",
  a009_updated_at: "updated_at",
};

const PACIENTE_CELULARES_TO_BACK: FieldMap = {
  id_paciente: "a009_id_paciente",
  id_prefeitura: "a009_id_prefeitura",
  modelo: "a009_modelo",
  marca: "a009_marca",
  numero_serie: "a009_numero_serie",
  numero_contato: "a009_numero_contato",
  tipo_celular: "a009_tipo_celular",
  nome_cuidador: "a009_nome_cuidador",
  ativo: "a009_ativo",
};

function mapRow(row: Record<string, unknown>, toFront: FieldMap): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [backendKey, frontKey] of Object.entries(toFront)) {
    if (backendKey in row) {
      let val = row[backendKey];
      if (backendKey === "a004_app_instalado") val = val === "S";
      out[frontKey] = val;
    }
  }
  // Incluir campos que não foram mapeados (evitar perda de dados)
  for (const [k, v] of Object.entries(row)) {
    if (!toFront[k]) out[k] = v;
  }
  return out;
}

function mapBodyToBackend(body: Record<string, unknown>, toBack: FieldMap): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [frontKey, backendKey] of Object.entries(toBack)) {
    if (frontKey in body && body[frontKey] !== undefined) {
      let val = body[frontKey];
      if (frontKey === "app_instalado") val = val ? "S" : "N";
      out[backendKey] = val;
    }
  }
  return out;
}

const ENTITY_MAP: Record<
  string,
  { toFront: FieldMap; toBack: FieldMap }
> = {
  medicamentos: { toFront: MEDICAMENTOS_TO_FRONT, toBack: MEDICAMENTOS_TO_BACK },
  medico: { toFront: MEDICOS_TO_FRONT, toBack: MEDICOS_TO_BACK },
  medicos: { toFront: MEDICOS_TO_FRONT, toBack: MEDICOS_TO_BACK },
  pacientes: { toFront: PACIENTES_TO_FRONT, toBack: PACIENTES_TO_BACK },
  receitas: { toFront: RECEITAS_TO_FRONT, toBack: RECEITAS_TO_BACK },
  "receita-medicamentos": { toFront: RECEITA_MEDICAMENTOS_TO_FRONT, toBack: RECEITA_MEDICAMENTOS_TO_BACK },
  "receita-horarios": { toFront: RECEITA_HORARIOS_TO_FRONT, toBack: RECEITA_HORARIOS_TO_BACK },
  prefeitura: { toFront: PREFEITURA_TO_FRONT, toBack: PREFEITURA_TO_BACK },
  usuario: { toFront: USUARIO_TO_FRONT, toBack: USUARIO_TO_BACK },
  "paciente-celulares": { toFront: PACIENTE_CELULARES_TO_FRONT, toBack: PACIENTE_CELULARES_TO_BACK },
  x001: { toFront: X001_TO_FRONT, toBack: X001_TO_BACK },
  x002: { toFront: X002_TO_FRONT, toBack: X002_TO_BACK },
};

/** Preenche campos esperados pelo front quando o backend não os envia (evita dados “não carregados”) */
function applyEntityDefaults(entity: string, row: Record<string, unknown>): void {
  if (entity === "prefeitura") {
    if (row.nome === undefined || row.nome === null) row.nome = row.apelido;
    if (row.ativo === undefined || row.ativo === null) row.ativo = true;
  }
  if (entity === "receitas") {
    if (row.status === undefined || row.status === null) row.status = "ativa";
  }
  if (entity === "medicos" || entity === "medico") {
    if (row.especialidade === undefined || row.especialidade === null) row.especialidade = "";
    if (row.ativo === undefined || row.ativo === null) row.ativo = true;
  }
}

function mapResponse(entity: string, data: unknown): unknown {
  const mapping = ENTITY_MAP[entity];
  if (!mapping) return data;
  if (Array.isArray(data)) {
    return data.map((row) => {
      const out = mapRow(row as Record<string, unknown>, mapping.toFront) as Record<string, unknown>;
      applyEntityDefaults(entity, out);
      return out;
    });
  }
  if (data && typeof data === "object") {
    const out = mapRow(data as Record<string, unknown>, mapping.toFront) as Record<string, unknown>;
    applyEntityDefaults(entity, out);
    return out;
  }
  return data;
}

function mapRequestBody(entity: string, body: Record<string, unknown>): Record<string, unknown> {
  const mapping = ENTITY_MAP[entity];
  if (!mapping) return body;
  const out = mapBodyToBackend(body, mapping.toBack);
  // Backend a003_medicamentos exige a003_imagem_base64 NOT NULL e min(1)
  if (entity === "medicamentos" && (out.a003_imagem_base64 === undefined || out.a003_imagem_base64 === "")) {
    out.a003_imagem_base64 = (body.imagem_url as string)?.trim() || " ";
  }
  return out;
}

/**
 * Resolve o path do backend a partir dos segmentos do next_api.
 * Ex: ['medicamentos'] -> 'medtime/medicamentos'
 *     ['medicamentos', 'abc-uuid'] -> 'medtime/medicamentos/abc-uuid'
 */
export function resolveBackendPath(segments: string[], idFromQuery?: string | null): string {
  const first = segments[0];
  if (first === "auth") {
    if (segments[1] === "login") return "sessions";
    return `auth/${segments.slice(1).join("/")}`;
  }
  const basePath = PATH_MAP[first] || (first ? `medtime/${first}` : "");
  if (!basePath) return "";
  const path = idFromQuery ? `${basePath}/${idFromQuery}` : basePath;
  return path;
}

/**
 * Retorna o nome da entidade para mapeamento (medicos -> medico no backend)
 */
export function getEntityForMapping(segments: string[]): string {
  const first = segments[0];
  if (first === "medicos") return "medicos";
  return first || "";
}

export interface ProxyOptions {
  method: string;
  pathSegments: string[];
  searchParams: URLSearchParams;
  body?: unknown;
  headers?: Headers;
}

export async function proxyToBackend(options: ProxyOptions): Promise<{ status: number; data: unknown; headers?: Headers }> {
  const { method, pathSegments, searchParams, body, headers } = options;
  const idFromQuery = searchParams.get("id") ?? (pathSegments.length > 1 ? pathSegments[1] : null);
  const backendPath = resolveBackendPath(pathSegments, idFromQuery);
  const entity = getEntityForMapping(pathSegments);

  const url = new URL(API_BACKEND_URL);
  url.pathname = `/${backendPath}`;
  searchParams.forEach((value, key) => {
    if (key !== "id") url.searchParams.set(key, value);
  });

  const fetchHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (headers?.get("authorization")) {
    fetchHeaders["Authorization"] = headers.get("authorization")!;
  }
  headers?.forEach((value, key) => {
    if (key.toLowerCase() === "cookie") fetchHeaders["Cookie"] = value;
  });

  let fetchBody: string | undefined;
  if (body && (method === "POST" || method === "PUT")) {
    const bodyObj = typeof body === "object" ? body as Record<string, unknown> : {};
    const mapped = entity && ENTITY_MAP[entity] ? mapRequestBody(entity, bodyObj) : bodyObj;
    fetchBody = JSON.stringify(mapped);
  }

  const res = await fetch(url.toString(), {
    method,
    headers: fetchHeaders,
    body: fetchBody,
  });

  let data: unknown;
  const contentType = res.headers.get("content-type");
  const text = await res.text();
  if (contentType?.includes("application/json") && text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: "Resposta inválida do backend (não é JSON)" };
    }
  } else {
    data = text || null;
  }

  if (!res.ok) {
    const errorMessage = typeof data === "object" && data !== null && "message" in data
      ? (data as { message: string }).message
      : `Backend error ${res.status}`;
    return { status: res.status, data: { errorMessage, message: errorMessage } };
  }

  const mappedData = entity && ENTITY_MAP[entity] ? mapResponse(entity, data) : data;
  return { status: res.status, data: mappedData, headers: res.headers };
}

export { API_BACKEND_URL };
