
export interface Medicamento {
  id: number;
  id_prefeitura: number;
  nome: string;
  descricao?: string;
  imagem_url?: string;
  principio_ativo?: string;
  concentracao?: string;
  forma_farmaceutica?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Paciente {
  /** ID do paciente (número quando PostgREST local; string UUID quando backend ProjetoRotas/Supabase) */
  id: number | string;
  user_id?: number;
  id_prefeitura: number | string;
  /** Número interno do paciente (código exibido na UI) */
  numero_paciente?: string | number;
  cartao_sus: string;
  cpf?: string;
  nome: string;
  data_nascimento?: string;
  celular?: string;
  celular_validado?: boolean;
  app_instalado?: boolean;
  consentimento_lgpd?: boolean;
  data_consentimento?: string;
  versao_termo_consentimento?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PacienteCelular {
  /** UUID no backend (a009_id_celular); number quando PostgREST local */
  id: number | string;
  user_id?: number;
  id_paciente: number | string;
  modelo: string;
  marca: string;
  numero_serie?: string;
  numero_contato: string;
  tipo_celular: 'proprio' | 'cuidador';
  nome_cuidador?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Medico {
  id: number;
  user_id: number;
  nome: string;
  crm: string;
  especialidade: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Receita {
  id: number;
  user_id: number;
  id_paciente: number;
  id_prefeitura: number;
  id_medico?: number;
  data_receita: string;
  data_registro?: string;
  origem_receita?: string;
  subgrupo_origem?: string;
  observacao?: string;
  tipo_prescritor?: string;
  num_notificacao?: string;
  status: 'ativa' | 'concluida' | 'cancelada';
  created_at?: string;
  updated_at?: string;
}

export interface ReceitaMedicamento {
  id: number;
  user_id: number;
  id_receita: number;
  id_medicamento: number;
  id_prefeitura: number;
  quantidade_total?: number;
  quantidade_minima_calculada?: number;
  frequencia_dia?: number;
  duracao_dias?: number;
  dias_dispensar?: number;
  observacao?: string;
  posologia?: string;
  via_administracao?: string;
  status: 'ativo' | 'concluido' | 'cancelado';
  data_inicio?: string;
  data_fim?: string;
  created_at?: string;
  updated_at?: string;
  medicamento?: Medicamento;
}

export interface ReceitaHorario {
  id: number;
  user_id: number;
  id_receita_medicamento: number;
  horario: string;
  data_inicio?: string;
  data_fim?: string;
  domingo: boolean;
  segunda: boolean;
  terca: boolean;
  quarta: boolean;
  quinta: boolean;
  sexta: boolean;
  sabado: boolean;
  observacao?: string;
  dias_semana?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Agendamento {
  id: number;
  user_id: number;
  id_receita: number;
  id_paciente: number;
  id_medico?: number;
  id_prefeitura: number;
  tipo_agendamento: 'consulta' | 'retorno' | 'procedimento' | 'exame' | 'avaliacao';
  data_agendamento: string;
  hora_agendamento: string;
  duracao_minutos?: number;
  local_atendimento?: string;
  status: 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'faltou';
  motivo?: string;
  observacao?: string;
  lembrete_enviado: boolean;
  data_lembrete?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventoAlarme {
  id: number;
  user_id: number;
  id_receita_medicamento: number;
  id_horario: number;
  data_hora_disparo: string;
  data_hora_interacao?: string;
  tipo_interacao?: 'tomou' | 'adiou' | 'ignorou' | 'cancelou';
  tentativas: number;
  sms_enviado: boolean;
  whatsapp_enviado: boolean;
  data_envio_mensagem?: string;
  observacao?: string;
  created_at?: string;
}

export interface InteracaoMedicamentosa {
  id: number;
  id_medicamento_1: number;
  id_medicamento_2: number;
  severidade: 'leve' | 'moderada' | 'grave';
  descricao: string;
  recomendacao?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Prefeitura {
  id: number;
  nome: string;
  cnpj: string;
  apelido?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Dispositivo {
  id: number;
  user_id: number;
  id_paciente: number;
  device_id: string;
  device_name?: string;
  platform?: 'android' | 'ios';
  app_version?: string;
  os_version?: string;
  ultima_sincronizacao?: string;
  token_push?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ConflitosHorario {
  id: number;
  user_id: number;
  id_paciente: number;
  id_horario_1: number;
  id_horario_2: number;
  data_conflito: string;
  horario_conflito: string;
  severidade: 'leve' | 'moderada' | 'grave';
  resolvido: boolean;
  observacao?: string;
  created_at?: string;
  updated_at?: string;
}
