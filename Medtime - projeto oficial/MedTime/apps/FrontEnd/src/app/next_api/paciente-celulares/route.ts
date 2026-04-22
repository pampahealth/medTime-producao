import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";
import { AUTH_ENABLED } from "@/config/auth-config";
import { proxyToBackend } from "@/lib/backend-proxy";
import { NextRequest } from "next/server";

const USE_BACKEND_PROXY = process.env.USE_BACKEND_PROXY === "true";

function normalizeIdPaciente(value: unknown): number | string {
  if (value == null) return 0;
  const s = String(value);
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return s;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Quando USE_BACKEND_PROXY=true, usa medtime.a009_paciente_celulares no backend. Senão, usa PostgREST (schema public). */
const PACIENTE_CELULARES_SCHEMA = "public";

async function proxyPacienteCelulares(request: NextRequest, method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown): Promise<Response> {
  const pathSegments = ["paciente-celulares"];
  const opts = {
    method,
    pathSegments,
    searchParams: request.nextUrl.searchParams,
    headers: request.headers,
    ...(body !== undefined && (method === "POST" || method === "PUT") ? { body } : {}),
  };
  const { status, data } = await proxyToBackend(opts);
  if (status >= 400) {
    const err = data as { errorMessage?: string; message?: string };
    return createErrorResponse({ errorMessage: err?.errorMessage ?? err?.message ?? "Erro no backend", status });
  }
  return createSuccessResponse(data ?? null, status === 204 ? 200 : status);
}

export const GET = requestMiddleware(async (request, context) => {
  if (USE_BACKEND_PROXY) return proxyPacienteCelulares(request, "GET");
  const { limit, offset } = parseQueryParams(request);
  const celularesCrud = new CrudOperations("paciente_celulares", context.token, PACIENTE_CELULARES_SCHEMA);
  const data = await celularesCrud.findMany({}, { limit, offset, orderBy: { column: 'created_at', direction: 'desc' } });
  return createSuccessResponse(data);
}, true);

export const POST = requestMiddleware(async (request, context) => {
  if (USE_BACKEND_PROXY) {
    const body = await request.json().catch(() => ({}));
    return proxyPacienteCelulares(request, "POST", body);
  }
  const body = await validateRequestBody(request);
  if (!body.id_paciente) return createErrorResponse({ errorMessage: "ID do paciente é obrigatório", status: 400 });
  if (!body.modelo) return createErrorResponse({ errorMessage: "Modelo é obrigatório", status: 400 });
  if (!body.marca) return createErrorResponse({ errorMessage: "Marca é obrigatória", status: 400 });
  if (!body.numero_contato) return createErrorResponse({ errorMessage: "Número de contato é obrigatório", status: 400 });
  if (!body.tipo_celular || !['proprio', 'cuidador'].includes(body.tipo_celular))
    return createErrorResponse({ errorMessage: "Tipo de celular inválido. Use 'proprio' ou 'cuidador'", status: 400 });
  if (body.tipo_celular === 'cuidador' && !body.nome_cuidador)
    return createErrorResponse({ errorMessage: "Nome do cuidador é obrigatório quando o tipo é 'cuidador'", status: 400 });
  const user_id = context.payload?.sub;
  if (AUTH_ENABLED && !user_id) return createErrorResponse({ errorMessage: "Usuário não autenticado", status: 401 });
  const celularesCrud = new CrudOperations("paciente_celulares", context.token, PACIENTE_CELULARES_SCHEMA);
  const celularData = {
    user_id: user_id ? parseInt(String(user_id), 10) : 0,
    id_paciente: normalizeIdPaciente(body.id_paciente),
    modelo: body.modelo,
    marca: body.marca,
    numero_serie: body.numero_serie || null,
    numero_contato: body.numero_contato,
    tipo_celular: body.tipo_celular,
    nome_cuidador: body.tipo_celular === 'cuidador' ? body.nome_cuidador : null,
    ativo: body.ativo !== undefined ? body.ativo : true,
  };
  const data = await celularesCrud.create(celularData);
  return createSuccessResponse(data, 201);
}, true);

export const PUT = requestMiddleware(async (request, context) => {
  if (USE_BACKEND_PROXY) {
    const body = await request.json().catch(() => ({}));
    return proxyPacienteCelulares(request, "PUT", body);
  }
  const { id } = parseQueryParams(request);
  if (!id) return createErrorResponse({ errorMessage: "ID é obrigatório", status: 400 });
  const body = await validateRequestBody(request);
  if (body.tipo_celular && !['proprio', 'cuidador'].includes(body.tipo_celular))
    return createErrorResponse({ errorMessage: "Tipo de celular inválido.", status: 400 });
  if (body.tipo_celular === 'cuidador' && !body.nome_cuidador)
    return createErrorResponse({ errorMessage: "Nome do cuidador é obrigatório quando o tipo é 'cuidador'", status: 400 });
  const celularesCrud = new CrudOperations("paciente_celulares", context.token, PACIENTE_CELULARES_SCHEMA);
  const existing = await celularesCrud.findById(id);
  if (!existing) return createErrorResponse({ errorMessage: "Celular não encontrado", status: 404 });
  const updateData: Record<string, unknown> = {
    modelo: body.modelo,
    marca: body.marca,
    numero_serie: body.numero_serie ?? null,
    numero_contato: body.numero_contato,
    tipo_celular: body.tipo_celular,
    nome_cuidador: body.tipo_celular === 'cuidador' ? body.nome_cuidador : null,
  };
  if (body.ativo !== undefined) updateData.ativo = body.ativo;
  if (body.id_paciente !== undefined) updateData.id_paciente = normalizeIdPaciente(body.id_paciente);
  const data = await celularesCrud.update(id, updateData);
  return createSuccessResponse(data);
}, true);

export const DELETE = requestMiddleware(async (request, context) => {
  if (USE_BACKEND_PROXY) return proxyPacienteCelulares(request, "DELETE");
  const { id } = parseQueryParams(request);
  if (!id) return createErrorResponse({ errorMessage: "ID é obrigatório", status: 400 });
  const celularesCrud = new CrudOperations("paciente_celulares", context.token, PACIENTE_CELULARES_SCHEMA);
  const existing = await celularesCrud.findById(id);
  if (!existing) return createErrorResponse({ errorMessage: "Celular não encontrado", status: 404 });
  await celularesCrud.delete(id);
  return createSuccessResponse({ id });
}, true);
