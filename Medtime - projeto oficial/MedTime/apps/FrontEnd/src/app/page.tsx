
'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AUTH_ENABLED } from '@/config/auth-config';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Sem login: vai direto para o dashboard
      if (!AUTH_ENABLED) {
        router.push('/dashboard');
        return;
      }
      if (!user) {
        router.push('/login');
      } else if (user.isAdmin) {
        router.push('/dashboard');
      } else {
        router.push('/meus-medicamentos');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
}
