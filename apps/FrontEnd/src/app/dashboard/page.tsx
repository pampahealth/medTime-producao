
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Pill, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    pacientes: 0,
    medicamentos: 0,
    receitas: 0,
    alertas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.push('/meus-medicamentos');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [pacientes, medicamentos, receitas] = await Promise.all([
        api.get<unknown[]>('/pacientes', { limit: '1000' }),
        api.get<unknown[]>('/medicamentos', { limit: '1000' }),
        api.get<unknown[]>('/receitas', { limit: '1000' })
      ]);

      const count = (arr: unknown): number => (Array.isArray(arr) ? arr.length : 0);

      setStats({
        pacientes: count(pacientes),
        medicamentos: count(medicamentos),
        receitas: count(receitas),
        alertas: 0
      });
    } catch {
      toast.error('Não foi possível carregar as estatísticas. Verifique se a API está rodando.');
      setStats({ pacientes: 0, medicamentos: 0, receitas: 0, alertas: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema MEDTIME
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pacientes Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pacientes}</div>
              <p className="text-xs text-muted-foreground">
                Total de pacientes cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Medicamentos
              </CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.medicamentos}</div>
              <p className="text-xs text-muted-foreground">
                Medicamentos no catálogo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receitas Ativas
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.receitas}</div>
              <p className="text-xs text-muted-foreground">
                Receitas em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Alertas
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.alertas}</div>
              <p className="text-xs text-muted-foreground">
                Pacientes em risco
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
              <CardDescription>
                Últimas ações no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma atividade recente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pacientes em Risco</CardTitle>
              <CardDescription>
                Pacientes que necessitam atenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum paciente em risco no momento
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
