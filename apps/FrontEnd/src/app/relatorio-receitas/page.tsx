
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, Pill, User, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { 
  Receita, 
  Paciente, 
  Medicamento, 
  ReceitaMedicamento, 
  ReceitaHorario,
  Medico 
} from '@/types/medtime';

interface RelatorioData {
  receita: Receita;
  paciente: Paciente;
  medico?: Medico;
  medicamentos: Array<{
    receitaMedicamento: ReceitaMedicamento;
    medicamento: Medicamento;
    horarios: ReceitaHorario[];
  }>;
}

export default function RelatorioReceitasPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [relatorioData, setRelatorioData] = useState<RelatorioData[]>([]);

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.push('/meus-medicamentos');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Define período padrão: últimos 30 dias
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    
    setDataInicio(trintaDiasAtras.toISOString().split('T')[0]);
    setDataFim(hoje.toISOString().split('T')[0]);
  }, []);

  const gerarRelatorio = async () => {
    if (!dataInicio || !dataFim) {
      toast.error('Selecione o período do relatório');
      return;
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      toast.error('Data inicial não pode ser maior que data final');
      return;
    }

    try {
      setLoading(true);

      // Buscar todas as receitas do período
      const receitas = await api.get<Receita[]>('/receitas', { limit: '1000' });
      const receitasFiltradas = receitas.filter(r => {
        const dataReceita = new Date(r.data_receita);
        return dataReceita >= new Date(dataInicio) && dataReceita <= new Date(dataFim);
      });

      if (receitasFiltradas.length === 0) {
        toast.info('Nenhuma receita encontrada no período selecionado');
        setRelatorioData([]);
        return;
      }

      // Buscar dados relacionados
      const [pacientes, medicamentos, medicos] = await Promise.all([
        api.get<Paciente[]>('/pacientes', { limit: '1000' }),
        api.get<Medicamento[]>('/medicamentos', { limit: '1000' }),
        api.get<Medico[]>('/medicos', { limit: '1000' }),
      ]);

      // Processar cada receita
      const relatorioPromises = receitasFiltradas.map(async (receita) => {
        const paciente = pacientes.find(p => String(p.id) === String(receita.id_paciente));
        const medico = medicos.find(m => m.id === receita.id_medico);

        if (!paciente) return null;

        // Buscar medicamentos da receita
        const receitaMedicamentos = await api.get<ReceitaMedicamento[]>(
          `/receita-medicamentos?id_receita=${receita.id}`
        );

        // Para cada medicamento, buscar horários
        const medicamentosComHorarios = await Promise.all(
          receitaMedicamentos.map(async (rm) => {
            const medicamento = medicamentos.find(m => m.id === rm.id_medicamento);
            if (!medicamento) return null;

            const horarios = await api.get<ReceitaHorario[]>(
              `/receita-horarios?id_receita_medicamento=${rm.id}`
            );

            return {
              receitaMedicamento: rm,
              medicamento,
              horarios: horarios || [],
            };
          })
        );

        return {
          receita,
          paciente,
          medico,
          medicamentos: medicamentosComHorarios.filter(Boolean) as any[],
        };
      });

      const relatorio = (await Promise.all(relatorioPromises)).filter(Boolean) as RelatorioData[];
      
      // Ordenar por data da receita (mais recente primeiro)
      relatorio.sort((a, b) => 
        new Date(b.receita.data_receita).getTime() - new Date(a.receita.data_receita).getTime()
      );

      setRelatorioData(relatorio);
      toast.success(`Relatório gerado com ${relatorio.length} receita(s)`);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const getDiasSemana = (horario: ReceitaHorario): string => {
    const dias = [];
    if (horario.domingo) dias.push('Dom');
    if (horario.segunda) dias.push('Seg');
    if (horario.terca) dias.push('Ter');
    if (horario.quarta) dias.push('Qua');
    if (horario.quinta) dias.push('Qui');
    if (horario.sexta) dias.push('Sex');
    if (horario.sabado) dias.push('Sáb');
    return dias.length > 0 ? dias.join(', ') : 'Todos os dias';
  };

  const exportarPDF = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  if (isLoading || !user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Relatório de Receitas</h1>
          <p className="text-muted-foreground">
            Visualize receitas por período com detalhamento de medicamentos e agendamentos
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="data_inicio">Data Início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="data_fim">Data Fim</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>

              <div className="flex items-end gap-2">
                <Button 
                  onClick={gerarRelatorio} 
                  disabled={loading}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {loading ? 'Gerando...' : 'Gerar Relatório'}
                </Button>
                {relatorioData.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={exportarPDF}
                    title="Exportar para PDF"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relatório */}
        {relatorioData.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Período: {formatDate(dataInicio)} a {formatDate(dataFim)}
              </h2>
              <Badge variant="secondary" className="text-base px-4 py-2">
                {relatorioData.length} receita(s)
              </Badge>
            </div>

            {relatorioData.map((item, index) => (
              <Card key={item.receita.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          Receita #{item.receita.id}
                        </CardTitle>
                        <Badge
                          variant={
                            item.receita.status === 'ativa'
                              ? 'default'
                              : item.receita.status === 'concluida'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {item.receita.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Paciente:</span>
                          {item.paciente.nome}
                          <span className="text-xs">
                            (SUS: {item.paciente.cartao_sus})
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>
                            <span className="font-medium">Data:</span>{' '}
                            {formatDate(item.receita.data_receita)}
                          </span>
                          {item.medico && (
                            <span>
                              <span className="font-medium">Médico:</span>{' '}
                              {item.medico.nome} (CRM: {item.medico.crm})
                            </span>
                          )}
                          {item.receita.origem_receita && (
                            <span>
                              <span className="font-medium">Origem:</span>{' '}
                              {item.receita.origem_receita}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {item.medicamentos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum medicamento cadastrado nesta receita
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {item.medicamentos.map((med, medIndex) => (
                        <div key={med.receitaMedicamento.id}>
                          {medIndex > 0 && <Separator className="my-6" />}
                          
                          <div className="space-y-4">
                            {/* Cabeçalho do Medicamento */}
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                <Pill className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-2">
                                  {med.medicamento.nome}
                                </h3>
                                
                                {/* Informações do Medicamento */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                                  {med.medicamento.principio_ativo && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        Princípio Ativo:
                                      </span>{' '}
                                      {med.medicamento.principio_ativo}
                                    </div>
                                  )}
                                  {med.medicamento.concentracao && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        Concentração:
                                      </span>{' '}
                                      {med.medicamento.concentracao}
                                    </div>
                                  )}
                                  {med.receitaMedicamento.posologia && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        Posologia:
                                      </span>{' '}
                                      {med.receitaMedicamento.posologia}
                                    </div>
                                  )}
                                  {med.receitaMedicamento.via_administracao && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        Via:
                                      </span>{' '}
                                      {med.receitaMedicamento.via_administracao}
                                    </div>
                                  )}
                                  {med.receitaMedicamento.frequencia_dia && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        Frequência:
                                      </span>{' '}
                                      {med.receitaMedicamento.frequencia_dia}x ao dia
                                    </div>
                                  )}
                                  {med.receitaMedicamento.duracao_dias && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        Duração:
                                      </span>{' '}
                                      {med.receitaMedicamento.duracao_dias} dias
                                    </div>
                                  )}
                                  {med.receitaMedicamento.quantidade_total && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">
                                        Quantidade:
                                      </span>{' '}
                                      {med.receitaMedicamento.quantidade_total}
                                    </div>
                                  )}
                                </div>

                                {med.receitaMedicamento.observacao && (
                                  <div className="mt-2 text-sm">
                                    <span className="font-medium text-muted-foreground">
                                      Observações:
                                    </span>{' '}
                                    {med.receitaMedicamento.observacao}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Agendamentos Previstos */}
                            {med.horarios.length > 0 && (
                              <div className="ml-8 mt-4">
                                <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Agendamentos Previstos ({med.horarios.length})
                                </h4>
                                <div className="grid gap-3">
                                  {med.horarios.map((horario) => (
                                    <Card key={horario.id} className="bg-muted/30">
                                      <CardContent className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                          <div>
                                            <span className="font-medium">Horário:</span>{' '}
                                            <Badge variant="outline" className="ml-1">
                                              {formatTime(horario.horario)}
                                            </Badge>
                                          </div>
                                          <div>
                                            <span className="font-medium">Dias:</span>{' '}
                                            {getDiasSemana(horario)}
                                          </div>
                                          {(horario.data_inicio || horario.data_fim) && (
                                            <div>
                                              <span className="font-medium">Período:</span>{' '}
                                              {horario.data_inicio && formatDate(horario.data_inicio)}
                                              {horario.data_inicio && horario.data_fim && ' a '}
                                              {horario.data_fim && formatDate(horario.data_fim)}
                                            </div>
                                          )}
                                        </div>
                                        {horario.observacao && (
                                          <div className="mt-2 text-xs text-muted-foreground">
                                            {horario.observacao}
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}

                            {med.horarios.length === 0 && (
                              <div className="ml-8 text-sm text-muted-foreground italic">
                                Nenhum horário agendado para este medicamento
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {relatorioData.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhum relatório gerado ainda</p>
                <p className="text-sm mt-2">
                  Selecione o período e clique em "Gerar Relatório"
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
