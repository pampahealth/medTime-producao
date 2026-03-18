# Revisão de código – resumo

Revisão focada em qualidade, consistência e manutenção. Alterações feitas diretamente no código.

## Alterações realizadas

### FrontEnd (`apps/FrontEnd`)

- **`src/lib/api-client.ts`**
  - Removido bloco de código comentado (toast/redirect em erro 401).
  - Removida função `redirectToLogin()` não utilizada.
  - Comportamento da API e tratamento de erro mantidos.

- **`src/app/receitas/page.tsx`**
  - **Bug corrigido:** `posologiaSugestoes` (useMemo) usava `tempMedicamentos` e `receitaMedicamentos` antes da declaração, causando "Cannot access 'tempMedicamentos' before initialization". O `useMemo` foi movido para **depois** dos `useState` de `tempMedicamentos` e `tempAgendamentos`.
  - Removido import não utilizado: `CardTitle` (de `@/components/ui/card`).

- **`src/lib/server-utils.ts`**
  - Removida função `pbkdf2Verify` não utilizada em nenhum lugar do projeto.

### Backend (`apps/ProjetoRotas`)

- **`src/middlewares/error-handling.ts`**
  - Resposta de validação (Zod) passa a incluir a **primeira mensagem útil**: `campo: mensagem` (ex.: `a005_id_medico: Invalid uuid`), em vez de só "Validation error".
  - Parâmetro não usado do handler de erro renomeado para `_request` (assinatura de 4 argumentos mantida para o Express).

## O que foi verificado (sem alteração)

- **Lib**: `api-utils`, `create-response`, `backend-proxy`, `crud-operations`, `postgrest` – uso consistente, sem código morto relevante.
- **Next API**: Rotas de proxy, agendamentos e paciente-celulares – tratamento de erro e fallbacks já ajustados em mudanças anteriores.
- **Backend**: Controllers medtime e middlewares – uso de `AppError`, Zod e respostas HTTP coerentes.
- **Hooks e componentes**: `use-mobile`, `use-toast`, `useZoerIframe` – em uso.
- **Dependências**: Todas as listadas em `package.json` têm uso identificado no projeto (incl. Resend em `api-utils`).

## Sugestões para próximos passos (opcional)

1. **Testes**: Se houver testes e2e ou de API, rodar após as mudanças e ajustar se algo depender do texto antigo "Validation error".
2. **Páginas muito grandes**: `receitas/page.tsx` é a mais longa (~2200 linhas); em futuras refatorações, pode ser dividida em subcomponentes (ex.: wizard de receita, lista, detalhes) para reduzir complexidade.
3. **Documentação de API**: Manter `docs/API.md` e schemas do backend alinhados aos endpoints e formatos de erro (incluindo o novo formato de validação Zod).

## Comportamento preservado

- Fluxo de autenticação e refresh de token.
- Proxy para o backend e mapeamento de entidades.
- Criação/edição de receitas, medicamentos, médicos, pacientes e celulares.
- Agendamentos (incluindo fallback com lista vazia quando a tabela não existir).
