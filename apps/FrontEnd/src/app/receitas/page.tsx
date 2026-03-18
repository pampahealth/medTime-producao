
'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Plus, Edit, Trash2, Eye, X, ArrowLeft, ArrowRight, AlertCircle, Search, Pill, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import type { Receita, Paciente, Medicamento, ReceitaMedicamento, Medico, Agendamento } from '@/types/medtime';
import { Stepper } from '@/components/ui/stepper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface ReceitaFormData {
  id?: number;
  id_paciente: string;
  id_prefeitura: string;
  id_medico: string;
  data_receita: string;
  origem_receita: string;
  subgrupo_origem: string;
  observacao: string;
  tipo_prescritor: string;
  num_notificacao: string;
  status: 'ativa' | 'concluida' | 'cancelada';
}

interface MedicamentoFormData {
  id_medicamento: string;
  quantidade_total: string;
  frequencia_dia: string;
  duracao_dias: string;
  dias_dispensar: string;
  observacao: string;
  posologia: string;
  via_administracao: string;
}

/** Um horário de administração para um medicamento no wizard (etapa 3) */
interface HorarioMedicamentoWizard {
  horario: string;   // datetime-local ou ISO
  dataFim: string;  // date ou datetime
  observacao: string;
}

interface TempMedicamento extends MedicamentoFormData {
  tempId: string;
}

interface PacienteUpdateData {
  celular: string;
  cpf: string;
  data_nascimento: string;
}

interface MedicoUpdateData {
  nome: string;
  crm: string;
  especialidade: string;
}

interface MedicamentoUpdateData {
  nome: string;
  principio_ativo: string;
  concentracao: string;
  forma_farmaceutica: string;
}

