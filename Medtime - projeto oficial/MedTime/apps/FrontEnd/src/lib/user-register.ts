
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';

export async function userRegisterCallback(user: {
  id: string;
  email: string;
  role: string;
}): Promise<void> {
  try {
    const adminToken = await generateAdminUserToken();
    const profilesCrud = new CrudOperations("user_profiles", adminToken);

    // Criar perfil básico do usuário
    const basicProfile = {
      user_id: parseInt(user.id),
      nome_completo: user.email.split('@')[0],
      tipo_usuario: 'paciente', // Padrão inicial
      preferencias_notificacao: JSON.stringify({
        sms: true,
        whatsapp: true,
        push: true
      })
    };

    await profilesCrud.create(basicProfile);
  } catch {
    throw new Error('Falha ao criar perfil do usuário');
  }
}
