
export interface User {
  sub: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, passcode: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface UserProfile {
  id: number;
  user_id: number;
  nome_completo?: string;
  tipo_usuario?: 'paciente' | 'profissional_saude' | 'acs' | 'gestor_municipal' | 'admin';
  id_prefeitura?: number;
  unidade_saude?: string;
  cargo?: string;
  telefone?: string;
  avatar_url?: string;
  preferencias_notificacao?: any;
  created_at?: string;
  updated_at?: string;
}
