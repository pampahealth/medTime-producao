# Scripts de banco (FrontEnd)

- **schema_postgrest.sql** – Schema usado quando o front usa PostgREST (sem proxy).
- **202508***.sql** – Migrações/schemas de auth e roles (modo PostgREST).
- **shared_db_connector.sql** – Conector compartilhado.

Quando `USE_BACKEND_PROXY=true`, o front usa a API do ProjetoRotas (Supabase); o schema do backend está em `apps/ProjetoRotas/base_do_supabase.sql` (a partir da raiz do repositório).
