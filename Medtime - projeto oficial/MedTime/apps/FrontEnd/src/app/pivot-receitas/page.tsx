
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BarChart3, 
  Filter, 
  Download, 
  User, 
  Pill, 
  FileText, 
  Stethoscope,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import type { 
  Receita, 
  Paciente, 
  Medicamento, 
  ReceitaMedicamento,
  Medico 
} from '@/types/medtime';

interface PivotData {
  receitas: Receita[];
  pacientes: Paciente[];
  medicamentos: Medicamento[];
  receitaMedicamentos: ReceitaMedicamento[];
  medicos: Medico[];
}

interface PacienteMedicamentoStats {
  paciente: Paciente;
  medicamentos: {
    medicamento: Medicamento;
    receitas: number;
    ultimaReceita: string;
  }[];
  totalReceitas: number;
}

interface MedicamentoStats {
  medicamento: Medicamento;
  totalPacientes: number;
  totalReceitas: number;
  medicos: {
    medico: Medico;
    prescricoes: number;
  }[];
}

interface MedicoStats {
  medico: Medico;
  totalReceitas: number;
  totalPacientes: number;
  medicamentos: {
    medicamento: Medicamento;
    prescricoes: number;
  }[];
}

interface ReceitaCompleta {
  receita: Receita;
  paciente: Paciente;
  medico?: Medico;
  medicamentos: {
    medicamento: Medicamento;
    receitaMedicamento: ReceitaMedicamento;
  }[];
}