/** Conteúdo do hover: medicamentos relacionados à receita */
function MedicamentosHoverContent({
  receitaId,
  getMedicamentoNome,
  isOpen,
}: {
  receitaId: number | string;
  getMedicamentoNome: (id: number | string) => string;
  isOpen: boolean;
}) {
  const [list, setList] = useState<ReceitaMedicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);
  const idReceita = String(receitaId).trim();
  useEffect(() => {
    if (!idReceita) {
      setList([]);
      setLoading(false);
      setError(false);
      return;
    }
    if (!isOpen) return;
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(false);
    setList([]);
    api
      .get<ReceitaMedicamento[]>('/receita-medicamentos', { id_receita: idReceita })
      .then((data) => {
        if (reqId !== requestIdRef.current) return;
        let arr: ReceitaMedicamento[] = [];
        if (Array.isArray(data)) {
          arr = data;
        } else if (data && typeof data === 'object' && 'data' in data) {
          const inner = (data as { data: unknown }).data;
          arr = Array.isArray(inner) ? (inner as ReceitaMedicamento[]) : [];
        }
        setList(arr);
      })
      .catch(() => {
        if (reqId !== requestIdRef.current) return;
        setList([]);
        setError(true);
      })
      .finally(() => {
        if (reqId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [idReceita, isOpen]);
  return (
    <div className="p-3 min-w-[260px] max-w-[340px] max-h-[360px] overflow-auto bg-popover text-popover-foreground rounded-md border shadow-lg z-[100]">
      <p className="text-sm font-semibold flex items-center gap-2 mb-2">
        <Pill className="h-4 w-4 shrink-0" />
        Medicamentos desta receita
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : error ? (
        <p className="text-sm text-destructive">Erro ao carregar medicamentos.</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum medicamento vinculado.</p>
      ) : (
        <ul className="text-sm space-y-2 list-none p-0 m-0">
          {list.map((rm, idx) => {
            const idMed = rm.id_medicamento ?? (rm as Record<string, unknown>).a006_id_medicamento ?? rm.id;
            return (
              <li key={String(rm.id ?? idMed ?? idx)} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                <span className="font-medium">{getMedicamentoNome(idMed as number | string)}</span>
                {(rm.posologia ?? rm.observacao) && (
                  <span className="text-muted-foreground">
                    {' '}
                    — {String(rm.posologia ?? rm.observacao ?? '')}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function ReceitasPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedReceita, setSelectedReceita] = useState<Receita | null>(null);
  const [receitaMedicamentos, setReceitaMedicamentos] = useState<ReceitaMedicamento[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  /** ID do receita-medicamento em processo de exclusão (evita duplo clique e mostra loading). */
  const [removingMedicamentoId, setRemovingMedicamentoId] = useState<string | number | null>(null);

  const [searchReceitaId, setSearchReceitaId] = useState('');
  const [filtroReceitas, setFiltroReceitas] = useState('');
  const [paginaReceitas, setPaginaReceitas] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const [isLoadingReceita, setIsLoadingReceita] = useState(false);
  const [hoveredReceitaId, setHoveredReceitaId] = useState<number | string | null>(null);
  const hoverCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [updatePacienteModalOpen, setUpdatePacienteModalOpen] = useState(false);
  const [selectedPacienteForUpdate, setSelectedPacienteForUpdate] = useState<Paciente | null>(null);
  const [pacienteUpdateData, setPacienteUpdateData] = useState<PacienteUpdateData>({
    celular: '',
    cpf: '',
    data_nascimento: '',
  });

  const [updateMedicoModalOpen, setUpdateMedicoModalOpen] = useState(false);
  const [selectedMedicoForUpdate, setSelectedMedicoForUpdate] = useState<Medico | null>(null);
  const [medicoUpdateData, setMedicoUpdateData] = useState<MedicoUpdateData>({
    nome: '',
    crm: '',
    especialidade: '',
  });

  const [updateMedicamentoModalOpen, setUpdateMedicamentoModalOpen] = useState(false);
  const [selectedMedicamentoForUpdate, setSelectedMedicamentoForUpdate] = useState<Medicamento | null>(null);
  const [medicamentoUpdateData, setMedicamentoUpdateData] = useState<MedicamentoUpdateData>({
    nome: '',
    principio_ativo: '',
    concentracao: '',
    forma_farmaceutica: '',
  });

  const [formData, setFormData] = useState<ReceitaFormData>({
    id_paciente: '',
    id_prefeitura: '1',
    id_medico: '',
    data_receita: new Date().toISOString().split('T')[0],
    origem_receita: '',
    subgrupo_origem: '',
    observacao: '',
    tipo_prescritor: '',
    num_notificacao: '',
    status: 'ativa',
  });

  const [medicamentoFormData, setMedicamentoFormData] = useState<MedicamentoFormData>({
    id_medicamento: '',
    quantidade_total: '',
    frequencia_dia: '',
    duracao_dias: '',
    dias_dispensar: '',
    observacao: '',
    posologia: '',
    via_administracao: '',
  });

  const [tempMedicamentos, setTempMedicamentos] = useState<TempMedicamento[]>([]);
  /** Horários de administração por medicamento (chave = tempId do medicamento) */
  const [tempHorariosPorMedicamento, setTempHorariosPorMedicamento] = useState<Record<string, HorarioMedicamentoWizard[]>>({});
  const [createdReceitaId, setCreatedReceitaId] = useState<number | string | null>(null);
  const [loadedReceitaId, setLoadedReceitaId] = useState<number | string | null>(null);
  /** Evita múltiplos envios ao clicar mais de uma vez em Finalizar (causava medicamentos duplicados). */
  const [isFinishingWizard, setIsFinishingWizard] = useState(false);
  const [pacientePopoverOpen, setPacientePopoverOpen] = useState(false);
  const [medicoPopoverOpen, setMedicoPopoverOpen] = useState(false);
  const [medicamentoPopoverOpen, setMedicamentoPopoverOpen] = useState(false);

  const wizardSteps = ['Dados da Receita', 'Medicamentos', 'Horários dos Medicamentos'];

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.push('/meus-medicamentos');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchReceitas();
      fetchPacientes();
      fetchMedicamentos();
      fetchMedicos();
    }
  }, [user]);

  const fetchReceitas = async () => {
    try {
      setLoading(true);
      const data = await api.get<Receita[]>('/receitas', { limit: '10000' });
      setReceitas(data || []);
    } catch (error) {
      toast.error('Erro ao carregar receitas');
    } finally {
      setLoading(false);
    }
  };

  const fetchPacientes = async () => {
    try {
      const data = await api.get<Paciente[]>('/pacientes', { limit: '100' });
      setPacientes(data || []);
    } catch (error) {
      toast.error('Erro ao carregar pacientes');
    }
  };

  const fetchMedicamentos = async () => {
    try {
      const data = await api.get<Medicamento[]>('/medicamentos', { limit: '500' });
      setMedicamentos(data || []);
    } catch (error) {
      toast.error('Erro ao carregar medicamentos');
    }
  };

  const fetchMedicos = async () => {
    try {
      const data = await api.get<Medico[]>('/medicos', { limit: '500' });
      setMedicos(data || []);
    } catch (error) {
      toast.error('Erro ao carregar médicos');
    }
  };

  const fetchReceitaMedicamentos = async (receitaId: number | string) => {
    if (receitaId == null || receitaId === '') {
      setReceitaMedicamentos([]);
      return;
    }
    try {
      const data = await api.get<ReceitaMedicamento[]>(`/receita-medicamentos?id_receita=${encodeURIComponent(String(receitaId))}`);
      setReceitaMedicamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erro ao carregar medicamentos da receita');
      setReceitaMedicamentos([]);
    }
  };

  const fetchAgendamentos = async (receitaId: number | string) => {
    if (receitaId == null || receitaId === '') {
      setAgendamentos([]);
      return;
    }
    try {
      const data = await api.get<Agendamento[]>(`/agendamentos?id_receita=${encodeURIComponent(String(receitaId))}`);
      setAgendamentos(Array.isArray(data) ? data : []);
    } catch {
      setAgendamentos([]);
    }
  };

  const handleSearchReceita = async () => {
    if (!searchReceitaId.trim()) {
      toast.error('Digite o código da receita');
      return;
    }

    try {
      setIsLoadingReceita(true);
      const receita = await api.get<Receita>(`/receitas/${encodeURIComponent(searchReceitaId.trim())}`);
      
      if (!receita) {
        toast.error('Receita não encontrada');
        return;
      }

      const [medicamentosData, agendamentosData] = await Promise.all([
        api.get<ReceitaMedicamento[]>(`/receita-medicamentos?id_receita=${receita.id}`),
        api.get<Agendamento[]>(`/agendamentos?id_receita=${receita.id}`)
      ]);

      setFormData({
        id: receita.id,
        id_paciente: receita.id_paciente.toString(),
        id_prefeitura: receita.id_prefeitura.toString(),
        id_medico: receita.id_medico?.toString() || '',
        data_receita: receita.data_receita,
        origem_receita: receita.origem_receita || '',
        subgrupo_origem: receita.subgrupo_origem || '',
        observacao: receita.observacao || '',
        tipo_prescritor: receita.tipo_prescritor || '',
        num_notificacao: receita.num_notificacao || '',
        status: receita.status,
      });

      setLoadedReceitaId(receita.id);
      setCreatedReceitaId(null);

      if (medicamentosData && medicamentosData.length > 0) {
        const tempMeds: TempMedicamento[] = medicamentosData.map((rm, idx) => ({
          tempId: `existing-${idx}`,
          id_medicamento: rm.id_medicamento.toString(),
          quantidade_total: rm.quantidade_total?.toString() || '',
          frequencia_dia: rm.frequencia_dia?.toString() || '',
          duracao_dias: rm.duracao_dias?.toString() || '',
          dias_dispensar: rm.dias_dispensar?.toString() || '',
          observacao: rm.observacao || '',
          posologia: rm.posologia || '',
          via_administracao: rm.via_administracao || '',
        }));
        setTempMedicamentos(tempMeds);
      }

      toast.success('Receita carregada com sucesso!');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao buscar receita');
    } finally {
      setIsLoadingReceita(false);
    }
  };

  const handleOpenWizard = () => {
    resetWizard();
    setWizardOpen(true);
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setCreatedReceitaId(null);
    setLoadedReceitaId(null);
    setTempMedicamentos([]);
    setTempHorariosPorMedicamento({});
    setIsFinishingWizard(false);
    setSearchReceitaId('');
    setFormData({
      id: undefined,
      id_paciente: '',
      id_prefeitura: '1',
      id_medico: '',
      data_receita: new Date().toISOString().split('T')[0],
      origem_receita: '',
      subgrupo_origem: '',
      observacao: '',
      tipo_prescritor: '',
      num_notificacao: '',
      status: 'ativa',
    });
    resetMedicamentoForm();
  };

  const resetMedicamentoForm = () => {
    setMedicamentoFormData({
      id_medicamento: '',
      quantidade_total: '',
      frequencia_dia: '',
      duracao_dias: '',
      dias_dispensar: '',
      observacao: '',
      posologia: '',
      via_administracao: '',
    });
  };

  const validatePacienteData = (paciente: Paciente): boolean => {
    const missingFields: string[] = [];
    
    if (!paciente.celular) {
      missingFields.push('celular');
    }
    if (!paciente.cpf) {
      missingFields.push('CPF');
    }
    if (!paciente.data_nascimento) {
      missingFields.push('data de nascimento');
    }

    if (missingFields.length > 0) {
      setSelectedPacienteForUpdate(paciente);
      setPacienteUpdateData({
        celular: paciente.celular || '',
        cpf: paciente.cpf || '',
        data_nascimento: paciente.data_nascimento || '',
      });
      setUpdatePacienteModalOpen(true);
      return false;
    }

    return true;
  };

  const handleUpdatePaciente = async () => {
    if (!selectedPacienteForUpdate) return;

    if (!pacienteUpdateData.celular || !pacienteUpdateData.cpf || !pacienteUpdateData.data_nascimento) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    if (pacienteUpdateData.cpf.length !== 11) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }

    try {
      await api.put(`/pacientes?id=${selectedPacienteForUpdate.id}`, {
        ...selectedPacienteForUpdate,
        celular: pacienteUpdateData.celular,
        cpf: pacienteUpdateData.cpf,
        data_nascimento: pacienteUpdateData.data_nascimento,
      });

      toast.success('Dados do paciente atualizados com sucesso!');
      setUpdatePacienteModalOpen(false);
      await fetchPacientes();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar dados do paciente');
    }
  };

  const handleOpenEditPaciente = () => {
    const paciente = pacientes.find(p => String(p.id) === String(formData.id_paciente));
    if (!paciente) {
      toast.error('Selecione um paciente primeiro');
      return;
    }

    setSelectedPacienteForUpdate(paciente);
    setPacienteUpdateData({
      celular: paciente.celular || '',
      cpf: paciente.cpf || '',
      data_nascimento: paciente.data_nascimento || '',
    });
    setUpdatePacienteModalOpen(true);
  };

  const handleOpenEditMedico = () => {
    const medico = medicos.find(m => String(m.id) === String(formData.id_medico));
    if (!medico) {
      toast.error('Selecione um médico primeiro');
      return;
    }

    setSelectedMedicoForUpdate(medico);
    setMedicoUpdateData({
      nome: medico.nome,
      crm: medico.crm,
      especialidade: medico.especialidade,
    });
    setUpdateMedicoModalOpen(true);
  };

  const handleUpdateMedico = async () => {
    if (!selectedMedicoForUpdate) return;

    if (!medicoUpdateData.nome || !medicoUpdateData.crm || !medicoUpdateData.especialidade) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    try {
      await api.put(`/medicos?id=${selectedMedicoForUpdate.id}`, medicoUpdateData);
      toast.success('Dados do médico atualizados com sucesso!');
      setUpdateMedicoModalOpen(false);
      await fetchMedicos();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar dados do médico');
    }
  };

  const handleOpenEditMedicamento = (medicamentoId: string) => {
    const medicamento = medicamentos.find(m => m.id === parseInt(medicamentoId));
    if (!medicamento) {
      toast.error('Medicamento não encontrado');
      return;
    }

    setSelectedMedicamentoForUpdate(medicamento);
    setMedicamentoUpdateData({
      nome: medicamento.nome,
      principio_ativo: medicamento.principio_ativo || '',
      concentracao: medicamento.concentracao || '',
      forma_farmaceutica: medicamento.forma_farmaceutica || '',
    });
    setUpdateMedicamentoModalOpen(true);
  };

  const handleUpdateMedicamento = async () => {
    if (!selectedMedicamentoForUpdate) return;

    if (!medicamentoUpdateData.nome) {
      toast.error('Nome do medicamento é obrigatório');
      return;
    }

    try {
      await api.put(`/medicamentos?id=${selectedMedicamentoForUpdate.id}`, medicamentoUpdateData);
      toast.success('Dados do medicamento atualizados com sucesso!');
      setUpdateMedicamentoModalOpen(false);
      await fetchMedicamentos();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar dados do medicamento');
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!formData.id_paciente || !formData.data_receita) {
        toast.error('Preencha os campos obrigatórios');
        return;
      }

      const selectedPaciente = pacientes.find(p => String(p.id) === String(formData.id_paciente));
      if (!selectedPaciente) {
        toast.error('Paciente não encontrado');
        return;
      }

      const isValid = validatePacienteData(selectedPaciente);
      if (!isValid) {
        return;
      }

      const receitaIdAtual = createdReceitaId ?? loadedReceitaId;
      if (!receitaIdAtual) {
        try {
          const submitData = {
            id_paciente: formData.id_paciente,
            id_prefeitura: formData.id_prefeitura,
            id_medico: formData.id_medico ? String(formData.id_medico) : null,
            data_receita: formData.data_receita,
            origem_receita: formData.origem_receita || undefined,
            subgrupo_origem: formData.subgrupo_origem || undefined,
            observacao: formData.observacao || undefined,
            tipo_prescritor: formData.tipo_prescritor || undefined,
            num_notificacao: formData.num_notificacao || undefined,
            status: formData.status,
          };

          const createdReceita = await api.post<Receita>('/receitas', submitData);
          const novoId = createdReceita?.id ?? null;
          if (!novoId) {
            toast.error('Resposta da API sem ID da receita. Tente novamente.');
            return;
          }
          setCreatedReceitaId(novoId);
          toast.success('Receita criada! Agora adicione os medicamentos.');
        } catch (error: any) {
          toast.error(error?.message || 'Erro ao criar receita');
          return;
        }
      }
      
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (tempMedicamentos.length === 0) {
        toast.error('Adicione pelo menos um medicamento');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddTempMedicamento = () => {
    if (!medicamentoFormData.id_medicamento) {
      toast.error('Selecione um medicamento');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    setTempMedicamentos([...tempMedicamentos, { ...medicamentoFormData, tempId }]);
    resetMedicamentoForm();
    toast.success('Medicamento adicionado à lista');
  };

  const handleRemoveTempMedicamento = (tempId: string) => {
    setTempMedicamentos(tempMedicamentos.filter(m => m.tempId !== tempId));
  };

  const horarioVazio = (): HorarioMedicamentoWizard => ({ horario: '', dataFim: '', observacao: '' });

  const addHorarioMedicamento = (tempId: string) => {
    setTempHorariosPorMedicamento((prev) => ({
      ...prev,
      [tempId]: [...(prev[tempId] ?? []), horarioVazio()],
    }));
  };

  const removeHorarioMedicamento = (tempId: string, index: number) => {
    setTempHorariosPorMedicamento((prev) => {
      const list = [...(prev[tempId] ?? [])];
      list.splice(index, 1);
      if (list.length === 0) {
        const next = { ...prev };
        delete next[tempId];
        return next;
      }
      return { ...prev, [tempId]: list };
    });
  };

  const updateHorarioMedicamento = (tempId: string, index: number, field: keyof HorarioMedicamentoWizard, value: string) => {
    setTempHorariosPorMedicamento((prev) => {
      const list = [...(prev[tempId] ?? [])];
      if (!list[index]) return prev;
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [tempId]: list };
    });
  };

  const handleFinishWizard = async (agendarDepois = false) => {
    if (isFinishingWizard) return;
    const receitaIdAtual = createdReceitaId != null ? createdReceitaId : loadedReceitaId;
    if (receitaIdAtual == null || receitaIdAtual === '') {
      toast.error('Erro: ID da receita não encontrado');
      return;
    }

    const normId = (v: string | number): number | string => (/^\d+$/.test(String(v)) ? parseInt(String(v), 10) : String(v));
    const salvarHorarios = !agendarDepois;

    setIsFinishingWizard(true);
    try {
      const createdRmIds: (string | number)[] = [];
      for (const med of tempMedicamentos) {
        const created = await api.post<{ id: string | number }>('/receita-medicamentos', {
          id_receita: receitaIdAtual,
          id_medicamento: normId(med.id_medicamento),
          id_prefeitura: normId(formData.id_prefeitura),
          quantidade_total: med.quantidade_total ? parseFloat(med.quantidade_total) : null,
          frequencia_dia: med.frequencia_dia ? parseInt(med.frequencia_dia, 10) : null,
          duracao_dias: med.duracao_dias ? parseInt(med.duracao_dias, 10) : null,
          dias_dispensar: med.dias_dispensar ? parseInt(med.dias_dispensar, 10) : null,
          observacao: med.observacao || null,
          posologia: med.posologia || null,
          via_administracao: med.via_administracao || null,
        });
        const id = (created as any)?.id ?? (created as any)?.a006_id_rm;
        createdRmIds.push(id);
      }

      if (salvarHorarios) {
        let totalHorarios = 0;
        for (let i = 0; i < tempMedicamentos.length; i++) {
          const med = tempMedicamentos[i];
          const horarios = tempHorariosPorMedicamento[med.tempId] ?? [];
          for (const h of horarios) {
            if (!h.horario?.trim()) continue;
            let dataDisparo = h.horario.includes('T') ? h.horario : `${new Date().toISOString().slice(0, 10)}T${h.horario}:00`;
            if (dataDisparo.length === 16) dataDisparo += ':00';
            const dataDesligado = h.dataFim ? (h.dataFim.includes('T') ? h.dataFim : `${h.dataFim}T23:59:59`) : null;
            await api.post('/receita-horarios', {
              id_receita_medicamento: createdRmIds[i],
              id_prefeitura: String(formData.id_prefeitura ?? ''),
              horario: dataDisparo,
              data_fim: dataDesligado,
            });
            totalHorarios++;
          }
        }
        if (totalHorarios > 0) {
          toast.success(`Receita criada com ${totalHorarios} horário(s) de medicamento(s).`);
        } else {
          toast.success('Receita criada. Você pode agendar horários depois em Agendamento de Medicamentos.');
        }
      } else {
        toast.success('Receita criada. Você pode agendar horários em Agendamento de Medicamentos.');
      }
      setWizardOpen(false);
      fetchReceitas();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao finalizar receita');
    } finally {
      setIsFinishingWizard(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente cancelar esta receita?')) return;

    try {
      await api.delete(`/receitas?id=${id}`);
      toast.success('Receita cancelada com sucesso');
      fetchReceitas();
    } catch (error) {
      toast.error('Erro ao cancelar receita');
    }
  };

  const handleViewDetails = async (receita: Receita) => {
    if (receita?.id == null || receita.id === '') {
      toast.error('Receita inválida');
      return;
    }
    setSelectedReceita(receita);
    await fetchReceitaMedicamentos(receita.id);
    await fetchAgendamentos(receita.id);
    setDetailsDialogOpen(true);
  };

  const handleRemoveMedicamentoFromReceita = async (rm: ReceitaMedicamento) => {
    if (!selectedReceita) return;
    if (rm?.id == null || rm.id === '') {
      toast.error('Medicamento inválido para remoção');
      return;
    }
    if (!confirm('Remover este medicamento da receita? Esta ação não pode ser desfeita.')) return;

    const rmId = rm.id;
    setRemovingMedicamentoId(rmId);
    try {
      await api.delete(`/receita-medicamentos/${encodeURIComponent(String(rmId))}`);
      toast.success('Medicamento removido da receita.');
      if (selectedReceita.id != null && selectedReceita.id !== '') {
        await fetchReceitaMedicamentos(selectedReceita.id);
      } else {
        setReceitaMedicamentos((prev) => prev.filter((m) => m.id !== rmId && String(m.id) !== String(rmId)));
      }
    } catch (error: any) {
      toast.error(error?.message ?? error?.errorMessage ?? 'Erro ao remover medicamento da receita.');
    } finally {
      setRemovingMedicamentoId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const normalizeId = (id: number | string | null | undefined): string =>
    id == null ? '' : String(id).trim().toLowerCase();

  const getMedicamentoNome = (id: number | string) => {
    const key = normalizeId(id);
    if (!key) return '-';
    const med = medicamentos.find(m => normalizeId(m.id) === key);
    return med?.nome ?? `Medicamento (ID: ${id})`;
  };

  const getMedicoNome = (id?: number | string | null) => {
    if (id === undefined || id === null || id === '') return '-';
    const key = normalizeId(id);
    if (!key) return '-';
    const medico = medicos.find(m => normalizeId(m.id) === key);
    return medico ? `${medico.nome} (CRM: ${medico.crm})` : `Médico (ID: ${id})`;
  };

  const receitasFiltradas = (() => {
    const q = filtroReceitas.trim().toLowerCase();
    if (!q) return receitas;
    return receitas.filter((receita) => {
      const paciente = pacientes.find(p => String(p.id) === String(receita.id_paciente));
      const codigo = String(receita.id).toLowerCase();
      const nomePaciente = (paciente?.nome ?? '').toLowerCase();
      const cartaoSus = (paciente?.cartao_sus ?? '').toLowerCase();
      const nomeMedico = getMedicoNome(receita.id_medico).toLowerCase();
      const data = formatDate(receita.data_receita).toLowerCase();
      const origem = (receita.origem_receita ?? '').toLowerCase();
      return codigo.includes(q) || nomePaciente.includes(q) || cartaoSus.includes(q) ||
        nomeMedico.includes(q) || data.includes(q) || origem.includes(q);
    });
  })();

  const totalPaginasReceitas = Math.max(1, Math.ceil(receitasFiltradas.length / ITEMS_PER_PAGE));
  const paginaAtualReceitas = Math.min(paginaReceitas, totalPaginasReceitas);
  const receitasNaPagina = receitasFiltradas.slice(
    (paginaAtualReceitas - 1) * ITEMS_PER_PAGE,
    paginaAtualReceitas * ITEMS_PER_PAGE
  );

  const getTipoAgendamentoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      consulta: 'Consulta',
      retorno: 'Retorno',
      procedimento: 'Procedimento',
      exame: 'Exame',
      avaliacao: 'Avaliação',
    };
    return tipos[tipo] || tipo;
  };

  const getStatusAgendamentoVariant = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      agendado: 'default',
      confirmado: 'secondary',
      realizado: 'outline',
      cancelado: 'destructive',
      faltou: 'destructive',
    };
    return variants[status] || 'default';
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
          <h1 className="text-3xl font-bold mb-2">Receitas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as receitas, medicamentos e agendamentos
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 shrink-0">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">Lista de Receitas</span>
              </div>
              <div className="flex-1 min-w-[200px] flex items-center">
                <div className="w-full max-w-md flex items-center rounded-full bg-muted/80 shadow-sm border border-border/50 overflow-hidden">
                  <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-muted">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    placeholder="Pesquisar por código, paciente, médico, cartão SUS, data ou origem..."
                    value={filtroReceitas}
                    onChange={(e) => {
                      setFiltroReceitas(e.target.value);
                      setPaginaReceitas(1);
                    }}
                    className="flex-1 min-w-0 h-10 px-3 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                  />
                </div>
              </div>
              <Button onClick={handleOpenWizard} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Nova Receita (Wizard)
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">
                Página {paginaAtualReceitas}/{totalPaginasReceitas}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaAtualReceitas <= 1}
                  onClick={() => setPaginaReceitas(paginaAtualReceitas - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaAtualReceitas >= totalPaginasReceitas}
                  onClick={() => setPaginaReceitas(paginaAtualReceitas + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Cartão SUS</TableHead>
                  <TableHead>Nome do médico</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receitasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      {receitas.length === 0 ? 'Nenhuma receita encontrada' : 'Nenhuma receita corresponde à pesquisa'}
                    </TableCell>
                  </TableRow>
                ) : (
                  receitasNaPagina.map((receita) => {
                    const paciente = pacientes.find(p => String(p.id) === String(receita.id_paciente));
                    const isHoverOpen = hoveredReceitaId !== null && String(hoveredReceitaId) === String(receita.id);
                    return (
                      <HoverCard
                        key={receita.id}
                        open={isHoverOpen}
                        onOpenChange={(open) => {
                          if (!open) {
                            if (hoverCloseTimeoutRef.current) clearTimeout(hoverCloseTimeoutRef.current);
                            hoverCloseTimeoutRef.current = setTimeout(() => setHoveredReceitaId(null), 250);
                          }
                        }}
                        openDelay={200}
                        closeDelay={250}
                      >
                        <HoverCardTrigger asChild>
                          <TableRow
                            className="cursor-default hover:bg-muted/50"
                            onMouseEnter={() => {
                              if (hoverCloseTimeoutRef.current) {
                                clearTimeout(hoverCloseTimeoutRef.current);
                                hoverCloseTimeoutRef.current = null;
                              }
                              setHoveredReceitaId(receita.id);
                            }}
                            onMouseLeave={() => {
                              hoverCloseTimeoutRef.current = setTimeout(() => setHoveredReceitaId(null), 300);
                            }}
                          >
                            <TableCell className="font-medium font-mono text-sm">{String(receita.id)}</TableCell>
                            <TableCell>{paciente?.nome || `ID: ${receita.id_paciente}`}</TableCell>
                            <TableCell>{paciente?.cartao_sus ?? '-'}</TableCell>
                            <TableCell className="text-sm">{getMedicoNome(receita.id_medico)}</TableCell>
                            <TableCell>{formatDate(receita.data_receita)}</TableCell>
                            <TableCell>{receita.origem_receita || '-'}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  (receita.status || 'ativa') === 'ativa'
                                    ? 'default'
                                    : (receita.status || '') === 'concluida'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {receita.status ?? 'ativa'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDetails(receita)}
                                  title="Ver detalhes"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(receita.id)}
                                  title="Cancelar receita"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </HoverCardTrigger>
                        <HoverCardContent
                          side="right"
                          sideOffset={10}
                          className="w-auto p-0 z-[100] border shadow-lg"
                          align="start"
                          onMouseEnter={() => {
                            if (hoverCloseTimeoutRef.current) clearTimeout(hoverCloseTimeoutRef.current);
                            setHoveredReceitaId(receita.id);
                          }}
                          onMouseLeave={() => {
                            hoverCloseTimeoutRef.current = setTimeout(() => setHoveredReceitaId(null), 200);
                          }}
                        >
                          <MedicamentosHoverContent
                            receitaId={String(receita.id)}
                            getMedicamentoNome={getMedicamentoNome}
                            isOpen={isHoverOpen}
                          />
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal de Atualização de Dados do Paciente */}
        <Dialog open={updatePacienteModalOpen} onOpenChange={setUpdatePacienteModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Atualizar Dados do Paciente
              </DialogTitle>
              <DialogDescription>
                Atualize as informações do paciente <strong>{selectedPacienteForUpdate?.nome}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="update_celular">Celular *</Label>
                <Input
                  id="update_celular"
                  type="tel"
                  value={pacienteUpdateData.celular}
                  onChange={(e) =>
                    setPacienteUpdateData({ ...pacienteUpdateData, celular: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="update_cpf">CPF *</Label>
                <Input
                  id="update_cpf"
                  type="text"
                  value={pacienteUpdateData.cpf}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setPacienteUpdateData({ ...pacienteUpdateData, cpf: value });
                  }}
                  placeholder="00000000000"
                  maxLength={11}
                />
                <p className="text-xs text-muted-foreground">Apenas números, 11 dígitos</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="update_data_nascimento">Data de Nascimento *</Label>
                <Input
                  id="update_data_nascimento"
                  type="date"
                  value={pacienteUpdateData.data_nascimento}
                  onChange={(e) =>
                    setPacienteUpdateData({ ...pacienteUpdateData, data_nascimento: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdatePacienteModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdatePaciente}>
                Atualizar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Atualização de Dados do Médico */}
        <Dialog open={updateMedicoModalOpen} onOpenChange={setUpdateMedicoModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Atualizar Dados do Médico</DialogTitle>
              <DialogDescription>
                Atualize as informações do médico <strong>{selectedMedicoForUpdate?.nome}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="update_medico_nome">Nome *</Label>
                <Input
                  id="update_medico_nome"
                  value={medicoUpdateData.nome}
                  onChange={(e) =>
                    setMedicoUpdateData({ ...medicoUpdateData, nome: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="update_medico_crm">CRM *</Label>
                <Input
                  id="update_medico_crm"
                  value={medicoUpdateData.crm}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setMedicoUpdateData({ ...medicoUpdateData, crm: value });
                  }}
                  placeholder="Apenas números"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="update_medico_especialidade">Especialidade *</Label>
                <Input
                  id="update_medico_especialidade"
                  value={medicoUpdateData.especialidade}
                  onChange={(e) =>
                    setMedicoUpdateData({ ...medicoUpdateData, especialidade: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateMedicoModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateMedico}>
                Atualizar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Atualização de Dados do Medicamento */}
        <Dialog open={updateMedicamentoModalOpen} onOpenChange={setUpdateMedicamentoModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Atualizar Dados do Medicamento</DialogTitle>
              <DialogDescription>
                Atualize as informações do medicamento <strong>{selectedMedicamentoForUpdate?.nome}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="update_medicamento_nome">Nome *</Label>
                <Input
                  id="update_medicamento_nome"
                  value={medicamentoUpdateData.nome}
                  onChange={(e) =>
                    setMedicamentoUpdateData({ ...medicamentoUpdateData, nome: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="update_medicamento_principio">Princípio Ativo</Label>
                <Input
                  id="update_medicamento_principio"
                  value={medicamentoUpdateData.principio_ativo}
                  onChange={(e) =>
                    setMedicamentoUpdateData({ ...medicamentoUpdateData, principio_ativo: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="update_medicamento_concentracao">Concentração</Label>
                <Input
                  id="update_medicamento_concentracao"
                  value={medicamentoUpdateData.concentracao}
                  onChange={(e) =>
                    setMedicamentoUpdateData({ ...medicamentoUpdateData, concentracao: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="update_medicamento_forma">Forma Farmacêutica</Label>
                <Input
                  id="update_medicamento_forma"
                  value={medicamentoUpdateData.forma_farmaceutica}
                  onChange={(e) =>
                    setMedicamentoUpdateData({ ...medicamentoUpdateData, forma_farmaceutica: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateMedicamentoModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateMedicamento}>
                Atualizar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Wizard Dialog */}
        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Receita</DialogTitle>
              <DialogDescription>
                Siga os passos para criar uma receita completa com medicamentos e agendamentos
              </DialogDescription>
            </DialogHeader>

            <Stepper steps={wizardSteps} currentStep={currentStep} className="mb-6" />

            {/* Etapa 1: Dados da Receita */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados da Receita</h3>
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="id_paciente">Paciente *</Label>
                    {formData.id_paciente && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleOpenEditPaciente}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar Paciente
                      </Button>
                    )}
                  </div>
                  <Popover open={pacientePopoverOpen} onOpenChange={setPacientePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {formData.id_paciente
                          ? (() => {
                              const p = pacientes.find((x) => String(x.id) === String(formData.id_paciente));
                              return p ? `${p.nome} - SUS: ${p.cartao_sus ?? '-'}` : formData.id_paciente;
                            })()
                          : 'Selecione o paciente ou pesquise pelo nome'}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command filter={(value, search) => {
                        const nome = (value || '').toLowerCase();
                        const q = (search || '').toLowerCase();
                        if (!q) return 1;
                        return nome.includes(q) ? 1 : 0;
                      }}>
                        <CommandInput placeholder="Pesquisar por nome ou SUS..." />
                        <CommandList>
                          <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                          <CommandGroup>
                            {pacientes.map((paciente) => (
                              <CommandItem
                                key={paciente.id}
                                value={`${paciente.nome} ${paciente.cartao_sus ?? ''}`}
                                onSelect={() => {
                                  setFormData({ ...formData, id_paciente: String(paciente.id) });
                                  setPacientePopoverOpen(false);
                                }}
                              >
                                {paciente.nome} - SUS: {paciente.cartao_sus ?? '-'}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="id_medico">Médico</Label>
                    {formData.id_medico && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleOpenEditMedico}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar Médico
                      </Button>
                    )}
                  </div>
                  <Popover open={medicoPopoverOpen} onOpenChange={setMedicoPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {formData.id_medico
                          ? (() => {
                              const m = medicos.find((x) => String(x.id) === String(formData.id_medico));
                              return m ? `${m.nome} - CRM: ${m.crm} (${m.especialidade ?? '-'})` : formData.id_medico;
                            })()
                          : 'Selecione o médico (opcional) ou pesquise pelo nome'}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command filter={(value, search) => {
                        const nome = (value || '').toLowerCase();
                        const q = (search || '').toLowerCase();
                        if (!q) return 1;
                        return nome.includes(q) ? 1 : 0;
                      }}>
                        <CommandInput placeholder="Pesquisar por nome, CRM ou especialidade..." />
                        <CommandList>
                          <CommandEmpty>Nenhum médico encontrado.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="Nenhum médico"
                              onSelect={() => {
                                setFormData({ ...formData, id_medico: '' });
                                setMedicoPopoverOpen(false);
                              }}
                            >
                              Nenhum médico
                            </CommandItem>
                            {medicos.map((medico) => (
                              <CommandItem
                                key={medico.id}
                                value={`${medico.nome} ${medico.crm} ${medico.especialidade ?? ''}`}
                                onSelect={() => {
                                  setFormData({ ...formData, id_medico: String(medico.id) });
                                  setMedicoPopoverOpen(false);
                                }}
                              >
                                {medico.nome} - CRM: {medico.crm} ({medico.especialidade ?? '-'})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="data_receita">Data da Receita *</Label>
                  <Input
                    id="data_receita"
                    type="date"
                    value={formData.data_receita}
                    onChange={(e) =>
                      setFormData({ ...formData, data_receita: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="origem_receita">Origem</Label>
                    <Input
                      id="origem_receita"
                      value={formData.origem_receita}
                      onChange={(e) =>
                        setFormData({ ...formData, origem_receita: e.target.value })
                      }
                      placeholder="Ex: UBS Central"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="subgrupo_origem">Subgrupo</Label>
                    <Input
                      id="subgrupo_origem"
                      value={formData.subgrupo_origem}
                      onChange={(e) =>
                        setFormData({ ...formData, subgrupo_origem: e.target.value })
                      }
                      placeholder="Ex: Clínica Geral"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="observacao">Observações</Label>
                  <Textarea
                    id="observacao"
                    value={formData.observacao}
                    onChange={(e) =>
                      setFormData({ ...formData, observacao: e.target.value })
                    }
                    placeholder="Observações adicionais"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Etapa 2: Medicamentos */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Adicionar Medicamentos</h3>

                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="id_medicamento">Medicamento *</Label>
                        {medicamentoFormData.id_medicamento && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditMedicamento(medicamentoFormData.id_medicamento)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar Medicamento
                          </Button>
                        )}
                      </div>
                      <Popover open={medicamentoPopoverOpen} onOpenChange={setMedicamentoPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-normal"
                          >
                            {medicamentoFormData.id_medicamento
                              ? (() => {
                                  const med = medicamentos.find((x) => String(x.id) === String(medicamentoFormData.id_medicamento));
                                  return med
                                    ? `${med.nome}${med.principio_ativo ? ` - ${med.principio_ativo}` : ''}`
                                    : medicamentoFormData.id_medicamento;
                                })()
                              : 'Selecione o medicamento ou pesquise pelo nome'}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command
                            filter={(value, search) => {
                              const text = (value || '').toLowerCase();
                              const q = (search || '').toLowerCase();
                              if (!q) return 1;
                              return text.includes(q) ? 1 : 0;
                            }}
                          >
                            <CommandInput placeholder="Pesquisar por nome ou princípio ativo..." />
                            <CommandList>
                              <CommandEmpty>Nenhum medicamento encontrado.</CommandEmpty>
                              <CommandGroup>
                                {medicamentos.map((med) => (
                                  <CommandItem
                                    key={med.id}
                                    value={`${med.nome} ${med.principio_ativo ?? ''} ${med.concentracao ?? ''}`}
                                    onSelect={() => {
                                      setMedicamentoFormData({ ...medicamentoFormData, id_medicamento: String(med.id) });
                                      setMedicamentoPopoverOpen(false);
                                    }}
                                  >
                                    {med.nome}
                                    {med.principio_ativo && ` - ${med.principio_ativo}`}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="posologia">Posologia</Label>
                        <Input
                          id="posologia"
                          value={medicamentoFormData.posologia}
                          onChange={(e) =>
                            setMedicamentoFormData({ ...medicamentoFormData, posologia: e.target.value })
                          }
                          placeholder="Ex: 1 comprimido"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="via_administracao">Via de Administração</Label>
                        <Input
                          id="via_administracao"
                          value={medicamentoFormData.via_administracao}
                          onChange={(e) =>
                            setMedicamentoFormData({ ...medicamentoFormData, via_administracao: e.target.value })
                          }
                          placeholder="Ex: Oral"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="quantidade_total">Quantidade</Label>
                        <Input
                          id="quantidade_total"
                          type="number"
                          step="0.001"
                          value={medicamentoFormData.quantidade_total}
                          onChange={(e) =>
                            setMedicamentoFormData({ ...medicamentoFormData, quantidade_total: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="frequencia_dia">Freq./Dia</Label>
                        <Input
                          id="frequencia_dia"
                          type="number"
                          value={medicamentoFormData.frequencia_dia}
                          onChange={(e) =>
                            setMedicamentoFormData({ ...medicamentoFormData, frequencia_dia: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="duracao_dias">Duração (dias)</Label>
                        <Input
                          id="duracao_dias"
                          type="number"
                          value={medicamentoFormData.duracao_dias}
                          onChange={(e) =>
                            setMedicamentoFormData({ ...medicamentoFormData, duracao_dias: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="dias_dispensar">Dias Dispensar</Label>
                        <Input
                          id="dias_dispensar"
                          type="number"
                          value={medicamentoFormData.dias_dispensar}
                          onChange={(e) =>
                            setMedicamentoFormData({ ...medicamentoFormData, dias_dispensar: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="observacao_med">Observações</Label>
                      <Textarea
                        id="observacao_med"
                        value={medicamentoFormData.observacao}
                        onChange={(e) =>
                          setMedicamentoFormData({ ...medicamentoFormData, observacao: e.target.value })
                        }
                        rows={2}
                        placeholder="Observações sobre este medicamento"
                      />
                    </div>

                    <Button onClick={handleAddTempMedicamento} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar à Lista
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <h4 className="font-semibold">Medicamentos Adicionados ({tempMedicamentos.length})</h4>
                  
                  {tempMedicamentos.length === 0 ? (
                    <Card>
                      <CardContent className="py-8">
                        <p className="text-center text-muted-foreground">
                          Nenhum medicamento adicionado ainda.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {tempMedicamentos.map((med) => (
                        <Card key={med.tempId}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-semibold">{getMedicamentoNome(med.id_medicamento)}</h5>
                                <div className="grid grid-cols-2 gap-x-4 text-sm text-muted-foreground mt-2">
                                  {med.posologia && <div>Posologia: {med.posologia}</div>}
                                  {med.via_administracao && <div>Via: {med.via_administracao}</div>}
                                  {med.frequencia_dia && <div>Frequência: {med.frequencia_dia}x/dia</div>}
                                  {med.duracao_dias && <div>Duração: {med.duracao_dias} dias</div>}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveTempMedicamento(med.tempId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Etapa 3: Horários dos medicamentos */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Horários de administração</h3>
                <p className="text-sm text-muted-foreground">
                  Defina quando cada medicamento deve ser administrado. Você pode pular e finalizar a receita para
                  configurar depois em <strong>Agendamento de Medicamentos</strong>.
                </p>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {tempMedicamentos.map((med) => {
                    const horarios = tempHorariosPorMedicamento[med.tempId] ?? [];
                    const nomeMed = getMedicamentoNome(med.id_medicamento);
                    return (
                      <Card key={med.tempId}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            {nomeMed}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {horarios.map((h, idx) => (
                            <div key={idx} className="flex flex-wrap items-end gap-3 p-3 rounded-lg border bg-muted/30">
                              <div className="grid gap-1.5 min-w-[180px]">
                                <Label className="text-xs">Data e hora *</Label>
                                <Input
                                  type="datetime-local"
                                  value={h.horario}
                                  onChange={(e) => updateHorarioMedicamento(med.tempId, idx, 'horario', e.target.value)}
                                />
                              </div>
                              <div className="grid gap-1.5 min-w-[140px]">
                                <Label className="text-xs">Data fim (opcional)</Label>
                                <Input
                                  type="date"
                                  value={h.dataFim}
                                  onChange={(e) => updateHorarioMedicamento(med.tempId, idx, 'dataFim', e.target.value)}
                                />
                              </div>
                              <div className="grid gap-1.5 flex-1 min-w-[120px]">
                                <Label className="text-xs">Observação</Label>
                                <Input
                                  placeholder="Opcional"
                                  value={h.observacao}
                                  onChange={(e) => updateHorarioMedicamento(med.tempId, idx, 'observacao', e.target.value)}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeHorarioMedicamento(med.tempId, idx)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addHorarioMedicamento(med.tempId)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar horário
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={handlePreviousStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setWizardOpen(false)}>
                  Cancelar
                </Button>
                
                {currentStep < 3 ? (
                  <Button onClick={handleNextStep}>
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleFinishWizard(true)}
                      disabled={isFinishingWizard}
                    >
                      {isFinishingWizard ? 'Salvando...' : 'Finalizar e agendar depois'}
                    </Button>
                    <Button
                      onClick={() => handleFinishWizard(false)}
                      disabled={isFinishingWizard}
                    >
                      {isFinishingWizard
                        ? 'Salvando...'
                        : (() => {
                            const totalHorarios = tempMedicamentos.reduce((acc, m) => acc + (tempHorariosPorMedicamento[m.tempId]?.length ?? 0), 0);
                            return totalHorarios === 0
                              ? 'Finalizar Receita'
                              : `Finalizar com ${totalHorarios} horário(s)`;
                          })()}
                    </Button>
                  </div>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Detalhes da Receita */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes da Receita
              </DialogTitle>
              <DialogDescription>
                Visualização dos medicamentos e agendamentos desta receita
              </DialogDescription>
              <p className="text-sm font-normal text-muted-foreground whitespace-nowrap overflow-x-auto">
                {selectedReceita
                  ? (() => {
                      const paciente = pacientes.find(p => String(p.id) === String(selectedReceita.id_paciente));
                      const pacienteNome = paciente?.nome ?? '-';
                      const cartaoSus = paciente?.cartao_sus ?? '-';
                      const medicoNome = getMedicoNome(selectedReceita.id_medico);
                      const data = selectedReceita.data_receita ? formatDate(selectedReceita.data_receita) : '-';
                      return `${pacienteNome}, SUS: ${cartaoSus}, ${medicoNome}, ${data}`;
                    })()
                  : '-'}
              </p>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Medicamentos ({receitaMedicamentos.length})</h3>
                {receitaMedicamentos.length === 0 ? (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">
                        Nenhum medicamento vinculado.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {receitaMedicamentos.map((rm) => (
                      <Card key={rm.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{getMedicamentoNome(rm.id_medicamento)}</h4>
                                <Badge variant={rm.status === 'ativo' ? 'default' : 'secondary'}>
                                  {rm.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 text-sm text-muted-foreground">
                                {rm.posologia && <div>Posologia: {rm.posologia}</div>}
                                {rm.via_administracao && <div>Via: {rm.via_administracao}</div>}
                                {rm.frequencia_dia && <div>Frequência: {rm.frequencia_dia}x/dia</div>}
                                {rm.duracao_dias && <div>Duração: {rm.duracao_dias} dias</div>}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveMedicamentoFromReceita(rm)}
                              disabled={removingMedicamentoId !== null}
                              title="Remover medicamento da receita"
                            >
                              {String(removingMedicamentoId) === String(rm.id) ? (
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-destructive border-t-transparent block" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Agendamentos ({agendamentos.length})</h3>
                {agendamentos.length === 0 ? (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">
                        Nenhum agendamento vinculado.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {agendamentos.map((agend) => (
                      <Card key={agend.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{getTipoAgendamentoLabel(agend.tipo_agendamento)}</h4>
                                <Badge variant={getStatusAgendamentoVariant(agend.status)}>
                                  {agend.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 text-sm text-muted-foreground">
                                <div>Data: {formatDate(agend.data_agendamento)}</div>
                                <div>Hora: {formatTime(agend.hora_agendamento)}</div>
                                {agend.local_atendimento && <div className="col-span-2">Local: {agend.local_atendimento}</div>}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setDetailsDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
