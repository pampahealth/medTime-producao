
import { hashString } from '../src/lib/server-utils';
import { createPostgrestClient } from '../src/lib/postgrest';

async function seedAdminUser() {
  try {
    console.log('🌱 Iniciando seed do usuário administrador...');

    const client = createPostgrestClient();
    
    // Hash da senha
    const hashedPassword = await hashString('admin123');
    
    // Verificar se o usuário já existe
    const { data: existingUsers } = await client
      .from('users')
      .select('*')
      .eq('email', 'rsferreira82@gmail.com');

    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️  Usuário administrador já existe. Atualizando senha...');
      
      const { error: updateError } = await client
        .from('users')
        .update({ 
          password: hashedPassword,
          role: process.env.SCHEMA_ADMIN_USER || 'app20260109065139cnigtntalr_v1_admin_user'
        })
        .eq('email', 'rsferreira82@gmail.com');

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Senha do administrador atualizada com sucesso!');
      
      // Atualizar perfil
      const userId = existingUsers[0].id;
      const { data: existingProfile } = await client
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId);

      if (existingProfile && existingProfile.length > 0) {
        await client
          .from('user_profiles')
          .update({
            tipo_usuario: 'admin',
            nome_completo: 'Administrador do Sistema'
          })
          .eq('user_id', userId);
      } else {
        await client
          .from('user_profiles')
          .insert({
            user_id: userId,
            tipo_usuario: 'admin',
            nome_completo: 'Administrador do Sistema',
            preferencias_notificacao: JSON.stringify({
              sms: true,
              whatsapp: true,
              push: true
            })
          });
      }

      console.log('✅ Perfil do administrador atualizado!');
      return;
    }

    // Criar novo usuário administrador
    const { data: newUser, error: userError } = await client
      .from('users')
      .insert({
        email: 'rsferreira82@gmail.com',
        password: hashedPassword,
        role: process.env.SCHEMA_ADMIN_USER || 'app20260109065139cnigtntalr_v1_admin_user'
      })
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    console.log('✅ Usuário administrador criado com sucesso!');

    // Criar perfil do administrador
    const { error: profileError } = await client
      .from('user_profiles')
      .insert({
        user_id: newUser.id,
        tipo_usuario: 'admin',
        nome_completo: 'Administrador do Sistema',
        preferencias_notificacao: JSON.stringify({
          sms: true,
          whatsapp: true,
          push: true
        })
      });

    if (profileError) {
      throw profileError;
    }

    console.log('✅ Perfil do administrador criado com sucesso!');
    console.log('\n📧 Email: rsferreira82@gmail.com');
    console.log('🔑 Senha: admin123');
    console.log('\n✨ Você já pode fazer login no sistema!');

  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error);
    throw error;
  }
}

seedAdminUser()
  .then(() => {
    console.log('\n🎉 Seed concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Falha no seed:', error);
    process.exit(1);
  });
