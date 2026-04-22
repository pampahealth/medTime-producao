
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Pill, User, FileText, Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { 
  Receita, 
  ReceitaMedicamento, 
  ReceitaHorario, 
  Paciente, 
  Medicamento,
  Medico 
} from '@/types/medtime';

interface AgendamentoCompleto {
  receita: Receita;
  paciente: Paciente;
  medico?: Medico;
  receitaMedicamento: ReceitaMedicamento;
  medicamento: Medicamento;
  horarios: ReceitaHorario[];
}

export default function AgendamentosGridPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<AgendamentoCompleto[]>([]);
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState<AgendamentoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filtros, setFiltros] = useState({
    paciente: '',
    medicamento: '',
    status: 'todos',
    dataInicio: '',
    dataFim: '',
  });

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.push('/meus-medicamentos');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchAgendamentos();
    }
  }, [user]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, agendamentos]);

  const fetchAgendamentos = async () => {
    try {
      setLoading(true);

      const [receitas, pacientes, medicamentos, medicos] = await Promise.all([
        api.get<Receita[]>('/receitas', { limit: '1000' }),
        api.get<Paciente[]>('/pacientes', { limit: '1000' }),
        api.get<Medicamento[]>('/medicamentos', { limit: '1000' }),
        api.get<Medico[]>('/medicos', { limit: '1000' }),
      ]);

      const agendamentosCompletos: AgendamentoCompleto[] = [];

      for (const receita of receitas) {
        const receitaMedicamentos = await api.get<ReceitaMedicamento[]>(
          `/receita-medicamentos?id_receita=${receita.id}`
        );

        for (const rm of receitaMedicamentos) {
          const horarios = await api.get<ReceitaHorario[]>(
            `/receita-horarios?id_receita_medicamento=${rm.id}`
          );

          if (horarios && horarios.length > 0) {
            const paciente = pacientes.find(p => String(p.id) === String(receita.id_paciente));
            const medicamento = medicamentos.find(m => m.id === rm.id_medicamento);
            const medico = medicos.find(m => m.id === receita.id_medico);

            if (paciente && medicamento) {
              agendamentosCompletos.push({
                receita,
                paciente,
                medico,
                receitaMedicamento: rm,
                medicamento,
                horarios,
              });
            }
          }
        }
      }

      setAgendamentos(agendamentosCompletos);
    } catch (error) {
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...agendamentos];

    if (filtros.paciente) {
      resultado = resultado.filter(a =>
        a.paciente.nome.toLowerCase().includes(filtros.paciente.toLowerCase())
      );
    }

    if (filtros.medicamento) {
      resultado = resultado.filter(a =>
        a.medicamento.nome.toLowerCase().includes(filtros.medicamento.toLowerCase())
      );
    }

    if (filtros.status !== 'todos') {
      resultado = resultado.filter(a => a.receita.status === filtros.status);
    }

    if (filtros.dataInicio) {
      resultado = resultado.filter(a =>
        a.horarios.some(h => h.data_inicio && h.data_inicio >= filtros.dataInicio)
      );
    }

    if (filtros.dataFim) {
      resultado = resultado.filter(a =>
        a.horarios.some(h => h.data_fim && h.data_fim <= filtros.dataFim)
      );
    }

    setAgendamentosFiltrados(resultado);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarHorario = (horario: string) => {
    return horario.substring(0, 5);
  };

  const getDiasSemana = (horario: ReceitaHorario): string[] => {
    const dias: string[] = [];
    if (horario.domingo) dias.push('Dom');
    if (horario.segunda) dias.push('Seg');
    if (horario.terca) dias.push('Ter');
    if (horario.quarta) dias.push('Qua');
    if (horario.quinta) dias.push('Qui');
    if (horario.sexta) dias.push('Sex');
    if (horario.sabado) dias.push('Sáb');
    return dias;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'default';
      case 'concluida':
        return 'secondary';
      case 'cancelada':
        return 'destructive';
      default:
        return 'outline';
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
          <h1 className="text-3xl font-bold mb-2">Agendamentos de Medicamentos</h1>
          <p className="text-muted-foreground">
            Visualize todos os agendamentos de medicamentos cadastrados no sistema
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="filtro-paciente">Paciente</Label>
                <Input
                  id="filtro-paciente"
                  placeholder="Nome do paciente"
                  value={filtros.paciente}
                  onChange={(e) => setFiltros({ ...filtros, paciente: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="filtro-medicamento">Medicamento</Label>
                <Input
                  id="filtro-medicamento"
                  placeholder="Nome do medicamento"
                  value={filtros.medicamento}
                  onChange={(e) => setFiltros({ ...filtros, medicamento: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="filtro-status">Status</Label>
                <Select
                  value={filtros.status}
                  onValueChange={(value) => setFiltros({ ...filtros, status: value })}
                >
                  <SelectTrigger id="filtro-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="filtro-data-inicio">Data Início</Label>
                <Input
                  id="filtro-data-inicio"
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="filtro-data-fim">Data Fim</Label>
                <Input
                  id="filtro-data-fim"
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {agendamentosFiltrados.length} de {agendamentos.length} agendamentos
          </p>
        </div>

        {agendamentosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                Nenhum agendamento encontrado com os filtros aplicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agendamentosFiltrados.map((agendamento, index) => (
              <Card key={`${agendamento.receita.id}-${agendamento.receitaMedicamento.id}-${index}`} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="h-4 w-4 text-primary" />
                        <CardTitle className="text-lg line-clamp-2">
                          {agendamento.medicamento.nome}
                        </CardTitle>
                      </div>
                      {agendamento.medicamento.principio_ativo && (
                        <p className="text-xs text-muted-foreground">
                          {agendamento.medicamento.principio_ativo}
                        </p>
                      )}
                    </div>
                    <Badge variant={getStatusColor(agendamento.receita.status)}>
                      {agendamento.receita.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{agendamento.paciente.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          SUS: {agendamento.paciente.cartao_sus}
                        </p>
                      </div>
                    </div>

                    {agendamento.medico && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{agendamento.medico.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            CRM: {agendamento.medico.crm} - {agendamento.medico.especialidade}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Receita: {formatarData(agendamento.receita.data_receita)}
                      </span>
                    </div>
                  </div>

                  {agendamento.receitaMedicamento.posologia && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium mb-1">Posologia</p>
                      <p className="text-sm">{agendamento.receitaMedicamento.posologia}</p>
                      {agendamento.receitaMedicamento.via_administracao && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Via: {agendamento.receitaMedicamento.via_administracao}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Horários Agendados ({agendamento.horarios.length})
                    </p>
                    <div className="space-y-2">
                      {agendamento.horarios.map((horario) => (
                        <div
                          key={horario.id}
                          className="bg-primary/5 rounded-lg p-3 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-primary">
                              {formatarHorario(horario.horario)}
                            </span>
                          </div>

                          {horario.data_inicio && horario.data_fim && (
                            <div className="text-xs text-muted-foreground">
                              {formatarData(horario.data_inicio)} até {formatarData(horario.data_fim)}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1">
                            {getDiasSemana(horario).map((dia) => (
                              <Badge key={dia} variant="outline" className="text-xs">
                                {dia}
                              </Badge>
                            ))}
                          </div>

                          {horario.observacao && (
                            <p className="text-xs text-muted-foreground italic">
                              {horario.observacao}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {agendamento.receitaMedicamento.observacao && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium mb-1">Observações</p>
                      <p className="text-xs text-muted-foreground">
                        {agendamento.receitaMedicamento.observacao}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
