
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api-client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Pill, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ReceitaMedicamento } from '@/types/medtime';

export default function MeusMedicamentosPage() {
  const { user } = useAuth();
  const [medicamentos, setMedicamentos] = useState<ReceitaMedicamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedicamentos();
  }, []);

  const fetchMedicamentos = async () => {
    try {
      setLoading(true);
      const data = await api.get<ReceitaMedicamento[]>('/receita-medicamentos');
      setMedicamentos(data.filter(m => m.status === 'ativo'));
    } catch (error) {
      toast.error('Erro ao carregar medicamentos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meus Medicamentos</h1>
          <p className="text-muted-foreground">
            Acompanhe seus medicamentos e horários de uso
          </p>
        </div>

        {medicamentos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Pill className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum medicamento ativo</p>
              <p className="text-sm text-muted-foreground text-center">
                Você não possui medicamentos cadastrados no momento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {medicamentos.map((med) => (
              <Card key={med.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5" />
                        Medicamento #{med.id_medicamento}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {med.posologia || 'Sem posologia definida'}
                      </CardDescription>
                    </div>
                    <Badge variant={med.status === 'ativo' ? 'default' : 'secondary'}>
                      {med.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {med.frequencia_dia ? `${med.frequencia_dia}x ao dia` : 'Frequência não definida'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {med.duracao_dias ? `${med.duracao_dias} dias` : 'Duração não definida'}
                      </span>
                    </div>
                  </div>

                  {med.quantidade_minima_calculada && (
                    <div className="flex items-center gap-2 text-sm bg-muted p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Quantidade mínima necessária: {med.quantidade_minima_calculada} unidades
                      </span>
                    </div>
                  )}

                  {med.observacao && (
                    <div className="text-sm text-muted-foreground border-l-2 border-primary pl-3">
                      {med.observacao}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Ver Horários
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Histórico
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
