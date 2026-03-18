
# 🚀 Guia de Configuração - MEDTIME

Este guia irá ajudá-lo a configurar e executar o projeto MEDTIME corretamente.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- pnpm instalado (`npm install -g pnpm`)
- Acesso ao banco de dados PostgREST

## 🔧 Passo a Passo de Configuração

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd <nome-do-projeto>
```

### 2. Instalar Dependências

```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente

#### 3.1. Copiar o arquivo de exemplo

```bash
cp .env.example .env.local
```

#### 3.2. Editar o arquivo `.env.local`

Abra o arquivo `.env.local` e preencha as seguintes variáveis:

```env
# ============================================
# CONFIGURAÇÕES DO BANCO DE DADOS (OBRIGATÓRIO)
# ============================================
POSTGREST_URL=https://seu-postgrest-url.com
POSTGREST_SCHEMA=app20260109065139cnigtntalr_v1
POSTGREST_API_KEY=sua-chave-api-aqui

# ============================================
# CONFIGURAÇÕES DE AUTENTICAÇÃO (OBRIGATÓRIO)
# ============================================
NEXT_PUBLIC_ENABLE_AUTH=true
JWT_SECRET=sua-chave-secreta-jwt-muito-segura-aqui
SCHEMA_USER=app20260109065139cnigtntalr_v1_user
SCHEMA_ADMIN_USER=app20260109065139cnigtntalr_v1_admin_user

# ============================================
# CONFIGURAÇÕES OPCIONAIS
# ============================================
NEXT_PUBLIC_ZOER_HOST=https://zoer.cloud
```

**⚠️ IMPORTANTE:**
- Substitua `sua-chave-api-aqui` pela chave real do PostgREST
- Substitua `sua-chave-secreta-jwt-muito-segura-aqui` por uma string aleatória e segura
- Substitua `https://seu-postgrest-url.com` pela URL real do seu PostgREST

### 4. Verificar Configuração

Execute o script de verificação para garantir que todas as variáveis estão configuradas:

```bash
pnpm check:env
```

Se tudo estiver correto, você verá:

```
✅ Todas as variáveis obrigatórias estão configuradas!
🚀 Você pode iniciar a aplicação com: pnpm dev
```

### 5. Criar Usuário Administrador (Primeira Execução)

Antes de iniciar a aplicação pela primeira vez, crie um usuário administrador:

```bash
pnpm seed:admin
```

Siga as instruções no terminal para criar o usuário admin.

### 6. Iniciar a Aplicação

```bash
pnpm dev
```

A aplicação estará disponível em: `http://localhost:3000`

## 🔍 Solução de Problemas

### Erro 502 Bad Gateway

Este erro geralmente ocorre quando:

1. **Variáveis de ambiente não configuradas**
   - Solução: Execute `pnpm check:env` para verificar

2. **PostgREST não está acessível**
   - Verifique se a URL do PostgREST está correta
   - Teste a conexão: `curl https://seu-postgrest-url.com`

3. **Chave de API inválida**
   - Verifique se a `POSTGREST_API_KEY` está correta

### Erro de Autenticação

Se você receber erros de autenticação:

1. Verifique se `JWT_SECRET` está configurado
2. Verifique se `NEXT_PUBLIC_ENABLE_AUTH=true`
3. Limpe os cookies do navegador e tente novamente

### Erro de Conexão com Banco de Dados

1. Verifique se o `POSTGREST_SCHEMA` está correto
2. Verifique se as roles do banco estão configuradas:
   - `SCHEMA_USER=app20260109065139cnigtntalr_v1_user`
   - `SCHEMA_ADMIN_USER=app20260109065139cnigtntalr_v1_admin_user`

## 📝 Comandos Úteis

```bash
# Verificar variáveis de ambiente
pnpm check:env

# Criar usuário administrador
pnpm seed:admin

# Iniciar em modo desenvolvimento
pnpm dev

# Iniciar em modo debug
pnpm dev:debug

# Build para produção
pnpm build

# Iniciar em produção
pnpm start

# Verificar erros de lint
pnpm lint
```

## 🔐 Segurança

**⚠️ NUNCA COMMITE O ARQUIVO `.env.local` NO GIT!**

O arquivo `.env.local` contém informações sensíveis e já está incluído no `.gitignore`.

## 📞 Suporte

Se você continuar tendo problemas:

1. Execute `pnpm check:env` e compartilhe o resultado (sem expor as chaves)
2. Verifique os logs do console do navegador (F12)
3. Verifique os logs do terminal onde o servidor está rodando

## 🎯 Próximos Passos

Após a configuração bem-sucedida:

1. Acesse `http://localhost:3000/login`
2. Faça login com o usuário administrador criado
3. Explore as funcionalidades do sistema
4. Configure os dados iniciais (prefeituras, medicamentos, etc.)
