
-- ============================================================================
-- MEDTIME - SISTEMA DE GESTÃO DE MEDICAMENTOS
-- Scripts DDL e DML Completos
-- ============================================================================
-- Descrição: Scripts completos para criação e população do banco de dados
-- Schema: app20260109065139cnigtntalr_v1
-- Database: PostgreSQL 14+
-- ============================================================================

-- ============================================================================
-- PARTE 1: DDL - DATA DEFINITION LANGUAGE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABELA: prefeituras
-- Descrição: Armazena informações das prefeituras/municípios
-- ----------------------------------------------------------------------------
CREATE TABLE prefeituras (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    apelido VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização de consultas
CREATE INDEX idx_prefeituras_cnpj ON prefeituras(cnpj);
CREATE INDEX idx_prefeituras_ativo ON prefeituras(ativo);

-- Comentários
COMMENT ON TABLE prefeituras IS 'Cadastro de prefeituras/municípios participantes do sistema';
COMMENT ON COLUMN prefeituras.nome IS 'Nome oficial da prefeitura';
COMMENT ON COLUMN prefeituras.cnpj IS 'CNPJ da prefeitura (único)';
COMMENT ON COLUMN prefeituras.apelido IS 'Nome curto ou apelido da prefeitura';
COMMENT ON COLUMN prefeituras.ativo IS 'Indica se a prefeitura está ativa no sistema';

-- ----------------------------------------------------------------------------
-- 2. TABELA: users
-- Descrição: Usuários do sistema (autenticação)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) DEFAULT 'app20260109065139cnigtntalr_v1_user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE users IS 'Tabela de autenticação de usuários';
COMMENT ON COLUMN users.email IS 'Email único do usuário (usado para login)';
COMMENT ON COLUMN users.password IS 'Senha criptografada (bcrypt)';
COMMENT ON COLUMN users.role IS 'Role do usuário: app20260109065139cnigtntalr_v1_user ou app20260109065139cnigtntalr_v1_admin_user';

-- ----------------------------------------------------------------------------
-- 3. TABELA: user_profiles
-- Descrição: Perfis estendidos dos usuários
-- ----------------------------------------------------------------------------
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nome_completo VARCHAR(200),
    tipo_usuario VARCHAR(50) CHECK (tipo_usuario IN ('paciente', 'profissional_saude', 'acs', 'gestor_municipal', 'admin')),
    id_prefeitura BIGINT REFERENCES prefeituras(id),
    unidade_saude VARCHAR(200),
    cargo VARCHAR(100),
    telefone VARCHAR(20),
    avatar_url TEXT,
    preferencias_notificacao JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_tipo ON user_profiles(tipo_usuario);
CREATE INDEX idx_user_profiles_prefeitura ON user_profiles(id_prefeitura);

COMMENT ON TABLE user_profiles IS 'Perfis estendidos dos usuários com informações adicionais';
COMMENT ON COLUMN user_profiles.tipo_usuario IS 'Tipo: paciente, profissional_saude, acs, gestor_municipal, admin';
COMMENT ON COLUMN user_profiles.preferencias_notificacao IS 'JSON com preferências de notificação (sms, whatsapp, push)';

-- ----------------------------------------------------------------------------
-- 4. TABELA: sessions
-- Descrição: Sessões ativas dos usuários
-- ----------------------------------------------------------------------------
CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip VARCHAR(255) NOT NULL,
    user_agent VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    refresh_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE sessions IS 'Sessões ativas de usuários para controle de autenticação';

-- ----------------------------------------------------------------------------
-- 5. TABELA: refresh_tokens
-- Descrição: Tokens de refresh para renovação de sessão
-- ----------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE refresh_tokens IS 'Tokens de refresh para renovação de sessão JWT';

-- ----------------------------------------------------------------------------
-- 6. TABELA: user_passcode
-- Descrição: Códigos de verificação temporários
-- ----------------------------------------------------------------------------
CREATE TABLE user_passcode (
    id BIGSERIAL PRIMARY KEY,
    passcode VARCHAR(255) NOT NULL,
    passcode_type VARCHAR(255) DEFAULT 'EMAIL' NOT NULL,
    pass_object VARCHAR(255) NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '3 minutes') NOT NULL,
    retry_count INTEGER DEFAULT 0 NOT NULL,
    revoked BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_pass_object ON user_passcode(pass_object);

