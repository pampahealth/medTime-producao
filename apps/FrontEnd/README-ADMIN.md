
# Configuração do Usuário Administrador

## Credenciais de Teste

Para facilitar os testes durante o desenvolvimento, foi criado um usuário administrador padrão:

- **Email:** rsferreira82@gmail.com
- **Senha:** admin123

## Como Criar o Usuário Administrador

### Opção 1: Usando o Script de Seed (Recomendado)

Execute o seguinte comando no terminal:

```bash
pnpm seed:admin
```

Este script irá:
- Criar o usuário administrador se ele não existir
- Atualizar a senha se o usuário já existir
- Criar/atualizar o perfil do usuário com tipo 'admin'

### Opção 2: Inserção Manual no Banco de Dados

Se preferir inserir manualmente, execute os seguintes comandos SQL:

```sql
-- 1. Inserir o usuário (substitua o hash da senha pelo resultado de bcrypt.hash('admin123', 12))
INSERT INTO users (email, password, role)
VALUES (
  'rsferreira82@gmail.com',
  '$2a$12$[HASH_DA_SENHA_AQUI]',
  'app20260109065139cnigtntalr_v1_admin_user'
);

-- 2. Obter o ID do usuário criado
SELECT id FROM users WHERE email = 'rsferreira82@gmail.com';

-- 3. Criar o perfil do administrador (substitua [USER_ID] pelo ID obtido acima)
INSERT INTO user_profiles (user_id, tipo_usuario, nome_completo, preferencias_notificacao)
VALUES (
  [USER_ID],
  'admin',
  'Administrador do Sistema',
  '{"sms": true, "whatsapp": true, "push": true}'
);
```

## Tipos de Usuário

O sistema MEDTIME possui os seguintes tipos de usuário:

- **paciente**: Usuário comum que recebe lembretes de medicamentos
- **profissional_saude**: Profissional de saúde da UBS
- **acs**: Agente Comunitário de Saúde
- **gestor_municipal**: Gestor municipal de saúde
- **admin**: Administrador do sistema (acesso total)

## Permissões

### Usuário Admin (isAdmin: true)
- Acesso ao Dashboard administrativo
- Gerenciamento de medicamentos
- Gerenciamento de pacientes
- Gerenciamento de receitas
- Visualização de relatórios
- Configurações do sistema

### Usuário Paciente (isAdmin: false)
- Visualização dos próprios medicamentos
- Histórico de medicamentos
- Configurações de perfil

## Fluxo de Login

1. Acesse a página de login: `/login`
2. Digite o email: `rsferreira82@gmail.com`
3. Digite a senha: `admin123`
4. Clique em "Entrar"
5. Você será redirecionado para o Dashboard administrativo

## Segurança

⚠️ **IMPORTANTE**: 
- Estas credenciais são apenas para desenvolvimento/teste
- Em produção, altere imediatamente a senha padrão
- Nunca compartilhe credenciais de administrador
- Use senhas fortes e únicas para cada ambiente

## Troubleshooting

### Erro: "Usuário não encontrado"
- Execute o script de seed: `pnpm seed:admin`
- Verifique se o banco de dados está acessível
- Confirme que as variáveis de ambiente estão configuradas

### Erro: "Senha inválida"
- Verifique se está usando a senha correta: `admin123`
- Execute novamente o script de seed para resetar a senha

### Erro: "Perfil não encontrado"
- O script de seed cria automaticamente o perfil
- Execute: `pnpm seed:admin` para corrigir

## Próximos Passos

Após fazer login como administrador, você pode:

1. Criar prefeituras no sistema
2. Cadastrar medicamentos
3. Cadastrar pacientes
4. Criar receitas e horários de medicamentos
5. Visualizar estatísticas no dashboard
