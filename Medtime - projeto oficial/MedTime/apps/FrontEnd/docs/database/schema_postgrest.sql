
-- Extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de municípios (prefeituras) - sem RLS pois é dado compartilhado
CREATE TABLE prefeituras (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    apelido VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prefeituras_cnpj ON prefeituras(cnpj);
CREATE INDEX idx_prefeituras_ativo ON prefeituras(ativo);

-- Tabela de medicamentos - catálogo mestre com etiquetas fixas
CREATE TABLE medicamentos (
    id BIGSERIAL PRIMARY KEY,
    id_prefeitura BIGINT NOT NULL,
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

CREATE INDEX idx_medicamentos_prefeitura ON medicamentos(id_prefeitura);
CREATE INDEX idx_medicamentos_nome ON medicamentos(nome);
CREATE INDEX idx_medicamentos_ativo ON medicamentos(ativo);

-- Tabela de histórico de medicamentos - auditoria
CREATE TABLE historico_medicamentos (
    id BIGSERIAL PRIMARY KEY,
    id_medicamento BIGINT NOT NULL,
    id_prefeitura BIGINT NOT NULL,
    nome_anterior VARCHAR(200),
    nome_novo VARCHAR(200),
    campo_alterado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    alterado_por BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historico_medicamentos_medicamento ON historico_medicamentos(id_medicamento);
CREATE INDEX idx_historico_medicamentos_data ON historico_medicamentos(created_at);

-- Tabela de pacientes
CREATE TABLE pacientes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    id_prefeitura BIGINT NOT NULL,
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

CREATE INDEX idx_pacientes_user_id ON pacientes(user_id);
CREATE INDEX idx_pacientes_prefeitura ON pacientes(id_prefeitura);
CREATE INDEX idx_pacientes_cartao_sus ON pacientes(cartao_sus);
CREATE INDEX idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX idx_pacientes_celular ON pacientes(celular);

-- Habilitar RLS para pacientes
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY pacientes_select_policy ON pacientes
    FOR SELECT USING (user_id = uid());

CREATE POLICY pacientes_insert_policy ON pacientes
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY pacientes_update_policy ON pacientes
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY pacientes_delete_policy ON pacientes
    FOR DELETE USING (user_id = uid());

-- Tabela de receitas (prescrições)
CREATE TABLE receitas (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    id_paciente BIGINT NOT NULL,
    id_prefeitura BIGINT NOT NULL,
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

CREATE INDEX idx_receitas_user_id ON receitas(user_id);
CREATE INDEX idx_receitas_paciente ON receitas(id_paciente);
CREATE INDEX idx_receitas_prefeitura ON receitas(id_prefeitura);
CREATE INDEX idx_receitas_data ON receitas(data_receita);
CREATE INDEX idx_receitas_status ON receitas(status);

-- Habilitar RLS para receitas
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY receitas_select_policy ON receitas
    FOR SELECT USING (user_id = uid());

CREATE POLICY receitas_insert_policy ON receitas
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY receitas_update_policy ON receitas
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY receitas_delete_policy ON receitas
    FOR DELETE USING (user_id = uid());

-- Tabela de itens da receita (medicamentos prescritos)
CREATE TABLE receita_medicamentos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    id_receita BIGINT NOT NULL,
    id_medicamento BIGINT NOT NULL,
    id_prefeitura BIGINT NOT NULL,
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

CREATE INDEX idx_receita_medicamentos_user_id ON receita_medicamentos(user_id);
CREATE INDEX idx_receita_medicamentos_receita ON receita_medicamentos(id_receita);
CREATE INDEX idx_receita_medicamentos_medicamento ON receita_medicamentos(id_medicamento);
CREATE INDEX idx_receita_medicamentos_status ON receita_medicamentos(status);

-- Habilitar RLS para receita_medicamentos
ALTER TABLE receita_medicamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY receita_medicamentos_select_policy ON receita_medicamentos
    FOR SELECT USING (user_id = uid());

CREATE POLICY receita_medicamentos_insert_policy ON receita_medicamentos
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY receita_medicamentos_update_policy ON receita_medicamentos
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY receita_medicamentos_delete_policy ON receita_medicamentos
    FOR DELETE USING (user_id = uid());

-- Tabela de horários de alarme
CREATE TABLE receita_horarios (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    id_receita_medicamento BIGINT NOT NULL,
    horario TIME NOT NULL,
    dias_semana VARCHAR(20),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receita_horarios_user_id ON receita_horarios(user_id);
CREATE INDEX idx_receita_horarios_medicamento ON receita_horarios(id_receita_medicamento);
CREATE INDEX idx_receita_horarios_horario ON receita_horarios(horario);

-- Habilitar RLS para receita_horarios
ALTER TABLE receita_horarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY receita_horarios_select_policy ON receita_horarios
    FOR SELECT USING (user_id = uid());

CREATE POLICY receita_horarios_insert_policy ON receita_horarios
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY receita_horarios_update_policy ON receita_horarios
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY receita_horarios_delete_policy ON receita_horarios
    FOR DELETE USING (user_id = uid());

-- Tabela de eventos de alarme (log de interações)
CREATE TABLE eventos_alarme (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    id_receita_medicamento BIGINT NOT NULL,
    id_horario BIGINT NOT NULL,
    data_hora_disparo TIMESTAMP WITH TIME ZONE NOT NULL,
    data_hora_interacao TIMESTAMP WITH TIME ZONE,
    tipo_interacao VARCHAR(20) CHECK (tipo_interacao IN ('tomou', 'adiou', 'ignorou', 'cancelou')),
    tentativas INTEGER NOT NULL DEFAULT 0,
    sms_enviado BOOLEAN DEFAULT FALSE,
    whatsapp_enviado BOOLEAN DEFAULT FALSE,
    data_envio_mensagem TIMESTAMP WITH TIME ZONE,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eventos_alarme_user_id ON eventos_alarme(user_id);
CREATE INDEX idx_eventos_alarme_medicamento ON eventos_alarme(id_receita_medicamento);
CREATE INDEX idx_eventos_alarme_horario ON eventos_alarme(id_horario);
CREATE INDEX idx_eventos_alarme_data_disparo ON eventos_alarme(data_hora_disparo);

-- Habilitar RLS para eventos_alarme
ALTER TABLE eventos_alarme ENABLE ROW LEVEL SECURITY;

CREATE POLICY eventos_alarme_select_policy ON eventos_alarme
    FOR SELECT USING (user_id = uid());

CREATE POLICY eventos_alarme_insert_policy ON eventos_alarme
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY eventos_alarme_update_policy ON eventos_alarme
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY eventos_alarme_delete_policy ON eventos_alarme
    FOR DELETE USING (user_id = uid());

-- Tabela de dispositivos (controle de sincronização mobile)
CREATE TABLE dispositivos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    id_paciente BIGINT NOT NULL,
    device_id VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(100),
    platform VARCHAR(20) CHECK (platform IN ('Android', 'iOS')),
    app_version VARCHAR(20),
    os_version VARCHAR(20),
    ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
    token_push TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dispositivos_user_id ON dispositivos(user_id);
CREATE INDEX idx_dispositivos_paciente ON dispositivos(id_paciente);
CREATE INDEX idx_dispositivos_device_id ON dispositivos(device_id);

-- Habilitar RLS para dispositivos
ALTER TABLE dispositivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY dispositivos_select_policy ON dispositivos
    FOR SELECT USING (user_id = uid());

CREATE POLICY dispositivos_insert_policy ON dispositivos
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY dispositivos_update_policy ON dispositivos
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY dispositivos_delete_policy ON dispositivos
    FOR DELETE USING (user_id = uid());

-- Tabela de interações medicamentosas (referência)
CREATE TABLE interacoes_medicamentosas (
    id BIGSERIAL PRIMARY KEY,
    id_medicamento_1 BIGINT NOT NULL,
    id_medicamento_2 BIGINT NOT NULL,
    severidade VARCHAR(20) CHECK (severidade IN ('leve', 'moderada', 'grave')),
    descricao TEXT NOT NULL,
    recomendacao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_medicamento_1, id_medicamento_2)
);

CREATE INDEX idx_interacoes_medicamento_1 ON interacoes_medicamentosas(id_medicamento_1);
CREATE INDEX idx_interacoes_medicamento_2 ON interacoes_medicamentosas(id_medicamento_2);
CREATE INDEX idx_interacoes_severidade ON interacoes_medicamentosas(severidade);

-- Tabela de perfis de usuário (extensão da tabela users)
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    nome_completo VARCHAR(200),
    tipo_usuario VARCHAR(50) CHECK (tipo_usuario IN ('paciente', 'profissional_saude', 'acs', 'gestor_municipal', 'admin')),
    id_prefeitura BIGINT,
    unidade_saude VARCHAR(200),
    cargo VARCHAR(100),
    telefone VARCHAR(20),
    avatar_url TEXT,
    preferencias_notificacao JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_tipo ON user_profiles(tipo_usuario);
CREATE INDEX idx_user_profiles_prefeitura ON user_profiles(id_prefeitura);

-- Habilitar RLS para user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profiles_select_policy ON user_profiles
    FOR SELECT USING (user_id = uid());

CREATE POLICY user_profiles_insert_policy ON user_profiles
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY user_profiles_update_policy ON user_profiles
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY user_profiles_delete_policy ON user_profiles
    FOR DELETE USING (user_id = uid());

-- Inserir perfil padrão para o admin (user_id = 1)
INSERT INTO user_profiles (user_id, tipo_usuario) VALUES (1, 'admin');

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prefeituras_updated_at BEFORE UPDATE ON prefeituras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicamentos_updated_at BEFORE UPDATE ON medicamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON pacientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receitas_updated_at BEFORE UPDATE ON receitas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receita_medicamentos_updated_at BEFORE UPDATE ON receita_medicamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receita_horarios_updated_at BEFORE UPDATE ON receita_horarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispositivos_updated_at BEFORE UPDATE ON dispositivos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interacoes_medicamentosas_updated_at BEFORE UPDATE ON interacoes_medicamentosas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar usuário administrador de teste
-- Nota: A senha 'admin123' será hasheada pelo sistema de autenticação
INSERT INTO users (email, password, role) 
VALUES (
    'rsferreira82@gmail.com',
    '$2a$10$rKJ5VqJxKqZ5YqJxKqZ5YuKJ5VqJxKqZ5YqJxKqZ5YqJxKqZ5YqJx', -- Hash bcrypt de 'admin123'
    'app20260109065139cnigtntalr_v1_admin_user'
);

-- Criar perfil do usuário administrador
-- Usando o ID 1 que será gerado automaticamente para o primeiro usuário
INSERT INTO user_profiles (user_id, nome_completo, tipo_usuario, telefone)
VALUES (
    1,
    'Administrador do Sistema',
    'admin',
    NULL
);

-- Criar uma prefeitura de teste para uso inicial
INSERT INTO prefeituras (nome, cnpj, apelido, ativo)
VALUES (
    'Prefeitura Municipal de Teste',
    '00.000.000/0001-00',
    'Teste',
    true
);

-- Criar alguns medicamentos de exemplo para teste
INSERT INTO medicamentos (id_prefeitura, nome, descricao, principio_ativo, concentracao, forma_farmaceutica, imagem_url, ativo)
VALUES 
(1, 'Paracetamol', 'Analgésico e antitérmico', 'Paracetamol', '500mg', 'Comprimido', 'https://images.pexels.com/photos/3683041/pexels-photo-3683041.jpeg', true),
(1, 'Ibuprofeno', 'Anti-inflamatório não esteroidal', 'Ibuprofeno', '600mg', 'Comprimido', 'https://images.pexels.com/photos/3683042/pexels-photo-3683042.jpeg', true),
(1, 'Amoxicilina', 'Antibiótico de amplo espectro', 'Amoxicilina', '500mg', 'Cápsula', 'https://images.pexels.com/photos/3683056/pexels-photo-3683056.jpeg', true),
(1, 'Losartana', 'Anti-hipertensivo', 'Losartana Potássica', '50mg', 'Comprimido', 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg', true),
(1, 'Metformina', 'Antidiabético oral', 'Cloridrato de Metformina', '850mg', 'Comprimido', 'https://images.pexels.com/photos/3683101/pexels-photo-3683101.jpeg', true),
(1, 'Omeprazol', 'Inibidor da bomba de prótons', 'Omeprazol', '20mg', 'Cápsula', 'https://images.pexels.com/photos/3683105/pexels-photo-3683105.jpeg', true),
(1, 'Dipirona', 'Analgésico e antitérmico', 'Dipirona Sódica', '500mg', 'Comprimido', 'https://images.pexels.com/photos/3683108/pexels-photo-3683108.jpeg', true),
(1, 'Captopril', 'Anti-hipertensivo', 'Captopril', '25mg', 'Comprimido', 'https://images.pexels.com/photos/3683111/pexels-photo-3683111.jpeg', true);

-- Criar algumas interações medicamentosas de exemplo
INSERT INTO interacoes_medicamentosas (id_medicamento_1, id_medicamento_2, severidade, descricao, recomendacao, ativo)
VALUES
(2, 8, 'moderada', 'Ibuprofeno pode reduzir a eficácia do Captopril', 'Monitorar pressão arterial. Considerar uso de analgésico alternativo.', true),
(3, 5, 'leve', 'Amoxicilina pode alterar a absorção da Metformina', 'Monitorar glicemia durante o tratamento com antibiótico.', true),
(2, 7, 'leve', 'Uso concomitante de AINEs pode aumentar risco de efeitos gastrointestinais', 'Evitar uso simultâneo quando possível. Considerar protetor gástrico.', true);

-- Adicionar campos necessários na tabela receita_horarios para suportar agendamento completo
ALTER TABLE receita_horarios 
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS data_fim DATE,
ADD COLUMN IF NOT EXISTS domingo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS segunda BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terca BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quarta BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quinta BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sexta BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sabado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS observacao TEXT;

-- Criar índices para melhorar performance nas consultas de conflito
CREATE INDEX IF NOT EXISTS idx_receita_horarios_datas ON receita_horarios(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_receita_horarios_user_horario ON receita_horarios(user_id, horario) WHERE ativo = true;

-- Criar tabela para registrar conflitos de horário detectados
CREATE TABLE IF NOT EXISTS conflitos_horario (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    id_paciente BIGINT NOT NULL,
    id_horario_1 BIGINT NOT NULL,
    id_horario_2 BIGINT NOT NULL,
    data_conflito DATE NOT NULL,
    horario_conflito TIME NOT NULL,
    severidade VARCHAR(20) DEFAULT 'leve' CHECK (severidade IN ('leve', 'moderada', 'grave')),
    resolvido BOOLEAN DEFAULT false,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS na tabela de conflitos
ALTER TABLE conflitos_horario ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para conflitos_horario
CREATE POLICY conflitos_horario_select_policy ON conflitos_horario
    FOR SELECT USING (user_id = uid());

CREATE POLICY conflitos_horario_insert_policy ON conflitos_horario
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY conflitos_horario_update_policy ON conflitos_horario
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY conflitos_horario_delete_policy ON conflitos_horario
    FOR DELETE USING (user_id = uid());

-- Criar índices para a tabela de conflitos
CREATE INDEX idx_conflitos_horario_user_id ON conflitos_horario(user_id);
CREATE INDEX idx_conflitos_horario_paciente ON conflitos_horario(id_paciente);
CREATE INDEX idx_conflitos_horario_data ON conflitos_horario(data_conflito);
CREATE INDEX idx_conflitos_horario_resolvido ON conflitos_horario(resolvido);

-- Criar função para detectar conflitos de horário
CREATE OR REPLACE FUNCTION detectar_conflitos_horario(
    p_user_id BIGINT,
    p_id_paciente BIGINT,
    p_data_inicio DATE,
    p_data_fim DATE
) RETURNS TABLE (
    horario_1 BIGINT,
    horario_2 BIGINT,
    medicamento_1 VARCHAR,
    medicamento_2 VARCHAR,
    horario_conflito TIME,
    dias_conflito TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH horarios_ativos AS (
        SELECT 
            rh.id,
            rh.id_receita_medicamento,
            rh.horario,
            rh.data_inicio,
            rh.data_fim,
            rh.domingo, rh.segunda, rh.terca, rh.quarta, 
            rh.quinta, rh.sexta, rh.sabado,
            m.nome as medicamento_nome
        FROM receita_horarios rh
        JOIN receita_medicamentos rm ON rm.id = rh.id_receita_medicamento
        JOIN receitas r ON r.id = rm.id_receita
        JOIN medicamentos m ON m.id = rm.id_medicamento
        WHERE rh.user_id = p_user_id
            AND r.id_paciente = p_id_paciente
            AND rh.ativo = true
            AND rm.status = 'ativo'
            AND r.status = 'ativa'
            AND (
                (rh.data_inicio <= p_data_fim AND rh.data_fim >= p_data_inicio)
                OR (rh.data_inicio IS NULL OR rh.data_fim IS NULL)
            )
    )
    SELECT DISTINCT
        h1.id as horario_1,
        h2.id as horario_2,
        h1.medicamento_nome as medicamento_1,
        h2.medicamento_nome as medicamento_2,
        h1.horario as horario_conflito,
        ARRAY[
            CASE WHEN h1.domingo AND h2.domingo THEN 'Domingo' END,
            CASE WHEN h1.segunda AND h2.segunda THEN 'Segunda' END,
            CASE WHEN h1.terca AND h2.terca THEN 'Terça' END,
            CASE WHEN h1.quarta AND h2.quarta THEN 'Quarta' END,
            CASE WHEN h1.quinta AND h2.quinta THEN 'Quinta' END,
            CASE WHEN h1.sexta AND h2.sexta THEN 'Sexta' END,
            CASE WHEN h1.sabado AND h2.sabado THEN 'Sábado' END
        ]::TEXT[] as dias_conflito
    FROM horarios_ativos h1
    JOIN horarios_ativos h2 ON h1.id < h2.id
    WHERE h1.horario = h2.horario
        AND (
            (h1.domingo AND h2.domingo) OR
            (h1.segunda AND h2.segunda) OR
            (h1.terca AND h2.terca) OR
            (h1.quarta AND h2.quarta) OR
            (h1.quinta AND h2.quinta) OR
            (h1.sexta AND h2.sexta) OR
            (h1.sabado AND h2.sabado)
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar view para facilitar consulta de agendamentos com medicamentos
CREATE OR REPLACE VIEW vw_agendamento_medicamentos AS
SELECT 
    r.id as receita_id,
    r.id_paciente,
    p.nome as paciente_nome,
    p.cartao_sus,
    r.data_receita,
    r.status as receita_status,
    rm.id as receita_medicamento_id,
    m.id as medicamento_id,
    m.nome as medicamento_nome,
    m.principio_ativo,
    m.concentracao,
    rm.posologia,
    rm.frequencia_dia,
    rm.duracao_dias,
    rm.data_inicio as medicamento_data_inicio,
    rm.data_fim as medicamento_data_fim,
    rh.id as horario_id,
    rh.horario,
    rh.data_inicio as horario_data_inicio,
    rh.data_fim as horario_data_fim,
    rh.domingo, rh.segunda, rh.terca, rh.quarta, 
    rh.quinta, rh.sexta, rh.sabado,
    rh.observacao as horario_observacao,
    rh.ativo as horario_ativo,
    r.user_id
FROM receitas r
JOIN pacientes p ON p.id = r.id_paciente
JOIN receita_medicamentos rm ON rm.id_receita = r.id
JOIN medicamentos m ON m.id = rm.id_medicamento
LEFT JOIN receita_horarios rh ON rh.id_receita_medicamento = rm.id
WHERE r.status = 'ativa' 
    AND rm.status = 'ativo'
    AND p.ativo = true;

-- Conceder permissões na view
GRANT SELECT ON vw_agendamento_medicamentos TO app20260109065139cnigtntalr_v1_user;
GRANT SELECT ON vw_agendamento_medicamentos TO app20260109065139cnigtntalr_v1_admin_user;

-- Conceder permissões na função
GRANT EXECUTE ON FUNCTION detectar_conflitos_horario(BIGINT, BIGINT, DATE, DATE) TO app20260109065139cnigtntalr_v1_user;
GRANT EXECUTE ON FUNCTION detectar_conflitos_horario(BIGINT, BIGINT, DATE, DATE) TO app20260109065139cnigtntalr_v1_admin_user;

-- Conceder permissões na tabela conflitos_horario
GRANT SELECT, INSERT, UPDATE, DELETE ON conflitos_horario TO app20260109065139cnigtntalr_v1_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON conflitos_horario TO app20260109065139cnigtntalr_v1_admin_user;
GRANT USAGE, SELECT ON SEQUENCE conflitos_horario_id_seq TO app20260109065139cnigtntalr_v1_user;
GRANT USAGE, SELECT ON SEQUENCE conflitos_horario_id_seq TO app20260109065139cnigtntalr_v1_admin_user;

-- Remover campos de data e frequência da tabela receita_medicamentos
ALTER TABLE receita_medicamentos 
DROP COLUMN IF EXISTS data_inicio,
DROP COLUMN IF EXISTS data_fim,
DROP COLUMN IF EXISTS frequencia_dia,
DROP COLUMN IF EXISTS duracao_dias;

-- Tabela de médicos
CREATE TABLE medicos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    nome VARCHAR(200) NOT NULL,
    crm VARCHAR(20) NOT NULL,
    especialidade VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medicos_crm_check CHECK (crm ~ '^[0-9]+$')
);

-- Criar índices para melhorar performance
CREATE INDEX idx_medicos_user_id ON medicos(user_id);
CREATE INDEX idx_medicos_crm ON medicos(crm);
CREATE INDEX idx_medicos_ativo ON medicos(ativo);

-- Habilitar RLS
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY medicos_select_policy ON medicos
    FOR SELECT USING (user_id = uid());

CREATE POLICY medicos_insert_policy ON medicos
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY medicos_update_policy ON medicos
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY medicos_delete_policy ON medicos
    FOR DELETE USING (user_id = uid());

-- Adicionar campo id_medico na tabela receitas para estabelecer o vínculo
ALTER TABLE receitas ADD COLUMN id_medico BIGINT;

-- Criar índice para o novo campo
CREATE INDEX idx_receitas_medico ON receitas(id_medico);

-- Atualizar trigger de updated_at para a tabela medicos
CREATE TRIGGER update_medicos_updated_at
    BEFORE UPDATE ON medicos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Remover políticas RLS da tabela eventos_alarme
DROP POLICY IF EXISTS eventos_alarme_select_policy ON eventos_alarme;
DROP POLICY IF EXISTS eventos_alarme_insert_policy ON eventos_alarme;
DROP POLICY IF EXISTS eventos_alarme_update_policy ON eventos_alarme;
DROP POLICY IF EXISTS eventos_alarme_delete_policy ON eventos_alarme;

-- Remover índices da tabela eventos_alarme
DROP INDEX IF EXISTS idx_eventos_alarme_user_id;
DROP INDEX IF EXISTS idx_eventos_alarme_medicamento;
DROP INDEX IF EXISTS idx_eventos_alarme_horario;
DROP INDEX IF EXISTS idx_eventos_alarme_data_disparo;

-- Remover a tabela eventos_alarme
DROP TABLE IF EXISTS eventos_alarme;

-- View materializada para pivot de paciente, medicamento, receita e médico
CREATE MATERIALIZED VIEW vw_pivot_receitas AS
SELECT 
    -- Identificadores
    r.id as receita_id,
    p.id as paciente_id,
    m.id as medicamento_id,
    med.id as medico_id,
    rm.id as receita_medicamento_id,
    
    -- Dados do Paciente
    p.nome as paciente_nome,
    p.cartao_sus as paciente_cartao_sus,
    p.cpf as paciente_cpf,
    p.celular as paciente_celular,
    p.data_nascimento as paciente_data_nascimento,
    
    -- Dados do Medicamento
    m.nome as medicamento_nome,
    m.principio_ativo as medicamento_principio_ativo,
    m.concentracao as medicamento_concentracao,
    m.forma_farmaceutica as medicamento_forma_farmaceutica,
    
    -- Dados da Receita
    r.data_receita,
    r.data_registro,
    r.origem_receita,
    r.subgrupo_origem,
    r.tipo_prescritor,
    r.num_notificacao,
    r.status as receita_status,
    r.observacao as receita_observacao,
    
    -- Dados do Médico
    med.nome as medico_nome,
    med.crm as medico_crm,
    med.especialidade as medico_especialidade,
    
    -- Dados da Prescrição
    rm.quantidade_total,
    rm.quantidade_minima_calculada,
    rm.frequencia_dia,
    rm.duracao_dias,
    rm.dias_dispensar,
    rm.posologia,
    rm.via_administracao,
    rm.status as prescricao_status,
    rm.data_inicio as prescricao_data_inicio,
    rm.data_fim as prescricao_data_fim,
    rm.observacao as prescricao_observacao,
    
    -- Dados da Prefeitura
    pref.nome as prefeitura_nome,
    pref.apelido as prefeitura_apelido,
    
    -- Dados de Auditoria
    r.user_id,
    r.created_at,
    r.updated_at
FROM 
    receitas r
    INNER JOIN pacientes p ON r.id_paciente = p.id
    INNER JOIN receita_medicamentos rm ON r.id = rm.id_receita
    INNER JOIN medicamentos m ON rm.id_medicamento = m.id
    LEFT JOIN medicos med ON r.id_medico = med.id
    INNER JOIN prefeituras pref ON r.id_prefeitura = pref.id
WHERE 
    r.status != 'cancelada'
    AND rm.status != 'cancelado';

-- Criar índices para melhorar performance das consultas
CREATE INDEX idx_vw_pivot_receitas_paciente ON vw_pivot_receitas(paciente_id);
CREATE INDEX idx_vw_pivot_receitas_medicamento ON vw_pivot_receitas(medicamento_id);
CREATE INDEX idx_vw_pivot_receitas_medico ON vw_pivot_receitas(medico_id);
CREATE INDEX idx_vw_pivot_receitas_receita ON vw_pivot_receitas(receita_id);
CREATE INDEX idx_vw_pivot_receitas_data ON vw_pivot_receitas(data_receita);
CREATE INDEX idx_vw_pivot_receitas_user ON vw_pivot_receitas(user_id);
CREATE INDEX idx_vw_pivot_receitas_status ON vw_pivot_receitas(receita_status, prescricao_status);

-- Função para atualizar a view materializada
CREATE OR REPLACE FUNCTION refresh_vw_pivot_receitas()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY vw_pivot_receitas;
END;
$$ LANGUAGE plpgsql;

-- Comentários explicativos
COMMENT ON MATERIALIZED VIEW vw_pivot_receitas IS 'View pivot consolidando dados de pacientes, medicamentos, receitas e médicos para análise e relatórios';
COMMENT ON FUNCTION refresh_vw_pivot_receitas() IS 'Função para atualizar a view materializada vw_pivot_receitas';

-- Tabela para armazenar informações detalhadas dos celulares dos pacientes
CREATE TABLE paciente_celulares (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    id_paciente BIGINT NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    numero_serie VARCHAR(100),
    numero_contato VARCHAR(20) NOT NULL,
    tipo_celular VARCHAR(20) NOT NULL CHECK (tipo_celular IN ('proprio', 'cuidador')),
    nome_cuidador VARCHAR(200),
    ativo BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhorar performance
CREATE INDEX idx_paciente_celulares_user_id ON paciente_celulares(user_id);
CREATE INDEX idx_paciente_celulares_paciente ON paciente_celulares(id_paciente);
CREATE INDEX idx_paciente_celulares_numero_contato ON paciente_celulares(numero_contato);
CREATE INDEX idx_paciente_celulares_tipo ON paciente_celulares(tipo_celular);

-- Habilitar RLS
ALTER TABLE paciente_celulares ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY paciente_celulares_select_policy ON paciente_celulares
    FOR SELECT USING (user_id = uid());

CREATE POLICY paciente_celulares_insert_policy ON paciente_celulares
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY paciente_celulares_update_policy ON paciente_celulares
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY paciente_celulares_delete_policy ON paciente_celulares
    FOR DELETE USING (user_id = uid());

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_paciente_celulares_updated_at
    BEFORE UPDATE ON paciente_celulares
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela de agendamentos vinculada às receitas
CREATE TABLE agendamentos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    id_receita BIGINT NOT NULL,
    id_paciente BIGINT NOT NULL,
    id_medico BIGINT,
    id_prefeitura BIGINT NOT NULL,
    tipo_agendamento VARCHAR(50) NOT NULL CHECK (tipo_agendamento IN ('consulta', 'retorno', 'procedimento', 'exame', 'avaliacao')),
    data_agendamento DATE NOT NULL,
    hora_agendamento TIME NOT NULL,
    duracao_minutos INTEGER DEFAULT 30,
    local_atendimento VARCHAR(200),
    status VARCHAR(20) DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'realizado', 'cancelado', 'faltou')),
    motivo TEXT,
    observacao TEXT,
    lembrete_enviado BOOLEAN DEFAULT false,
    data_lembrete TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhorar performance
CREATE INDEX idx_agendamentos_user_id ON agendamentos(user_id);
CREATE INDEX idx_agendamentos_receita ON agendamentos(id_receita);
CREATE INDEX idx_agendamentos_paciente ON agendamentos(id_paciente);
CREATE INDEX idx_agendamentos_medico ON agendamentos(id_medico);
CREATE INDEX idx_agendamentos_prefeitura ON agendamentos(id_prefeitura);
CREATE INDEX idx_agendamentos_data ON agendamentos(data_agendamento);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_agendamentos_tipo ON agendamentos(tipo_agendamento);

-- Habilitar RLS
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY agendamentos_select_policy ON agendamentos
    FOR SELECT USING (user_id = uid());

CREATE POLICY agendamentos_insert_policy ON agendamentos
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY agendamentos_update_policy ON agendamentos
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY agendamentos_delete_policy ON agendamentos
    FOR DELETE USING (user_id = uid());

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_agendamentos_updated_at
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Adicionar comentários para documentação
COMMENT ON TABLE agendamentos IS 'Tabela para armazenar agendamentos de consultas, retornos e procedimentos relacionados às receitas médicas';
COMMENT ON COLUMN agendamentos.tipo_agendamento IS 'Tipo do agendamento: consulta, retorno, procedimento, exame, avaliacao';
COMMENT ON COLUMN agendamentos.status IS 'Status do agendamento: agendado, confirmado, realizado, cancelado, faltou';
COMMENT ON COLUMN agendamentos.duracao_minutos IS 'Duração estimada do atendimento em minutos';
COMMENT ON COLUMN agendamentos.lembrete_enviado IS 'Indica se o lembrete foi enviado ao paciente';
