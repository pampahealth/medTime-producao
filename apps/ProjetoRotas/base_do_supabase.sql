--URL = https://hydtvfjffstyceqekerl.supabase.co
--KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5ZHR2ZmpmZnN0eWNlcWVrZXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTgwMjgsImV4cCI6MjA4Mzc5NDAyOH0.ak-BjlV4Cg0t4DxuAzelnKqDx5QlXYBc811jEtm3WYw


CREATE SCHEMA IF NOT EXISTS medtime;
CREATE EXTENSION IF NOT EXISTS pgcrypto;



CREATE TABLE IF NOT EXISTS medtime.a001_prefeitura (
  a001_id_prefeitura 			  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  a001_cnpj        			    VARCHAR(80) NOT NULL,
  a001_apelido       			  VARCHAR(30) NOT NULL DEFAULT 'Android'
);



CREATE TABLE IF NOT EXISTS medtime.a002_medico (
  a002_id_medico  			    UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  a002_nome_medico  		    VARCHAR(80) NOT NULL,
  a002_crm 				          VARCHAR(10) NOT NULL UNIQUE
);



CREATE TABLE IF NOT EXISTS medtime.a003_medicamentos (
  a003_id_medicamento 			UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  a003_nome           			VARCHAR(200) NOT NULL,
  a003_imagem_base64  			TEXT NOT NULL,
  a003_ativo          			BOOLEAN NOT NULL DEFAULT TRUE,
  a003_created_at     			TIMESTAMPTZ NOT NULL DEFAULT now(),
  a003_updated_at     			TIMESTAMPTZ NOT NULL DEFAULT now(),
  a003_id_prefeitura  			UUID NOT NULL REFERENCES medtime.a001_prefeitura(a001_id_prefeitura) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_medicamentos_nome
ON medtime.a003_medicamentos (a003_nome);



CREATE TABLE IF NOT EXISTS medtime.a004_pacientes (
  a004_id_paciente  			  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  a004_cartao_sus    			  VARCHAR(20) NOT NULL UNIQUE CHECK (a004_cartao_sus ~ '^[0-9]+$'),
  a004_nome          			  VARCHAR(200) NOT NULL,
  a004_celular       			  VARCHAR(20),
  a004_cpf           			  VARCHAR(11),
  a004_data_nascimento			DATE,
  a004_ativo         			  BOOLEAN NOT NULL DEFAULT TRUE,
  a004_app_instalado 			  CHAR(1) NOT NULL DEFAULT 'N' CHECK (a004_app_instalado IN ('S','N')),
  a004_created_at    			  TIMESTAMPTZ NOT NULL DEFAULT now(),
  a004_id_prefeitura 			  UUID NOT NULL REFERENCES medtime.a001_prefeitura(a001_id_prefeitura) ON DELETE CASCADE
);

-- Colunas opcionais para atualização via medtime (executar se a tabela já existir)
ALTER TABLE medtime.a004_pacientes ADD COLUMN IF NOT EXISTS a004_cpf VARCHAR(11);
ALTER TABLE medtime.a004_pacientes ADD COLUMN IF NOT EXISTS a004_data_nascimento DATE;
ALTER TABLE medtime.a004_pacientes ADD COLUMN IF NOT EXISTS a004_ativo BOOLEAN NOT NULL DEFAULT TRUE;



CREATE TABLE IF NOT EXISTS medtime.a005_receitas (
  a005_id_receita      			UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  a005_id_paciente     			UUID NOT NULL REFERENCES medtime.a004_pacientes(a004_id_paciente) ON DELETE CASCADE,
  a005_id_medico       			UUID REFERENCES medtime.a002_medico(a002_id_medico) ON DELETE SET NULL,
  a005_a001_create_at  			TIMESTAMPTZ NOT NULL DEFAULT now(),
  a005_plugin_a001_id  			UUID,
  a005_data_receita    			DATE NOT NULL,
  a005_data_registro   			DATE,
  a005_origem_receita  			VARCHAR(80),
  a005_subgrupo_origem 			VARCHAR(80),
  a005_observacao      			TEXT,
  a005_tipo_prescritor 			VARCHAR(30),
  a005_num_notificacao 			VARCHAR(40),
  -- uso futuro: envio da receita para integrações
  a005_pronta_envio          BOOLEAN NOT NULL DEFAULT FALSE,
  a005_codigo_envio          VARCHAR(80),
  a005_created_at      			TIMESTAMPTZ NOT NULL DEFAULT now(),
  a005_id_prefeitura   			UUID NOT NULL REFERENCES medtime.a001_prefeitura(a001_id_prefeitura) ON DELETE CASCADE
);

-- Colunas opcionais para atualização via medtime (executar se a tabela já existir)
ALTER TABLE medtime.a005_receitas ADD COLUMN IF NOT EXISTS a005_pronta_envio BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE medtime.a005_receitas ADD COLUMN IF NOT EXISTS a005_codigo_envio VARCHAR(80);
CREATE UNIQUE INDEX IF NOT EXISTS ux_a005_receitas_codigo_envio
ON medtime.a005_receitas (a005_codigo_envio)
WHERE a005_codigo_envio IS NOT NULL AND length(trim(a005_codigo_envio)) > 0;



CREATE TABLE IF NOT EXISTS medtime.a006_receita_medicamentos (
  a006_id_rm            		UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  a006_id_receita       		UUID NOT NULL REFERENCES medtime.a005_receitas(a005_id_receita) ON DELETE CASCADE,
  a006_id_medicamento   		UUID NOT NULL REFERENCES medtime.a003_medicamentos(a003_id_medicamento) ON DELETE CASCADE,
  a006_quantidade_total 		NUMERIC(18,3),
  a006_frequencia_dia   		INT CHECK (a006_frequencia_dia IS NULL OR a006_frequencia_dia >= 1),
  a006_duracao_dias     		INT CHECK (a006_duracao_dias IS NULL OR a006_duracao_dias >= 1),
  a006_observacao       		TEXT,
  a006_created_at       		TIMESTAMPTZ NOT NULL DEFAULT now(),
  a006_id_prefeitura    		UUID NOT NULL REFERENCES medtime.a001_prefeitura(a001_id_prefeitura) ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS medtime.a007_receita_horarios (
  a007_id_horario       		UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  a007_id_rm             		UUID NOT NULL REFERENCES medtime.a006_receita_medicamentos(a006_id_rm) ON DELETE CASCADE,
  a007_id_prefeitura     		UUID NOT NULL REFERENCES medtime.a001_prefeitura(a001_id_prefeitura) ON DELETE CASCADE,
  a007_data_hora_disparo 		TIMESTAMPTZ NOT NULL,
  a007_data_hora_desligado 	TIMESTAMPTZ,
  a007_tomou             		BOOLEAN,
  a007_sms_enviado       		BOOLEAN NOT NULL DEFAULT FALSE,
  a007_data_sms          		TIMESTAMPTZ,
  a007_tentativas        		INT NOT NULL DEFAULT 0 CHECK (a007_tentativas >= 0),
  a007_created_at        		TIMESTAMPTZ NOT NULL DEFAULT now()
);



CREATE TABLE IF NOT EXISTS medtime.a008_usuario (
  a008_id         			UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  a008_user_email 			VARCHAR(80) NOT NULL,
  a008_user_senha 			VARCHAR(80) NOT NULL,
  a008_user_tipo  			VARCHAR(80) NOT NULL
);



CREATE TABLE IF NOT EXISTS medtime.x001 (
  x001_id 				    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x001_codigo    			VARCHAR(50),
  x001_nome      			VARCHAR(50),
  x001_valor     			VARCHAR(50),
  x001_descricao 			VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS medtime.x002 (
  x002_id 				    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x002_codigo    			VARCHAR(50),
  x002_nome      			VARCHAR(50),
  x002_valor     			VARCHAR(50),
  x002_descricao 			VARCHAR(50)
);


-- Função para atualizar automaticamente o campo a003_updated_at
CREATE OR REPLACE FUNCTION medtime.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.a003_updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que chama a função antes de cada UPDATE na tabela a003_medicamentos
-- EXECUTE PROCEDURE é compatível com PostgreSQL 11+; use EXECUTE FUNCTION em PG 14+ se preferir
CREATE TRIGGER trg_a003_medicamentos_updated_at
BEFORE UPDATE ON medtime.a003_medicamentos
FOR EACH ROW
EXECUTE PROCEDURE medtime.fn_set_updated_at();