export default function PivotReceitasPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pivotData, setPivotData] = useState<PivotData | null>(null);
  const [activeTab, setActiveTab] = useState('paciente-medicamento');

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.push('/meus-medicamentos');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    
    setDataInicio(trintaDiasAtras.toISOString().split('T')[0]);
    setDataFim(hoje.toISOString().split('T')[0]);
  }, []);

  const carregarDados = async () => {
    if (!dataInicio || !dataFim) {
      toast.error('Selecione o período para análise');
      return;
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      toast.error('Data inicial não pode ser maior que data final');
      return;
    }

    try {
      setLoading(true);

      const [receitas, pacientes, medicamentos, medicos] = await Promise.all([
        api.get<Receita[]>('/receitas', { limit: '1000' }),
        api.get<Paciente[]>('/pacientes', { limit: '1000' }),
        api.get<Medicamento[]>('/medicamentos', { limit: '1000' }),
        api.get<Medico[]>('/medicos', { limit: '1000' }),
      ]);

      const receitasFiltradas = receitas.filter(r => {
        const dataReceita = new Date(r.data_receita);
        return dataReceita >= new Date(dataInicio) && dataReceita <= new Date(dataFim);
      });

      if (receitasFiltradas.length === 0) {
        toast.info('Nenhuma receita encontrada no período selecionado');
        setPivotData(null);
        return;
      }

      const receitaMedicamentosPromises = receitasFiltradas.map(r =>
        api.get<ReceitaMedicamento[]>(`/receita-medicamentos?id_receita=${r.id}`)
      );

      const receitaMedicamentosArrays = await Promise.all(receitaMedicamentosPromises);
      const receitaMedicamentos = receitaMedicamentosArrays.flat();

      setPivotData({
        receitas: receitasFiltradas,
        pacientes,
        medicamentos,
        receitaMedicamentos,
        medicos,
      });

      toast.success(`Dados carregados: ${receitasFiltradas.length} receita(s)`);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getPacienteMedicamentoStats = (): PacienteMedicamentoStats[] => {
    if (!pivotData) return [];

    const stats: PacienteMedicamentoStats[] = [];

    pivotData.pacientes.forEach(paciente => {
      const receitasPaciente = pivotData.receitas.filter(r => r.id_paciente === paciente.id);
      
      if (receitasPaciente.length === 0) return;

      const medicamentosMap = new Map<number, {
        medicamento: Medicamento;
        receitas: number;
        ultimaReceita: string;
      }>();

      receitasPaciente.forEach(receita => {
        const medicamentosReceita = pivotData.receitaMedicamentos.filter(
          rm => rm.id_receita === receita.id
        );

        medicamentosReceita.forEach(rm => {
          const medicamento = pivotData.medicamentos.find(m => m.id === rm.id_medicamento);
          if (!medicamento) return;

          const existing = medicamentosMap.get(medicamento.id);
          if (existing) {
            existing.receitas++;
            if (new Date(receita.data_receita) > new Date(existing.ultimaReceita)) {
              existing.ultimaReceita = receita.data_receita;
            }
          } else {
            medicamentosMap.set(medicamento.id, {
              medicamento,
              receitas: 1,
              ultimaReceita: receita.data_receita,
            });
          }
        });
      });

      stats.push({
        paciente,
        medicamentos: Array.from(medicamentosMap.values()).sort((a, b) => b.receitas - a.receitas),
        totalReceitas: receitasPaciente.length,
      });
    });

    return stats.sort((a, b) => b.totalReceitas - a.totalReceitas);
  };

  const getMedicamentoStats = (): MedicamentoStats[] => {
    if (!pivotData) return [];

    const stats: MedicamentoStats[] = [];

    pivotData.medicamentos.forEach(medicamento => {
      const receitasMedicamento = pivotData.receitaMedicamentos.filter(
        rm => rm.id_medicamento === medicamento.id
      );

      if (receitasMedicamento.length === 0) return;

      const pacientesSet = new Set<number>();
      const medicosMap = new Map<number, number>();

      receitasMedicamento.forEach(rm => {
        const receita = pivotData.receitas.find(r => r.id === rm.id_receita);
        if (!receita) return;

        pacientesSet.add(receita.id_paciente);

        if (receita.id_medico) {
          medicosMap.set(receita.id_medico, (medicosMap.get(receita.id_medico) || 0) + 1);
        }
      });

      const medicosStats = Array.from(medicosMap.entries())
        .map(([medicoId, prescricoes]) => {
          const medico = pivotData.medicos.find(m => m.id === medicoId);
          return medico ? { medico, prescricoes } : null;
        })
        .filter(Boolean) as { medico: Medico; prescricoes: number }[];

      stats.push({
        medicamento,
        totalPacientes: pacientesSet.size,
        totalReceitas: receitasMedicamento.length,
        medicos: medicosStats.sort((a, b) => b.prescricoes - a.prescricoes),
      });
    });

    return stats.sort((a, b) => b.totalReceitas - a.totalReceitas);
  };

  const getMedicoStats = (): MedicoStats[] => {
    if (!pivotData) return [];

    const stats: MedicoStats[] = [];

    pivotData.medicos.forEach(medico => {
      const receitasMedico = pivotData.receitas.filter(r => r.id_medico === medico.id);

      if (receitasMedico.length === 0) return;

      const pacientesSet = new Set<number>();
      const medicamentosMap = new Map<number, number>();

      receitasMedico.forEach(receita => {
        pacientesSet.add(receita.id_paciente);

        const medicamentosReceita = pivotData.receitaMedicamentos.filter(
          rm => rm.id_receita === receita.id
        );

        medicamentosReceita.forEach(rm => {
          medicamentosMap.set(rm.id_medicamento, (medicamentosMap.get(rm.id_medicamento) || 0) + 1);
        });
      });

      const medicamentosStats = Array.from(medicamentosMap.entries())
        .map(([medicamentoId, prescricoes]) => {
          const medicamento = pivotData.medicamentos.find(m => m.id === medicamentoId);
          return medicamento ? { medicamento, prescricoes } : null;
        })
        .filter(Boolean) as { medicamento: Medicamento; prescricoes: number }[];

      stats.push({
        medico,
        totalReceitas: receitasMedico.length,
        totalPacientes: pacientesSet.size,
        medicamentos: medicamentosStats.sort((a, b) => b.prescricoes - a.prescricoes),
      });
    });

    return stats.sort((a, b) => b.totalReceitas - a.totalReceitas);
  };

  const getReceitasCompletas = (): ReceitaCompleta[] => {
    if (!pivotData) return [];

    return pivotData.receitas.map(receita => {
      const paciente = pivotData.pacientes.find(p => String(p.id) === String(receita.id_paciente));
      const medico = pivotData.medicos.find(m => m.id === receita.id_medico);
      
      const medicamentosReceita = pivotData.receitaMedicamentos
        .filter(rm => rm.id_receita === receita.id)
        .map(rm => {
          const medicamento = pivotData.medicamentos.find(m => m.id === rm.id_medicamento);
          return medicamento ? { medicamento, receitaMedicamento: rm } : null;
        })
        .filter(Boolean) as { medicamento: Medicamento; receitaMedicamento: ReceitaMedicamento }[];

      return {
        receita,
        paciente: paciente!,
        medico,
        medicamentos: medicamentosReceita,
      };
    }).filter(rc => rc.paciente);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const exportarDados = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  if (isLoading || !user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pacienteMedicamentoStats = getPacienteMedicamentoStats();
  const medicamentoStats = getMedicamentoStats();
  const medicoStats = getMedicoStats();
  const receitasCompletas = getReceitasCompletas();

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Análise Pivot de Receitas</h1>
          <p className="text-muted-foreground">
            Visualize dados cruzados de pacientes, medicamentos, receitas e médicos
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Período de Análise
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
                  onClick={carregarDados} 
                  disabled={loading}
                  className="flex-1"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {loading ? 'Carregando...' : 'Carregar Dados'}
                </Button>
                {pivotData && (
                  <Button 
                    variant="outline" 
                    onClick={exportarDados}
                    title="Exportar dados"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {pivotData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Receitas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pivotData.receitas.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pacientes Atendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(pivotData.receitas.map(r => r.id_paciente)).size}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Medicamentos Prescritos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(pivotData.receitaMedicamentos.map(rm => rm.id_medicamento)).size}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Médicos Prescritores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(pivotData.receitas.filter(r => r.id_medico).map(r => r.id_medico)).size}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="paciente-medicamento">
                  <User className="h-4 w-4 mr-2" />
                  Paciente × Medicamento
                </TabsTrigger>
                <TabsTrigger value="medicamento-medico">
                  <Pill className="h-4 w-4 mr-2" />
                  Medicamento × Médico
                </TabsTrigger>
                <TabsTrigger value="medico-paciente">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Médico × Paciente
                </TabsTrigger>
                <TabsTrigger value="receitas-completas">
                  <FileText className="h-4 w-4 mr-2" />
                  Visão Completa
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paciente-medicamento" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pacientes e seus Medicamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {pacienteMedicamentoStats.map(stat => (
                        <div key={stat.paciente.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{stat.paciente.nome}</h3>
                              <p className="text-sm text-muted-foreground">
                                SUS: {stat.paciente.cartao_sus}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {stat.totalReceitas} receita(s)
                            </Badge>
                          </div>

                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Medicamento</TableHead>
                                <TableHead>Prescrições</TableHead>
                                <TableHead>Última Receita</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {stat.medicamentos.map(med => (
                                <TableRow key={med.medicamento.id}>
                                  <TableCell className="font-medium">
                                    {med.medicamento.nome}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{med.receitas}x</Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {formatDate(med.ultimaReceita)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="medicamento-medico" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Medicamentos e Médicos Prescritores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {medicamentoStats.map(stat => (
                        <div key={stat.medicamento.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{stat.medicamento.nome}</h3>
                              {stat.medicamento.principio_ativo && (
                                <p className="text-sm text-muted-foreground">
                                  {stat.medicamento.principio_ativo}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="mb-1">
                                {stat.totalReceitas} prescrição(ões)
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {stat.totalPacientes} paciente(s)
                              </p>
                            </div>
                          </div>

                          {stat.medicos.length > 0 && (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Médico</TableHead>
                                  <TableHead>CRM</TableHead>
                                  <TableHead>Especialidade</TableHead>
                                  <TableHead>Prescrições</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {stat.medicos.map(med => (
                                  <TableRow key={med.medico.id}>
                                    <TableCell className="font-medium">
                                      {med.medico.nome}
                                    </TableCell>
                                    <TableCell>{med.medico.crm}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {med.medico.especialidade}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{med.prescricoes}x</Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="medico-paciente" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Médicos e Medicamentos Prescritos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {medicoStats.map(stat => (
                        <div key={stat.medico.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{stat.medico.nome}</h3>
                              <p className="text-sm text-muted-foreground">
                                CRM: {stat.medico.crm} | {stat.medico.especialidade}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="mb-1">
                                {stat.totalReceitas} receita(s)
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {stat.totalPacientes} paciente(s)
                              </p>
                            </div>
                          </div>

                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Medicamento</TableHead>
                                <TableHead>Prescrições</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {stat.medicamentos.map(med => (
                                <TableRow key={med.medicamento.id}>
                                  <TableCell className="font-medium">
                                    {med.medicamento.nome}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{med.prescricoes}x</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="receitas-completas" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Visão Completa das Receitas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receita</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Médico</TableHead>
                          <TableHead>Medicamentos</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receitasCompletas.map(rc => (
                          <TableRow key={rc.receita.id}>
                            <TableCell className="font-medium">
                              #{rc.receita.id}
                            </TableCell>
                            <TableCell>
                              {formatDate(rc.receita.data_receita)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{rc.paciente.nome}</div>
                                <div className="text-xs text-muted-foreground">
                                  SUS: {rc.paciente.cartao_sus}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {rc.medico ? (
                                <div>
                                  <div className="font-medium">{rc.medico.nome}</div>
                                  <div className="text-xs text-muted-foreground">
                                    CRM: {rc.medico.crm}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {rc.medicamentos.map(m => (
                                  <div key={m.medicamento.id} className="text-sm">
                                    {m.medicamento.nome}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  rc.receita.status === 'ativa'
                                    ? 'default'
                                    : rc.receita.status === 'concluida'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {rc.receita.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {!pivotData && !loading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhum dado carregado ainda</p>
                <p className="text-sm mt-2">
                  Selecione o período e clique em "Carregar Dados"
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