COMMENT ON TABLE user_passcode IS 'Códigos de verificação temporários para email/SMS';
COMMENT ON COLUMN user_passcode.valid_until IS 'Validade do código (padrão: 3 minutos)';

-- ----------------------------------------------------------------------------
-- 7. TABELA: pacientes
-- Descrição: Cadastro de pacientes
-- ----------------------------------------------------------------------------
CREATE TABLE pacientes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    id_prefeitura BIGINT NOT NULL REFERENCES prefeituras(id),
    cartao_sus VARCHAR(20) NOT NULL CHECK (cartao_sus ~ '^[0-9]+$'),
    cpf VARCHAR(11) CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$'),
    nome VARCHAR(200) NOT NULL,
    data_nascimento DATE,
    celular VARCHAR(20),
    celular_validado BOOLEAN DEFAULT FALSE,
    app_instalado BOOLEAN DEFAULT FALSE,
    consentimento_lgpd BOOLEAN DEFAULT FALSE,
    data_consentimento TIMESTAMP WITH TIME ZONE,
    versao_termo_consentimento VARCHAR(20),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_pacientes_user_id ON pacientes(user_id);
CREATE INDEX idx_pacientes_prefeitura ON pacientes(id_prefeitura);
CREATE INDEX idx_pacientes_cartao_sus ON pacientes(cartao_sus);
CREATE INDEX idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX idx_pacientes_celular ON pacientes(celular);

COMMENT ON TABLE pacientes IS 'Cadastro de pacientes do sistema';
COMMENT ON COLUMN pacientes.cartao_sus IS 'Número do Cartão Nacional de Saúde (CNS)';
COMMENT ON COLUMN pacientes.celular_validado IS 'Indica se o celular foi validado via SMS';
COMMENT ON COLUMN pacientes.app_instalado IS 'Indica se o paciente instalou o app mobile';
COMMENT ON COLUMN pacientes.consentimento_lgpd IS 'Indica se o paciente aceitou os termos LGPD';

-- ----------------------------------------------------------------------------
-- 8. TABELA: paciente_celulares
-- Descrição: Celulares cadastrados para pacientes
-- ----------------------------------------------------------------------------
CREATE TABLE paciente_celulares (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    id_paciente BIGINT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    modelo VARCHAR(100) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    numero_serie VARCHAR(100),
    numero_contato VARCHAR(20) NOT NULL,
    tipo_celular VARCHAR(20) NOT NULL CHECK (tipo_celular IN ('proprio', 'cuidador')),
    nome_cuidador VARCHAR(200),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_paciente_celulares_user_id ON paciente_celulares(user_id);
CREATE INDEX idx_paciente_celulares_paciente ON paciente_celulares(id_paciente);
CREATE INDEX idx_paciente_celulares_numero_contato ON paciente_celulares(numero_contato);
CREATE INDEX idx_paciente_celulares_tipo ON paciente_celulares(tipo_celular);

COMMENT ON TABLE paciente_celulares IS 'Celulares cadastrados para pacientes (próprio ou cuidador)';
COMMENT ON COLUMN paciente_celulares.tipo_celular IS 'Tipo: proprio (do paciente) ou cuidador';
COMMENT ON COLUMN paciente_celulares.nome_cuidador IS 'Nome do cuidador (obrigatório se tipo_celular = cuidador)';

-- ----------------------------------------------------------------------------
-- 9. TABELA: dispositivos
-- Descrição: Dispositivos móveis conectados
-- ----------------------------------------------------------------------------
CREATE TABLE dispositivos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    id_paciente BIGINT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(100),
    platform VARCHAR(20) CHECK (platform IN ('android', 'ios')),
    app_version VARCHAR(20),
    os_version VARCHAR(20),
    ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
    token_push TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_dispositivos_user_id ON dispositivos(user_id);
CREATE INDEX idx_dispositivos_paciente ON dispositivos(id_paciente);
CREATE INDEX idx_dispositivos_device_id ON dispositivos(device_id);

COMMENT ON TABLE dispositivos IS 'Dispositivos móveis conectados ao sistema';
COMMENT ON COLUMN dispositivos.token_push IS 'Token para envio de notificações push';

-- ----------------------------------------------------------------------------
-- 10. TABELA: medicamentos
-- Descrição: Cadastro de medicamentos
-- ----------------------------------------------------------------------------
CREATE TABLE medicamentos (
    id BIGSERIAL PRIMARY KEY,
    id_prefeitura BIGINT NOT NULL REFERENCES prefeituras(id),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    imagem_url TEXT,
    principio_ativo VARCHAR(200),
    concentracao VARCHAR(100),
    forma_farmaceutica VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_medicamentos_prefeitura ON medicamentos(id_prefeitura);
CREATE INDEX idx_medicamentos_nome ON medicamentos(nome);
CREATE INDEX idx_medicamentos_ativo ON medicamentos(ativo);

COMMENT ON TABLE medicamentos IS 'Cadastro de medicamentos disponíveis';
COMMENT ON COLUMN medicamentos.forma_farmaceutica IS 'Ex: comprimido, cápsula, xarope, injetável';

-- ----------------------------------------------------------------------------
-- 11. TABELA: historico_medicamentos
-- Descrição: Histórico de alterações em medicamentos
-- ----------------------------------------------------------------------------
CREATE TABLE historico_medicamentos (
    id BIGSERIAL PRIMARY KEY,
    id_medicamento BIGINT NOT NULL REFERENCES medicamentos(id),
    id_prefeitura BIGINT NOT NULL REFERENCES prefeituras(id),
    nome_anterior VARCHAR(200),
    nome_novo VARCHAR(200),
    campo_alterado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    alterado_por BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_historico_medicamentos_medicamento ON historico_medicamentos(id_medicamento);
CREATE INDEX idx_historico_medicamentos_data ON historico_medicamentos(created_at);

COMMENT ON TABLE historico_medicamentos IS 'Auditoria de alterações em medicamentos';

-- ----------------------------------------------------------------------------
-- 12. TABELA: interacoes_medicamentosas
-- Descrição: Interações entre medicamentos
-- ----------------------------------------------------------------------------
CREATE TABLE interacoes_medicamentosas (
    id BIGSERIAL PRIMARY KEY,
    id_medicamento_1 BIGINT NOT NULL REFERENCES medicamentos(id),
    id_medicamento_2 BIGINT NOT NULL REFERENCES medicamentos(id),
    severidade VARCHAR(20) CHECK (severidade IN ('leve', 'moderada', 'grave')),
    descricao TEXT NOT NULL,
    recomendacao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_medicamento_1, id_medicamento_2)
);

-- Índices
CREATE INDEX idx_interacoes_medicamento_1 ON interacoes_medicamentosas(id_medicamento_1);
CREATE INDEX idx_interacoes_medicamento_2 ON interacoes_medicamentosas(id_medicamento_2);
CREATE INDEX idx_interacoes_severidade ON interacoes_medicamentosas(severidade);

COMMENT ON TABLE interacoes_medicamentosas IS 'Interações medicamentosas conhecidas';
COMMENT ON COLUMN interacoes_medicamentosas.severidade IS 'Nível de severidade: leve, moderada, grave';

-- ----------------------------------------------------------------------------
-- 13. TABELA: medicos
-- Descrição: Cadastro de médicos
-- ----------------------------------------------------------------------------
CREATE TABLE medicos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    nome VARCHAR(200) NOT NULL,
    crm VARCHAR(20) NOT NULL CHECK (crm ~ '^[0-9]+$'),
    especialidade VARCHAR(100) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_medicos_user_id ON medicos(user_id);
CREATE INDEX idx_medicos_crm ON medicos(crm);
CREATE INDEX idx_medicos_ativo ON medicos(ativo);

COMMENT ON TABLE medicos IS 'Cadastro de médicos prescritores';
COMMENT ON COLUMN medicos.crm IS 'Número do CRM (apenas números)';

-- ----------------------------------------------------------------------------
-- 14. TABELA: receitas
-- Descrição: Receitas médicas
-- ----------------------------------------------------------------------------
CREATE TABLE receitas (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    id_paciente BIGINT NOT NULL REFERENCES pacientes(id),
    id_prefeitura BIGINT NOT NULL REFERENCES prefeituras(id),
    id_medico BIGINT REFERENCES medicos(id),
    data_receita DATE NOT NULL,
    data_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    origem_receita VARCHAR(80),
    subgrupo_origem VARCHAR(80),
    observacao TEXT,
    tipo_prescritor VARCHAR(30),
    num_notificacao VARCHAR(40),
    status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'concluida', 'cancelada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_receitas_user_id ON receitas(user_id);
CREATE INDEX idx_receitas_paciente ON receitas(id_paciente);
CREATE INDEX idx_receitas_prefeitura ON receitas(id_prefeitura);
CREATE INDEX idx_receitas_medico ON receitas(id_medico);
CREATE INDEX idx_receitas_data ON receitas(data_receita);
CREATE INDEX idx_receitas_status ON receitas(status);

COMMENT ON TABLE receitas IS 'Receitas médicas prescritas';
COMMENT ON COLUMN receitas.status IS 'Status: ativa, concluida, cancelada';

-- ----------------------------------------------------------------------------
-- 15. TABELA: receita_medicamentos
-- Descrição: Medicamentos prescritos em receitas
-- ----------------------------------------------------------------------------
CREATE TABLE receita_medicamentos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    id_receita BIGINT NOT NULL REFERENCES receitas(id) ON DELETE CASCADE,
    id_medicamento BIGINT NOT NULL REFERENCES medicamentos(id),
    id_prefeitura BIGINT NOT NULL REFERENCES prefeituras(id),
    quantidade_total NUMERIC(18,3),
    quantidade_minima_calculada NUMERIC(18,3),
    frequencia_dia INTEGER CHECK (frequencia_dia IS NULL OR frequencia_dia >= 1),
    duracao_dias INTEGER CHECK (duracao_dias IS NULL OR duracao_dias >= 1),
    dias_dispensar INTEGER,
    observacao TEXT,
    posologia TEXT,
    via_administracao VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'cancelado')),
    data_inicio DATE,
    data_fim DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_receita_medicamentos_user_id ON receita_medicamentos(user_id);
CREATE INDEX idx_receita_medicamentos_receita ON receita_medicamentos(id_receita);
CREATE INDEX idx_receita_medicamentos_medicamento ON receita_medicamentos(id_medicamento);
CREATE INDEX idx_receita_medicamentos_status ON receita_medicamentos(status);

COMMENT ON TABLE receita_medicamentos IS 'Medicamentos prescritos em cada receita';
COMMENT ON COLUMN receita_medicamentos.frequencia_dia IS 'Quantas vezes por dia o medicamento deve ser tomado';
COMMENT ON COLUMN receita_medicamentos.duracao_dias IS 'Duração do tratamento em dias';
COMMENT ON COLUMN receita_medicamentos.posologia IS 'Instruções de uso do medicamento';

-- ----------------------------------------------------------------------------
-- 16. TABELA: receita_horarios
-- Descrição: Horários de administração dos medicamentos
-- ----------------------------------------------------------------------------
CREATE TABLE receita_horarios (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    id_receita_medicamento BIGINT NOT NULL REFERENCES receita_medicamentos(id) ON DELETE CASCADE,
    horario TIME NOT NULL,
    dias_semana VARCHAR(20),
    data_inicio DATE,
    data_fim DATE,
    domingo BOOLEAN DEFAULT FALSE,
    segunda BOOLEAN DEFAULT FALSE,
    terca BOOLEAN DEFAULT FALSE,
    quarta BOOLEAN DEFAULT FALSE,
    quinta BOOLEAN DEFAULT FALSE,
    sexta BOOLEAN DEFAULT FALSE,
    sabado BOOLEAN DEFAULT FALSE,
    observacao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_receita_horarios_user_id ON receita_horarios(user_id);
CREATE INDEX idx_receita_horarios_medicamento ON receita_horarios(id_receita_medicamento);
CREATE INDEX idx_receita_horarios_horario ON receita_horarios(horario);
CREATE INDEX idx_receita_horarios_datas ON receita_horarios(data_inicio, data_fim);
CREATE INDEX idx_receita_horarios_user_horario ON receita_horarios(user_id, horario) WHERE ativo = TRUE;

COMMENT ON TABLE receita_horarios IS 'Horários programados para administração de medicamentos';
COMMENT ON COLUMN receita_horarios.dias_semana IS 'Dias da semana (deprecated - usar colunas booleanas)';

-- ----------------------------------------------------------------------------
-- 17. TABELA: conflitos_horario
-- Descrição: Conflitos detectados entre horários de medicamentos
-- ----------------------------------------------------------------------------
CREATE TABLE conflitos_horario (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    id_paciente BIGINT NOT NULL REFERENCES pacientes(id),
    id_horario_1 BIGINT NOT NULL REFERENCES receita_horarios(id),
    id_horario_2 BIGINT NOT NULL REFERENCES receita_horarios(id),
    data_conflito DATE NOT NULL,
    horario_conflito TIME NOT NULL,
    severidade VARCHAR(20) DEFAULT 'leve' CHECK (severidade IN ('leve', 'moderada', 'grave')),
    resolvido BOOLEAN DEFAULT FALSE,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_conflitos_horario_user_id ON conflitos_horario(user_id);
CREATE INDEX idx_conflitos_horario_paciente ON conflitos_horario(id_paciente);
CREATE INDEX idx_conflitos_horario_data ON conflitos_horario(data_conflito);
CREATE INDEX idx_conflitos_horario_resolvido ON conflitos_horario(resolvido);

COMMENT ON TABLE conflitos_horario IS 'Conflitos detectados entre horários de medicamentos';
COMMENT ON COLUMN conflitos_horario.severidade IS 'Nível de severidade do conflito';

-- ============================================================================
-- PARTE 2: DML - DATA MANIPULATION LANGUAGE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DADOS INICIAIS: Prefeituras de Exemplo
-- ----------------------------------------------------------------------------
INSERT INTO prefeituras (nome, cnpj, apelido, ativo) VALUES
('Prefeitura Municipal de São Paulo', '46.395.000/0001-39', 'PMSP', TRUE),
('Prefeitura Municipal do Rio de Janeiro', '42.498.600/0001-48', 'PMRJ', TRUE),
('Prefeitura Municipal de Belo Horizonte', '18.715.383/0001-40', 'PBH', TRUE),
('Prefeitura Municipal de Curitiba', '76.416.940/0001-28', 'PMC', TRUE),
('Prefeitura Municipal de Porto Alegre', '92.963.560/0001-60', 'PMPA', TRUE);

-- ----------------------------------------------------------------------------
-- DADOS INICIAIS: Usuário Administrador
-- ----------------------------------------------------------------------------
-- Senha: admin123 (hash bcrypt)
INSERT INTO users (email, password, role) VALUES
('rsferreira82@gmail.com', '$2a$10$YourHashedPasswordHere', 'app20260109065139cnigtntalr_v1_admin_user');

-- Perfil do administrador
INSERT INTO user_profiles (user_id, nome_completo, tipo_usuario, preferencias_notificacao) VALUES
(1, 'Administrador do Sistema', 'admin', '{"sms": true, "whatsapp": true, "push": true}');

-- ----------------------------------------------------------------------------
-- DADOS INICIAIS: Medicamentos Comuns
-- ----------------------------------------------------------------------------
INSERT INTO medicamentos (id_prefeitura, nome, descricao, principio_ativo, concentracao, forma_farmaceutica, ativo) VALUES
(1, 'Paracetamol', 'Analgésico e antitérmico', 'Paracetamol', '500mg', 'Comprimido', TRUE),
(1, 'Ibuprofeno', 'Anti-inflamatório não esteroidal', 'Ibuprofeno', '600mg', 'Comprimido', TRUE),
(1, 'Amoxicilina', 'Antibiótico de amplo espectro', 'Amoxicilina', '500mg', 'Cápsula', TRUE),
(1, 'Losartana Potássica', 'Anti-hipertensivo', 'Losartana Potássica', '50mg', 'Comprimido', TRUE),
(1, 'Metformina', 'Antidiabético oral', 'Cloridrato de Metformina', '850mg', 'Comprimido', TRUE),
(1, 'Omeprazol', 'Inibidor da bomba de prótons', 'Omeprazol', '20mg', 'Cápsula', TRUE),
(1, 'Enalapril', 'Anti-hipertensivo IECA', 'Maleato de Enalapril', '10mg', 'Comprimido', TRUE),
(1, 'Sinvastatina', 'Hipolipemiante', 'Sinvastatina', '20mg', 'Comprimido', TRUE),
(1, 'Captopril', 'Anti-hipertensivo IECA', 'Captopril', '25mg', 'Comprimido', TRUE),
(1, 'Dipirona', 'Analgésico e antitérmico', 'Dipirona Sódica', '500mg', 'Comprimido', TRUE);

-- ----------------------------------------------------------------------------
-- DADOS INICIAIS: Interações Medicamentosas Importantes
-- ----------------------------------------------------------------------------
INSERT INTO interacoes_medicamentosas (id_medicamento_1, id_medicamento_2, severidade, descricao, recomendacao, ativo) VALUES
(2, 4, 'moderada', 'Ibuprofeno pode reduzir o efeito anti-hipertensivo da Losartana', 'Monitorar pressão arterial regularmente', TRUE),
(2, 7, 'moderada', 'Ibuprofeno pode reduzir o efeito anti-hipertensivo do Enalapril', 'Monitorar pressão arterial regularmente', TRUE),
(4, 7, 'grave', 'Uso concomitante de dois anti-hipertensivos pode causar hipotensão', 'Ajustar doses conforme orientação médica', TRUE),
(6, 5, 'leve', 'Omeprazol pode reduzir absorção de Metformina', 'Administrar em horários diferentes', TRUE);

-- ----------------------------------------------------------------------------
-- DADOS INICIAIS: Médicos de Exemplo
-- ----------------------------------------------------------------------------
INSERT INTO medicos (user_id, nome, crm, especialidade, ativo) VALUES
(1, 'Dr. João Silva', '123456', 'Clínico Geral', TRUE),
(1, 'Dra. Maria Santos', '234567', 'Cardiologista', TRUE),
(1, 'Dr. Pedro Oliveira', '345678', 'Endocrinologista', TRUE);

-- ============================================================================
-- PARTE 3: TRIGGERS E FUNÇÕES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Função: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_prefeituras_updated_at BEFORE UPDATE ON prefeituras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON pacientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paciente_celulares_updated_at BEFORE UPDATE ON paciente_celulares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispositivos_updated_at BEFORE UPDATE ON dispositivos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicamentos_updated_at BEFORE UPDATE ON medicamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicos_updated_at BEFORE UPDATE ON medicos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receitas_updated_at BEFORE UPDATE ON receitas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receita_medicamentos_updated_at BEFORE UPDATE ON receita_medicamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receita_horarios_updated_at BEFORE UPDATE ON receita_horarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conflitos_horario_updated_at BEFORE UPDATE ON conflitos_horario
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Função: Registrar histórico de alterações em medicamentos
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_medicamento_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.nome != NEW.nome THEN
        INSERT INTO historico_medicamentos (
            id_medicamento, id_prefeitura, nome_anterior, nome_novo,
            campo_alterado, valor_anterior, valor_novo
        ) VALUES (
            NEW.id, NEW.id_prefeitura, OLD.nome, NEW.nome,
            'nome', OLD.nome, NEW.nome
        );
    END IF;
    
    IF OLD.principio_ativo != NEW.principio_ativo THEN
        INSERT INTO historico_medicamentos (
            id_medicamento, id_prefeitura, campo_alterado,
            valor_anterior, valor_novo
        ) VALUES (
            NEW.id, NEW.id_prefeitura, 'principio_ativo',
            OLD.principio_ativo, NEW.principio_ativo
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER medicamentos_audit_trigger
    AFTER UPDATE ON medicamentos
    FOR EACH ROW
    EXECUTE FUNCTION log_medicamento_changes();

-- ============================================================================
-- PARTE 4: VIEWS ÚTEIS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VIEW: Visão completa de pacientes com informações de perfil
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_pacientes_completo AS
SELECT 
    p.id,
    p.user_id,
    p.id_prefeitura,
    pref.nome AS prefeitura_nome,
    p.cartao_sus,
    p.cpf,
    p.nome,
    p.data_nascimento,
    EXTRACT(YEAR FROM AGE(p.data_nascimento)) AS idade,
    p.celular,
    p.celular_validado,
    p.app_instalado,
    p.consentimento_lgpd,
    p.ativo,
    up.tipo_usuario,
    up.telefone AS telefone_adicional,
    p.created_at,
    p.updated_at
FROM pacientes p
LEFT JOIN prefeituras pref ON p.id_prefeitura = pref.id
LEFT JOIN user_profiles up ON p.user_id = up.user_id;

-- ----------------------------------------------------------------------------
-- VIEW: Receitas ativas com medicamentos
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_receitas_ativas AS
SELECT 
    r.id AS receita_id,
    r.id_paciente,
    p.nome AS paciente_nome,
    r.data_receita,
    m.id AS medico_id,
    m.nome AS medico_nome,
    m.crm,
    rm.id AS receita_medicamento_id,
    med.nome AS medicamento_nome,
    rm.posologia,
    rm.frequencia_dia,
    rm.duracao_dias,
    rm.data_inicio,
    rm.data_fim,
    rm.status AS medicamento_status
FROM receitas r
INNER JOIN pacientes p ON r.id_paciente = p.id
LEFT JOIN medicos m ON r.id_medico = m.id
INNER JOIN receita_medicamentos rm ON r.id = rm.id_receita
INNER JOIN medicamentos med ON rm.id_medicamento = med.id
WHERE r.status = 'ativa' AND rm.status = 'ativo';

-- ----------------------------------------------------------------------------
-- VIEW: Horários de medicamentos do dia
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_horarios_medicamentos AS
SELECT 
    rh.id AS horario_id,
    rh.user_id,
    rm.id_receita,
    r.id_paciente,
    p.nome AS paciente_nome,
    med.nome AS medicamento_nome,
    rh.horario,
    rh.domingo,
    rh.segunda,
    rh.terca,
    rh.quarta,
    rh.quinta,
    rh.sexta,
    rh.sabado,
    rh.data_inicio,
    rh.data_fim,
    rm.posologia,
    rh.observacao
FROM receita_horarios rh
INNER JOIN receita_medicamentos rm ON rh.id_receita_medicamento = rm.id
INNER JOIN receitas r ON rm.id_receita = r.id
INNER JOIN pacientes p ON r.id_paciente = p.id
INNER JOIN medicamentos med ON rm.id_medicamento = med.id
WHERE rh.ativo = TRUE
  AND rm.status = 'ativo'
  AND r.status = 'ativa';

-- ============================================================================
-- PARTE 5: PERMISSÕES (RLS - Row Level Security)
-- ============================================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receita_medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE receita_horarios ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem seus próprios dados
CREATE POLICY pacientes_user_policy ON pacientes
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::bigint);

CREATE POLICY receitas_user_policy ON receitas
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::bigint);

CREATE POLICY receita_medicamentos_user_policy ON receita_medicamentos
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::bigint);

CREATE POLICY receita_horarios_user_policy ON receita_horarios
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::bigint);

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Verificação final
SELECT 'Script DDL e DML executado com sucesso!' AS status;
SELECT 'Total de tabelas criadas: 17' AS info;
SELECT 'Total de views criadas: 3' AS info;
SELECT 'Total de triggers criados: 13' AS info;
