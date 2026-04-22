'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Plus, ChevronDown, Search, Pill, Trash2, User, Paperclip, Eye, Smartphone, Edit2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Paciente, Receita, ReceitaMedicamento, ReceitaHorario, Medicamento, Medico } from '@/types/medtime';
import {
  getDataHojeYmd,
  getDataHojeFormatada,
  formatarDataBR,
  inputParaDataBR,
  calcularValidadeReceita,
  validarIntervaloHorarios,
  gerarHorariosISO,
  calcularDataVencimentoReceita,
  calcularRenovacoesMensais,
  contadorVencimentoReceita,
} from '@/features/agendamento/domain';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Estado do formulário de prescrição por receita-medicamento (tela nova: identificação + intervalo + horários editáveis) */
interface FormPrescricaoMedicamento {
  /** Data de início do tratamento (yyyy-mm-dd para input type="date") */
  dataInicioTratamento: string;
  posologia: string;
  /** Intervalo entre doses (em horas ou em dias, conforme intervaloUnidade) */
  cadaHoras: string;
  /** Unidade do intervalo: hora ou dia */
  intervaloUnidade: 'hora' | 'dia';
  /** Quando intervaloUnidade="dia": hora padrão (HH:mm) aplicada a todos os dias */
  horaPadraoDia: string;
  /** Vezes por dia */
  vezesPorDia: string;
  /** Duração em dias */
  duracaoDias: string;
  /** Quando intervaloUnidade="hora": horários (HH:mm). Quando "dia": dias (1..duracao) em string. */
  horariosTomadas: string[];
}

interface PacienteCelularResumo {
  id: number | string;
  id_paciente: number | string;
  numero_contato: string;
  ativo: boolean;
}

const OPCOES_VIA_ADMINISTRACAO = [
  'Oral',
  'Sublingual',
  'Intravenosa',
  'Intramuscular',
  'Subcutânea',
  'Tópica',
  'Retal',
  'Nasal',
  'Oftálmica',
  'Otológica',
  'Inalatória',
  'Outra',
] as const;

const OPCOES_POSOLOGIA = [
  '1 comprimido',
  '2 comprimidos',
  '1 cápsula',
  '2 cápsulas',
  '1 tablete',
  '5 ml',
  '10 ml',
  '15 ml',
  '1 gota',
  'Conforme orientação médica',
  'Outra',
] as const;

function formatarData(s: string) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('pt-BR');
  } catch {
    return s;
  }
}

function formatarHora(s: string) {
  if (!s) return '—';
  try {
    const d = new Date(s);
    return d.toTimeString().slice(0, 5);
  } catch {
    return String(s).slice(0, 5);
  }
}

function formatarDataHora(s: string) {
  if (!s) return '—';
  try {
    const d = new Date(s);
    return `${d.toLocaleDateString('pt-BR')} ${d.toTimeString().slice(0, 5)}`;
  } catch {
    return String(s);
  }
}

function formatarTelefoneExibicao(valor: string | null | undefined) {
  const bruto = String(valor ?? '').trim();
  if (!bruto) return '—';

  const digitos = bruto.replace(/\D/g, '');
  if (digitos.length >= 11) {
    const area = digitos.slice(0, 2);
    const prefixo = digitos.slice(2, 7);
    const sufixo = digitos.slice(7, 11);
    return `(${area}) ${prefixo} - ${sufixo}`;
  }

  return bruto;
}

function gerarCodigoEnvioReceita(receitaId: string | number): string {
  const id = String(receitaId ?? '').trim() || 'SEM-ID';
  const ts = Date.now().toString(36).toUpperCase();
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 12).toUpperCase()
      : Math.random().toString(36).slice(2, 14).toUpperCase();
  return `RCP-${id}-${ts}-${rand}`;
}

function diaSemanaShort(s: string) {
  if (!s) return '';
  try {
    const d = new Date(s);
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return dias[d.getDay()] ?? '';
  } catch {
    return '';
  }
}

/** Sugere horários das doses ao longo do dia com base no intervalo (cadaHoras) e quantidade de doses (vezesPorDia). */
function sugerirHorariosTomadas(cadaHoras: number, vezesPorDia: number): string[] {
  const intervalo = Math.max(1, Math.min(24, Math.floor(cadaHoras || 0) || 1));
  const doses = Math.max(1, Math.min(24, Math.floor(vezesPorDia || 0) || 1));
  // Horário inicial padrão: 08:00
  const startHour = 8;
  const result: string[] = [];
  for (let i = 0; i < doses; i++) {
    const hour = (startHour + i * intervalo) % 24;
    const hh = String(hour).padStart(2, '0');
    result.push(`${hh}:00`);
  }
  return result;
}

function sugerirDiasTomadas(intervaloDias: number, duracaoDias: number): string[] {
  const intervalo = Math.max(1, Math.floor(intervaloDias || 0) || 1);
  const dur = Math.max(1, Math.floor(duracaoDias || 0) || 1);
  const dias: string[] = [];
  for (let d = 1; d <= dur; d += intervalo) dias.push(String(d));
  return dias;
}

function gerarHorariosISOIntervaloDias(
  dataInicioYmd: string,
  duracaoDias: number,
  intervaloDias: number,
  hora: string = '08:00'
): string[] {
  const dur = Math.max(1, Math.floor(duracaoDias || 0) || 1);
  const intervalo = Math.max(1, Math.floor(intervaloDias || 0) || 1);
  const base = new Date(`${dataInicioYmd}T00:00:00`);
  if (Number.isNaN(base.getTime())) return [];
  const out: string[] = [];
  for (let offset = 0; offset < dur; offset += intervalo) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const ymd = `${y}-${m}-${day}`;
    const iso = gerarHorariosISO(ymd, 1, [hora]);
    if (iso[0]) out.push(iso[0]);
  }
  return out;
}

/** Ordena horários primeiro por dia, depois por hora (cronológico). */
function ordenarHorariosPorDiaEHora<T extends { horario: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => a.horario.localeCompare(b.horario));
}

/** Retorna texto do intervalo de administração a partir da frequência por dia (ex.: "3x ao dia (a cada 8 horas)"). */
function textoFrequenciaIntervalo(frequenciaDia: number | null | undefined): string {
  if (frequenciaDia == null || frequenciaDia < 1) return '';
  const intervaloHoras = 24 / frequenciaDia;
  const horas = Math.round(intervaloHoras) === intervaloHoras ? intervaloHoras : Math.round(intervaloHoras * 10) / 10;
  const horaLabel = horas === 1 ? 'hora' : 'horas';
  return `${frequenciaDia}x ao dia (a cada ${horas} ${horaLabel})`;
}

/** Extrai dados do formulário a partir de um receita-medicamento já agendado e seus horários. */
function getFormFromAgendado(
  rm: ReceitaMedicamento,
  horarios: ReceitaHorario[]
): FormPrescricaoMedicamento {
  const vezesPorDia = Math.max(1, rm.frequencia_dia ?? 1);
  const duracaoDias = Math.max(0, rm.duracao_dias ?? 0);
  const cadaHoras = Math.round(24 / vezesPorDia);
  const sorted = ordenarHorariosPorDiaEHora(horarios);
  let dataInicioYmd = '';
  const horariosTomadas: string[] = [];
  if (sorted.length > 0 && sorted[0].horario) {
    const d = new Date(sorted[0].horario);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dataInicioYmd = `${y}-${m}-${day}`;
    const firstDate = dataInicioYmd;
    const doPrimeiroDia = sorted.filter((h) => {
      const hd = new Date(h.horario);
      const hy = hd.getFullYear();
      const hm = String(hd.getMonth() + 1).padStart(2, '0');
      const hday = String(hd.getDate()).padStart(2, '0');
      return `${hy}-${hm}-${hday}` === firstDate;
    });
    doPrimeiroDia.forEach((h) => horariosTomadas.push(formatarHora(h.horario)));
  }
  while (horariosTomadas.length < vezesPorDia) horariosTomadas.push('');
  return {
    dataInicioTratamento: dataInicioYmd || getDataHojeYmd(),
    posologia: String(rm.posologia ?? ''),
    cadaHoras: String(cadaHoras),
    vezesPorDia: String(vezesPorDia),
    duracaoDias: String(duracaoDias),
    horariosTomadas,
  };
}

export default function AgendamentoMedicamentosPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedReceitaId, setSelectedReceitaId] = useState<string | null>(null);
  const selectedReceitaIdRef = useRef<string | null>(null);
  selectedReceitaIdRef.current = selectedReceitaId;
  const [receitaMedicamentos, setReceitaMedicamentos] = useState<ReceitaMedicamento[]>([]);
  const [horariosByRm, setHorariosByRm] = useState<Record<string, ReceitaHorario[]>>({});
  const [loadingReceita, setLoadingReceita] = useState(false);
  const [celularesPorPaciente, setCelularesPorPaciente] = useState<Record<number | string, PacienteCelularResumo>>({});
  const [celularDialogOpen, setCelularDialogOpen] = useState(false);
  const [novoNumeroContato, setNovoNumeroContato] = useState('');
  const [savingCelular, setSavingCelular] = useState(false);
  const [editingCelular, setEditingCelular] = useState<PacienteCelularResumo | null>(null);
  const [imagemMedicamentoDialogOpen, setImagemMedicamentoDialogOpen] = useState(false);
  const [imagemMedicamentoId, setImagemMedicamentoId] = useState<number | string | null>(null);
  const [imagemMedicamentoUrl, setImagemMedicamentoUrl] = useState('');
  const [savingImagemMedicamento, setSavingImagemMedicamento] = useState(false);
  const maxImagemMedicamentoSize = 5 * 1024 * 1024; // 5MB
  const allowedImagemMedicamentoTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const [podeImprimir, setPodeImprimir] = useState(true);

  // Form: vincular medicamento (quando receita sem medicamentos)
  const [medicamentoId, setMedicamentoId] = useState('');
  const [posologia, setPosologia] = useState('');
  const [viaAdministracao, setViaAdministracao] = useState('');
  const [quantidadeTotal, setQuantidadeTotal] = useState('');
  const [frequenciaDia, setFrequenciaDia] = useState('');
  const [duracaoDias, setDuracaoDias] = useState('');
  const [observacaoMed, setObservacaoMed] = useState('');
  const [medicamentoPopoverOpen, setMedicamentoPopoverOpen] = useState(false);
  const [adicionarMedicamentoDialogOpen, setAdicionarMedicamentoDialogOpen] = useState(false);

  // Form: prescrição por receita-medicamento (identificação + intervalo + horários editáveis)
  const [prescricaoForm, setPrescricaoForm] = useState<Record<string, Partial<FormPrescricaoMedicamento>>>({});
  const [savingHorarios, setSavingHorarios] = useState(false);
  const [savingProntoEnvio, setSavingProntoEnvio] = useState(false);
  const [removingMedicamentoId, setRemovingMedicamentoId] = useState<string | number | null>(null);
  const [removeMedicamentoDialogOpen, setRemoveMedicamentoDialogOpen] = useState(false);
  const [removeMedicamentoTarget, setRemoveMedicamentoTarget] = useState<ReceitaMedicamento | null>(null);
  /** ID do receita-medicamento cujo andamento está sendo visualizado no dialog. */
  const [andamentoDialogRmId, setAndamentoDialogRmId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.push('/meus-medicamentos');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get<Receita[]>('/receitas', { limit: '10000', com_medicamentos_only: 'true' }).then((d) => { if (!cancelled) setReceitas(Array.isArray(d) ? d : []); }),
      api.get<Paciente[]>('/pacientes', { limit: '500' }).then((d) => { if (!cancelled) setPacientes(d || []); }),
      api.get<Medicamento[]>('/medicamentos', { limit: '500' }).then((d) => { if (!cancelled) setMedicamentos(d || []); }),
      api.get<Medico[]>('/medicos', { limit: '500' }).then((d) => { if (!cancelled) setMedicos(d || []); }),
      api.get<PacienteCelularResumo[]>('/paciente-celulares', { limit: '500' }).then((list) => {
        if (cancelled) return;
        const map: Record<number | string, PacienteCelularResumo> = {};
        (list || []).forEach((c) => {
          if (c.ativo && !map[c.id_paciente]) map[c.id_paciente] = c;
        });
        setCelularesPorPaciente(map);
      }),
    ]).catch(() => toast.error('Erro ao carregar dados')).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!selectedReceitaId) {
      setReceitaMedicamentos([]);
      setHorariosByRm({});
      return;
    }
    const idReceita = String(selectedReceitaId).trim();
    if (!idReceita) {
      setReceitaMedicamentos([]);
      setHorariosByRm({});
      return;
    }
    setLoadingReceita(true);
    (async () => {
      try {
        const rms = await api.get<ReceitaMedicamento[]>(
          `/receita-medicamentos?id_receita=${encodeURIComponent(idReceita)}`
        );
        const lista = Array.isArray(rms) ? rms : [];
        // Só atualiza estado se a receita selecionada não mudou (evita race)
        if (selectedReceitaIdRef.current !== idReceita) return;
        setReceitaMedicamentos(lista);
        const byRm: Record<string, ReceitaHorario[]> = {};
        for (const rm of lista) {
          const idRm = String(rm.id);
          try {
            const horarios = await api.get<ReceitaHorario[]>(`/receita-horarios?id_rm=${encodeURIComponent(idRm)}`);
            byRm[idRm] = Array.isArray(horarios) ? horarios : [];
          } catch {
            byRm[idRm] = [];
          }
        }
        if (selectedReceitaIdRef.current !== idReceita) return;
        setHorariosByRm(byRm);
      } catch {
        if (selectedReceitaIdRef.current === idReceita) {
          toast.error('Erro ao carregar dados da receita');
          setReceitaMedicamentos([]);
          setHorariosByRm({});
        }
      } finally {
        if (selectedReceitaIdRef.current === idReceita) setLoadingReceita(false);
      }
    })();
  }, [selectedReceitaId]);

  const selectedReceita = receitas.find((r) => String(r.id) === selectedReceitaId);
  const selectedPaciente = selectedReceita ? pacientes.find((p) => String(p.id) === String(selectedReceita.id_paciente)) : null;
  const selectedPacienteCelular = selectedPaciente ? celularesPorPaciente[selectedPaciente.id] : undefined;
  const telefonePaciente = String(selectedPacienteCelular?.numero_contato ?? selectedPaciente?.celular ?? '').trim();
  const pacienteTemTelefone = telefonePaciente.length > 0;
  const getMedicoNome = (id?: number | string | null) => {
    if (id == null || id === '') return '—';
    const m = medicos.find((x) => String(x.id) === String(id));
    return m ? m.nome : String(id);
  };
  const getMedicamentoNome = (id: number | string) => {
    const m = medicamentos.find((x) => String(x.id) === String(id));
    return m ? m.nome : String(id);
  };
  const getMedicamentoImagemUrl = (id: number | string) => {
    const m = medicamentos.find((x) => String(x.id) === String(id));
    return m?.imagem_url ?? '';
  };
  const getMedicamentoPrincipioAtivo = (id: number | string) => {
    const m = medicamentos.find((x) => String(x.id) === String(id));
    return m?.principio_ativo ?? '';
  };

  const defaultFormFromRm = (rm: ReceitaMedicamento): FormPrescricaoMedicamento => {
    const vezesPorDia = rm.frequencia_dia != null && rm.frequencia_dia >= 1 ? rm.frequencia_dia : 3;
    const cadaHoras = 24 / vezesPorDia;
    return {
      dataInicioTratamento: getDataHojeYmd(),
      posologia: String(rm.posologia ?? ''),
      cadaHoras: String(Math.round(cadaHoras)),
      intervaloUnidade: 'hora',
      horaPadraoDia: '08:00',
      vezesPorDia: String(vezesPorDia),
      duracaoDias: rm.duracao_dias != null ? String(rm.duracao_dias) : '7',
      horariosTomadas: sugerirHorariosTomadas(cadaHoras, vezesPorDia),
    };
  };

  const getFormForRm = (rm: ReceitaMedicamento): FormPrescricaoMedicamento => {
    const base = defaultFormFromRm(rm);
    const overrides = prescricaoForm[String(rm.id)];
    if (!overrides) return base;
    const merged = { ...base, ...overrides };
    if (merged.intervaloUnidade === 'dia') {
      const dur = Math.max(1, parseInt(merged.duracaoDias, 10) || 1);
      const intervalo = Math.max(1, parseInt(merged.cadaHoras, 10) || 1);
      const dias = merged.horariosTomadas?.length ? merged.horariosTomadas : sugerirDiasTomadas(intervalo, dur);
      return { ...merged, vezesPorDia: '1', horariosTomadas: dias };
    }
    const n = Math.max(0, parseInt(merged.vezesPorDia, 10) || 0);
    const horarios = Array.from({ length: n }, (_, i) => merged.horariosTomadas[i] ?? '');
    return { ...merged, horariosTomadas: horarios };
  };

  const updateFormForRm = (
    rm: ReceitaMedicamento,
    field: keyof FormPrescricaoMedicamento,
    value: string | string[]
  ) => {
    const key = String(rm.id);
    setPrescricaoForm((prev) => {
      const current = { ...defaultFormFromRm(rm), ...(prev[key] ?? {}) };
      const next: FormPrescricaoMedicamento & Partial<FormPrescricaoMedicamento> = {
        ...current,
        [field]: value,
      } as any;

      // Ajusta quantidade de horários quando muda vezesPorDia
      if (field === 'vezesPorDia') {
        const n = Math.max(0, parseInt(String(value), 10) || 0);
        const horarios = Array.from({ length: n }, (_, i) => current.horariosTomadas[i] ?? '');
        next.horariosTomadas = horarios;
      }

      // Troca unidade (hora/dia)
      if (field === 'intervaloUnidade') {
        const unidade = String(value) === 'dia' ? 'dia' : 'hora';
        next.intervaloUnidade = unidade;
        if (unidade === 'dia') {
          const intervalo = Math.max(1, parseInt(String(next.cadaHoras ?? current.cadaHoras), 10) || 1);
          const dur = Math.max(1, parseInt(String(next.duracaoDias ?? current.duracaoDias), 10) || 1);
          next.vezesPorDia = '1';
          next.horaPadraoDia = next.horaPadraoDia ?? current.horaPadraoDia ?? '08:00';
          next.horariosTomadas = sugerirDiasTomadas(intervalo, dur);
        } else {
          const cada = Math.max(1, parseInt(String(next.cadaHoras ?? current.cadaHoras), 10) || 1);
          const vezes = Math.max(1, parseInt(String(next.vezesPorDia ?? current.vezesPorDia), 10) || 1);
          next.horariosTomadas = sugerirHorariosTomadas(cada, vezes);
        }
      }

      // Recalcula tomadas quando muda intervalo/vezes/duração
      const unidadeAtual = next.intervaloUnidade ?? current.intervaloUnidade ?? 'hora';
      if (unidadeAtual === 'dia' && (field === 'cadaHoras' || field === 'duracaoDias')) {
        const intervalo = Math.max(1, parseInt(String(field === 'cadaHoras' ? value : next.cadaHoras), 10) || 1);
        const dur = Math.max(1, parseInt(String(field === 'duracaoDias' ? value : next.duracaoDias), 10) || 1);
        next.vezesPorDia = '1';
        next.horariosTomadas = sugerirDiasTomadas(intervalo, dur);
      }
      if (unidadeAtual === 'hora' && (field === 'vezesPorDia' || field === 'cadaHoras')) {
        const cada = field === 'cadaHoras' ? Number(value) : Number(next.cadaHoras ?? current.cadaHoras);
        const vezes = field === 'vezesPorDia' ? Number(value) : Number(next.vezesPorDia ?? current.vezesPorDia);
        next.horariosTomadas = sugerirHorariosTomadas(cada, vezes);
      }

      return { ...prev, [key]: next };
    });
  };

  const setHorarioTomada = (rm: ReceitaMedicamento, index: number, horario: string) => {
    const key = String(rm.id);
    setPrescricaoForm((prev) => {
      const current = { ...defaultFormFromRm(rm), ...(prev[key] ?? {}) };
      const list = [...(current.horariosTomadas ?? [])];
      while (list.length <= index) list.push('');
      list[index] = horario;
      return { ...prev, [key]: { ...current, horariosTomadas: list } };
    });
  };

  /** Ordena receitas: mais recente primeiro (por created_at, depois data_receita, descendente). */
  const receitasOrdenadas = (() => {
    return [...receitas].sort((a, b) => {
      const da = a.created_at || a.data_receita || '';
      const db = b.created_at || b.data_receita || '';
      return db.localeCompare(da); // descendente: mais recente primeiro
    });
  })();

  const filteredReceitas = (() => {
    const q = searchQuery.trim().toLowerCase();
    const base = receitasOrdenadas;
    if (!q) return base.slice(0, 50);
    return base.filter((r) => {
      const pac = pacientes.find((p) => String(p.id) === String(r.id_paciente));
      const idStr = String(r.id).toLowerCase();
      const dataStr = formatarData(r.data_receita).toLowerCase();
      const nomePac = (pac?.nome ?? '').toLowerCase();
      const sus = (pac?.cartao_sus ?? '').toLowerCase();
      const numeroPaciente = pac?.numero_paciente != null ? String(pac.numero_paciente).toLowerCase() : '';
      const medicoNome = getMedicoNome(r.id_medico).toLowerCase();
      return (
        idStr.includes(q) ||
        dataStr.includes(q) ||
        nomePac.includes(q) ||
        sus.includes(q) ||
        numeroPaciente.includes(q) ||
        medicoNome.includes(q)
      );
    }).slice(0, 50);
  })();

  const hasMedicamentos = receitaMedicamentos.length > 0;
  const horariosPorRm = (rmId: string) => horariosByRm[rmId] ?? [];
  const medicamentosAgendados = receitaMedicamentos.filter((rm) => horariosPorRm(String(rm.id)).length > 0);
  const medicamentosNaoAgendados = receitaMedicamentos.filter((rm) => horariosPorRm(String(rm.id)).length === 0);
  const allAgendados = hasMedicamentos && medicamentosNaoAgendados.length === 0;
  const someAgendados = medicamentosAgendados.length > 0;

  useEffect(() => {
    if (selectedReceitaId) {
      setPodeImprimir(true);
    }
  }, [selectedReceitaId]);

  const handleVincularMedicamento = async () => {
    if (!selectedReceitaId || !medicamentoId) {
      toast.error('Selecione um medicamento.');
      return;
    }
    try {
      await api.post('/receita-medicamentos', {
        id_receita: selectedReceitaId,
        id_medicamento: medicamentoId,
        posologia: posologia || null,
        via_administracao: viaAdministracao || null,
        quantidade_total: quantidadeTotal ? parseFloat(quantidadeTotal) : null,
        frequencia_dia: frequenciaDia ? parseInt(frequenciaDia, 10) : null,
        duracao_dias: duracaoDias ? parseInt(duracaoDias, 10) : null,
        observacao: observacaoMed || null,
      });
      toast.success('Medicamento vinculado à receita.');
      setMedicamentoId('');
      setPosologia('');
      setViaAdministracao('');
      setQuantidadeTotal('');
      setFrequenciaDia('');
      setDuracaoDias('');
      setObservacaoMed('');
      setMedicamentoPopoverOpen(false);
      if (selectedReceitaId) {
        const rms = await api.get<ReceitaMedicamento[]>(`/receita-medicamentos?id_receita=${encodeURIComponent(String(selectedReceitaId))}`);
        setReceitaMedicamentos(Array.isArray(rms) ? rms : []);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao vincular medicamento');
    }
  };

  const handleVincularMedicamentoRapido = async () => {
    if (!selectedReceitaId || !medicamentoId) {
      toast.error('Selecione um medicamento.');
      return;
    }
    try {
      await api.post('/receita-medicamentos', {
        id_receita: selectedReceitaId,
        id_medicamento: medicamentoId,
        posologia: null,
        via_administracao: null,
        quantidade_total: null,
        frequencia_dia: null,
        duracao_dias: null,
        observacao: null,
      });
      toast.success('Medicamento adicionado à receita.');
      setAdicionarMedicamentoDialogOpen(false);
      setMedicamentoId('');
      setMedicamentoPopoverOpen(false);
      await refetchReceitaData();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao adicionar medicamento');
    }
  };

  const handleSalvarHorarios = async () => {
    if (!selectedReceitaId) return;
    const paraSalvar = medicamentosNaoAgendados;
    for (const rm of paraSalvar) {
      const form = getFormForRm(rm);
      const cadaHoras = Math.max(0, parseInt(form.cadaHoras, 10) || 0);
      const duracaoDias = Math.max(0, parseInt(form.duracaoDias, 10) || 0);
      const unidade = form.intervaloUnidade ?? 'hora';
      const horariosPreenchidos = form.horariosTomadas.filter((h) => h?.trim());
      if (horariosPreenchidos.length === 0 || duracaoDias < 1 || !form.dataInicioTratamento?.trim()) continue;
      if (unidade === 'hora') {
        const validacao = validarIntervaloHorarios(horariosPreenchidos, cadaHoras);
        if (!validacao.valido) {
          toast.error(validacao.mensagem);
          throw new Error(validacao.mensagem);
        }
      }
    }
    try {
      await Promise.all(
        paraSalvar.map(async (rm) => {
          const form = getFormForRm(rm);
          const duracaoDias = Math.max(0, parseInt(form.duracaoDias, 10) || 0);
          const unidade = form.intervaloUnidade ?? 'hora';
          const vezesPorDia = unidade === 'dia' ? 1 : Math.max(0, parseInt(form.vezesPorDia, 10) || 0);
          const horariosPreenchidos = form.horariosTomadas.filter((h) => h?.trim());
          if (horariosPreenchidos.length === 0 || duracaoDias < 1 || !form.dataInicioTratamento?.trim()) return;

          await api.put(`/receita-medicamentos/${encodeURIComponent(String(rm.id))}`, {
            posologia: form.posologia?.trim() || null,
            frequencia_dia: vezesPorDia >= 1 ? vezesPorDia : null,
            duracao_dias: duracaoDias,
            observacao: null,
          });

          const horariosISO =
            unidade === 'dia'
              ? gerarHorariosISOIntervaloDias(
                  form.dataInicioTratamento.trim(),
                  duracaoDias,
                  Math.max(1, parseInt(form.cadaHoras, 10) || 1),
                  form.horaPadraoDia || '08:00'
                )
              : gerarHorariosISO(form.dataInicioTratamento.trim(), duracaoDias, horariosPreenchidos);
          await Promise.all(
            horariosISO.map((dataDisparo) =>
              api.post('/receita-horarios', {
                id_receita_medicamento: rm.id,
                horario: dataDisparo,
                data_fim: null,
              })
            )
          );
        })
      );
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar horários');
      throw e;
    }
  };

  const handleSalvarEdicaoAgendado = async (rmId: string) => {
    if (!selectedReceitaId || !rmId) return;
    const rm = receitaMedicamentos.find((r) => String(r.id) === rmId);
    if (!rm) return;
    const form = getFormForRm(rm);
    const duracaoDias = Math.max(0, parseInt(form.duracaoDias, 10) || 0);
    const unidade = form.intervaloUnidade ?? 'hora';
    const vezesPorDia = unidade === 'dia' ? 1 : Math.max(0, parseInt(form.vezesPorDia, 10) || 0);
    const horariosPreenchidos = form.horariosTomadas.filter((h) => h?.trim());
    const cadaHorasNum = Math.max(0, parseInt(form.cadaHoras, 10) || 0);
    if (horariosPreenchidos.length === 0 || duracaoDias < 1 || !form.dataInicioTratamento?.trim()) {
      const msg = 'Preencha data de início, duração e todos os horários das tomadas.';
      toast.error(msg);
      throw new Error(msg);
    }
    if (unidade === 'hora') {
      const validacao = validarIntervaloHorarios(horariosPreenchidos, cadaHorasNum);
      if (!validacao.valido) {
        toast.error(validacao.mensagem);
        throw new Error(validacao.mensagem);
      }
    }
    try {
      const existentes = horariosPorRm(rmId);
      await Promise.all(
        existentes.map((h) =>
          api.delete(`/receita-horarios?id=${encodeURIComponent(String(h.id))}`)
        )
      );
      await api.put(`/receita-medicamentos/${encodeURIComponent(rmId)}`, {
        posologia: form.posologia?.trim() || null,
        frequencia_dia: vezesPorDia >= 1 ? vezesPorDia : null,
        duracao_dias: duracaoDias,
        observacao: null,
      });
      const horariosISO =
        unidade === 'dia'
          ? gerarHorariosISOIntervaloDias(
              form.dataInicioTratamento.trim(),
              duracaoDias,
              Math.max(1, parseInt(form.cadaHoras, 10) || 1),
              form.horaPadraoDia || '08:00'
            )
          : gerarHorariosISO(form.dataInicioTratamento.trim(), duracaoDias, horariosPreenchidos);
      await Promise.all(
        horariosISO.map((dataDisparo) =>
          api.post('/receita-horarios', {
            id_receita_medicamento: rm.id,
            horario: dataDisparo,
            data_fim: null,
          })
        )
      );
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao atualizar agendamento');
      throw e;
    }
  };

  const handleSalvarReceita = async () => {
    if (!selectedReceitaId || !hasMedicamentos) return;
    if (!pacienteTemTelefone) {
      toast.error('Para salvar a receita, cadastre um telefone do paciente.');
      return;
    }
    setSavingHorarios(true);
    setPodeImprimir(false);
    try {
      await handleSalvarHorarios();
      await Promise.all(
        medicamentosAgendados.map((rm) => handleSalvarEdicaoAgendado(String(rm.id)))
      );
      const rms = await api.get<ReceitaMedicamento[]>(`/receita-medicamentos?id_receita=${encodeURIComponent(selectedReceitaId)}`);
      setReceitaMedicamentos(Array.isArray(rms) ? rms : []);
      const lista = Array.isArray(rms) ? rms : [];
      const horariosResults = await Promise.all(
        lista.map((r) =>
          api.get<ReceitaHorario[]>(`/receita-horarios?id_rm=${encodeURIComponent(String(r.id))}`)
        )
      );
      const byRm: Record<string, ReceitaHorario[]> = {};
      lista.forEach((r, i) => {
        byRm[String(r.id)] = Array.isArray(horariosResults[i]) ? horariosResults[i] : [];
      });
      setHorariosByRm(byRm);
      setPrescricaoForm({});
      toast.success('Receita salva com sucesso.');
    } catch {
      // erros já exibidos nos handlers internos
    } finally {
      setSavingHorarios(false);
      setPodeImprimir(true);
    }
  };

  const handleMarcarReceitaProntaParaEnvio = async () => {
    if (!selectedReceitaId) return;
    if (!allAgendados) {
      toast.error('Agende todos os itens da receita antes de marcar como pronta para envio.');
      return;
    }
    if (savingHorarios || savingProntoEnvio) return;
    if (selectedReceita?.pronta_envio) return;
    setSavingProntoEnvio(true);
    try {
      const codigoAtual = String(selectedReceita?.codigo_envio ?? '').trim();
      const codigo = codigoAtual || gerarCodigoEnvioReceita(selectedReceitaId);
      await api.put(`/receitas?id=${encodeURIComponent(selectedReceitaId)}`, {
        pronta_envio: true,
        codigo_envio: codigo,
      });
      setReceitas((prev) =>
        prev.map((r) =>
          String(r.id) === String(selectedReceitaId)
            ? { ...r, pronta_envio: true, codigo_envio: codigo }
            : r
        )
      );
      toast.success('Receita marcada como pronta para envio.');
    } catch (e: any) {
      toast.error(e?.message ?? e?.errorMessage ?? 'Erro ao marcar receita como pronta para envio.');
    } finally {
      setSavingProntoEnvio(false);
    }
  };

  const refetchReceitaData = async () => {
    if (!selectedReceitaId) return;
    try {
      const rms = await api.get<ReceitaMedicamento[]>(`/receita-medicamentos?id_receita=${encodeURIComponent(selectedReceitaId)}`);
      setReceitaMedicamentos(Array.isArray(rms) ? rms : []);
      const byRm: Record<string, ReceitaHorario[]> = {};
      for (const rm of rms || []) {
        const idRm = String(rm.id);
        try {
          const horarios = await api.get<ReceitaHorario[]>(`/receita-horarios?id_rm=${encodeURIComponent(idRm)}`);
          byRm[idRm] = Array.isArray(horarios) ? horarios : [];
        } catch {
          byRm[idRm] = [];
        }
      }
      setHorariosByRm(byRm);
    } catch {
      toast.error('Erro ao atualizar lista de medicamentos');
    }
  };

  const handleRemoveMedicamentoFromReceita = async (rm: ReceitaMedicamento) => {
    if (!selectedReceitaId) return;
    if (rm?.id == null || rm.id === '') {
      toast.error('Medicamento inválido para remoção');
      return;
    }
    setRemovingMedicamentoId(rm.id);
    try {
      await api.delete(`/receita-medicamentos/${encodeURIComponent(String(rm.id))}`);
      toast.success('Medicamento removido da receita.');
      setPrescricaoForm((prev) => {
        const next = { ...prev };
        delete next[String(rm.id)];
        return next;
      });
      await refetchReceitaData();
    } catch (e: any) {
      toast.error(e?.message ?? e?.errorMessage ?? 'Erro ao remover medicamento da receita.');
    } finally {
      setRemovingMedicamentoId(null);
    }
  };

  const handleOpenEditarImagemMedicamento = (idMedicamento: number | string) => {
    const med = medicamentos.find((m) => String(m.id) === String(idMedicamento));
    setImagemMedicamentoId(idMedicamento);
    setImagemMedicamentoUrl(med?.imagem_url ?? '');
    setImagemMedicamentoDialogOpen(true);
  };

  const handleImagemMedicamentoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!allowedImagemMedicamentoTypes.includes(file.type)) {
      toast.error('Use PNG, JPG ou WebP (máx. 5MB)');
      e.target.value = '';
      return;
    }
    if (file.size > maxImagemMedicamentoSize) {
      toast.error('A imagem deve ter no máximo 5MB');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagemMedicamentoUrl(dataUrl);
      toast.success('Imagem selecionada');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSalvarImagemMedicamento = async () => {
    if (!imagemMedicamentoId) return;
    setSavingImagemMedicamento(true);
    try {
      await api.put(`/medicamentos?id=${encodeURIComponent(String(imagemMedicamentoId))}`, {
        imagem_url: imagemMedicamentoUrl.trim() || null,
      });
      toast.success('Imagem do medicamento atualizada com sucesso.');
      const data = await api.get<Medicamento[]>('/medicamentos', { limit: '500' });
      setMedicamentos(data || []);
      setImagemMedicamentoDialogOpen(false);
      setImagemMedicamentoId(null);
      setImagemMedicamentoUrl('');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao atualizar imagem do medicamento');
    } finally {
      setSavingImagemMedicamento(false);
    }
  };

  const refetchCelularesPorPaciente = async () => {
    try {
      const list = await api.get<PacienteCelularResumo[]>('/paciente-celulares', { limit: '500' });
      const map: Record<number | string, PacienteCelularResumo> = {};
      (list || []).forEach((c) => {
        if (c.ativo && !map[c.id_paciente]) map[c.id_paciente] = c;
      });
      setCelularesPorPaciente(map);
    } catch {
      // silencioso na tela de agendamento
    }
  };

  const handleSalvarCelularPaciente = async () => {
    if (!selectedPaciente || !novoNumeroContato.trim()) {
      toast.error('Informe o número de telefone do paciente.');
      return;
    }
    setSavingCelular(true);
    try {
      if (editingCelular?.id) {
        await api.put(`/paciente-celulares/${encodeURIComponent(String(editingCelular.id))}`, {
          ...editingCelular,
          numero_contato: novoNumeroContato.trim(),
        });
        toast.success('Telefone do paciente atualizado com sucesso.');
      } else {
        await api.post('/paciente-celulares', {
          id_paciente: selectedPaciente.id,
          modelo: 'Desconhecido',
          marca: 'Desconhecida',
          numero_serie: null,
          numero_contato: novoNumeroContato.trim(),
          tipo_celular: 'proprio',
          nome_cuidador: null,
          ativo: true,
        });
        toast.success('Telefone do paciente cadastrado com sucesso.');
      }
      setCelularDialogOpen(false);
      setNovoNumeroContato('');
      setEditingCelular(null);
      await refetchCelularesPorPaciente();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao cadastrar telefone do paciente');
    } finally {
      setSavingCelular(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
          Agendamento de Medicamentos
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Configure o cronograma de doses e horários das prescrições.
        </p>

        {/* Pesquisar receita */}
        <Card className="mb-6 border rounded-lg shadow-sm bg-card">
          <CardContent className="pt-6">
            <Label className="text-sm font-medium text-foreground">Pesquisar receita</Label>
            <p className="text-xs text-muted-foreground mb-2 mt-1">Nome do paciente, número da receita, Cartão SUS, data ou nome do médico</p>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal" role="combobox">
                  {selectedReceita
                    ? `${String(selectedReceita.id).slice(0, 8)}… — ${formatarData(selectedReceita.data_receita)} — ${selectedPaciente?.nome ?? '—'}`
                    : 'Selecione uma receita...'}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <div className="flex items-center rounded-full bg-muted/80 border border-border/50 mx-2 mt-2 mb-1 px-2">
                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                    <input
                      className="flex h-10 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Código, data, paciente, SUS, médico..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>Nenhuma receita encontrada.</CommandEmpty>
                    {filteredReceitas.map((r) => {
                      const pac = pacientes.find((p) => String(p.id) === String(r.id_paciente));
                          const numeroPaciente = pac?.numero_paciente ?? pac?.id;
                          const numeroLabel = numeroPaciente != null && numeroPaciente !== '' ? ` — Paciente nº ${numeroPaciente}` : '';
                          const label = `${String(r.id).slice(0, 8)}… — ${formatarData(r.data_receita)} — ${pac?.nome ?? '—'}${numeroLabel}`;
                      return (
                        <CommandItem
                          key={r.id}
                          value={String(r.id)}
                          onSelect={() => {
                            setSelectedReceitaId(String(r.id));
                            setComboboxOpen(false);
                          }}
                        >
                          {label}
                        </CommandItem>
                      );
                    })}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {!selectedReceitaId && (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">Selecione uma receita acima para continuar.</p>
            </CardContent>
          </Card>
        )}

        {selectedReceitaId && loadingReceita && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                <p>Carregando receita...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedReceitaId && !loadingReceita && (
          <Card className="overflow-hidden border rounded-lg shadow-sm bg-card">
            <CardHeader className="border-b bg-muted/20">
              <div className="space-y-2">
                {(selectedPaciente || selectedReceita) && (
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-1">
                      {selectedPaciente && (
                        <>
                          <User className="h-5 w-5 text-muted-foreground shrink-0" />
                          <span className="text-lg md:text-xl font-semibold leading-none">
                            {selectedPaciente.nome}
                          </span>
                          {selectedPaciente?.cartao_sus != null && selectedPaciente.cartao_sus !== '' && (
                            <span className="text-xs sm:text-sm text-muted-foreground leading-none">
                              Cartão SUS: {selectedPaciente.cartao_sus}
                            </span>
                          )}
                          {(selectedPacienteCelular?.numero_contato || selectedPaciente?.celular || selectedReceita) && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span className="text-xs sm:text-sm text-muted-foreground leading-none">
                                Telefone: {formatarTelefoneExibicao(selectedPacienteCelular?.numero_contato ?? selectedPaciente?.celular)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => {
                                  setEditingCelular(selectedPacienteCelular ?? null);
                                  setNovoNumeroContato(
                                    selectedPacienteCelular?.numero_contato ?? selectedPaciente?.celular ?? ''
                                  );
                                  setCelularDialogOpen(true);
                                }}
                                aria-label="Editar telefone do paciente"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              {selectedReceita && (
                                <span className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground leading-none">
                                  <Calendar className="h-4 w-4 shrink-0" />
                                  Receita: {formatarData(selectedReceita.data_receita)}
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      {selectedReceita && (
                        <div className="ml-auto flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 border-border/70 text-foreground hover:text-primary"
                            onClick={() => setAdicionarMedicamentoDialogOpen(true)}
                            aria-label="Adicionar medicamento à receita"
                            title="Adicionar medicamento à receita"
                          >
                            <Plus className="h-6 w-6" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {selectedPaciente && !selectedPacienteCelular?.numero_contato && !selectedPaciente?.celular && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 h-7 px-2 text-xs w-fit"
                        onClick={() => {
                          setEditingCelular(null);
                          setNovoNumeroContato('');
                          setCelularDialogOpen(true);
                        }}
                      >
                        <Smartphone className="h-3 w-3 mr-1" />
                        Cadastrar telefone do paciente
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        )}

        {selectedReceitaId && !loadingReceita && !hasMedicamentos && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Pill className="h-5 w-5" />
                Vincular medicamentos à receita (obrigatório)
              </CardTitle>
              <p className="text-sm font-medium text-destructive mt-2">
                Esta receita não possui medicamentos vinculados no sistema. Nenhuma receita pode constar em branco no MEDTIME. Adicione ao menos um medicamento abaixo antes de continuar.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Medicamento *</Label>
                <Popover open={medicamentoPopoverOpen} onOpenChange={setMedicamentoPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal">
                      {medicamentoId ? getMedicamentoNome(medicamentoId) : 'Selecione o medicamento'}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Pesquisar medicamento..." />
                      <CommandList className="max-h-[200px]">
                        {medicamentos.map((m) => (
                          <CommandItem
                            key={m.id}
                            value={String(m.nome)}
                            onSelect={() => {
                              setMedicamentoId(String(m.id));
                              setMedicamentoPopoverOpen(false);
                            }}
                          >
                            {m.nome}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Via de administração</Label>
                  <Input placeholder="Ex: Oral" value={viaAdministracao} onChange={(e) => setViaAdministracao(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Quantidade</Label>
                  <Input type="number" value={quantidadeTotal} onChange={(e) => setQuantidadeTotal(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Freq./dia</Label>
                  <Input type="number" value={frequenciaDia} onChange={(e) => setFrequenciaDia(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Duração (dias)</Label>
                  <Input type="number" value={duracaoDias} onChange={(e) => setDuracaoDias(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea rows={2} placeholder="Observações" value={observacaoMed} onChange={(e) => setObservacaoMed(e.target.value)} />
              </div>
              <Button onClick={handleVincularMedicamento}>
                <Plus className="h-4 w-4 mr-2" />
                Vincular medicamento
              </Button>
            </CardContent>
          </Card>
        )}

        {selectedReceitaId && !loadingReceita && hasMedicamentos && allAgendados && (
          <Card className="overflow-hidden border rounded-lg shadow-sm bg-card">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-6">
                {medicamentosAgendados.map((rm, index) => {
                  const horarios = horariosPorRm(String(rm.id));
                  const formData = getFormForRm(rm);
                  const duracaoDiasNum = Math.max(0, parseInt(formData.duracaoDias, 10) || 0);
                  const validadeReceita = formData.dataInicioTratamento?.trim() && duracaoDiasNum >= 1
                    ? calcularValidadeReceita(inputParaDataBR(formData.dataInicioTratamento), duracaoDiasNum)
                    : '';
                  const horariosPreenchidos = formData.horariosTomadas.filter((h) => h?.trim());
                  const cadaHorasNum = Math.max(0, parseInt(formData.cadaHoras, 10) || 0);
                  const todosHorariosPreenchidos = formData.horariosTomadas.length > 0 && horariosPreenchidos.length === formData.horariosTomadas.length;
                  const validacaoIntervalo = todosHorariosPreenchidos ? validarIntervaloHorarios(horariosPreenchidos, cadaHorasNum) : { valido: true as const };
                  const mostrarAvisoIntervalo = todosHorariosPreenchidos && !validacaoIntervalo.valido;

                  return (
                    <div key={rm.id} className="border rounded-lg p-5 space-y-5 bg-card shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-1 md:col-span-2">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">Nome do Medicamento</span>
                          <div className="relative flex items-center gap-3 rounded-md bg-muted/50 border border-border/60 px-3 py-2">
                            <button
                              type="button"
                              className="flex items-center justify-center w-10 h-10 rounded-md border bg-muted hover:bg-muted/80 transition-colors"
                              onClick={() => handleOpenEditarImagemMedicamento(rm.id_medicamento)}
                              aria-label="Alterar imagem do medicamento"
                            >
                              {getMedicamentoImagemUrl(rm.id_medicamento) ? (
                                <img
                                  src={getMedicamentoImagemUrl(rm.id_medicamento)}
                                  alt={getMedicamentoNome(rm.id_medicamento)}
                                  className="w-8 h-8 object-contain rounded"
                                />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                            <div className="flex items-center">
                              <Paperclip className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-semibold text-base md:text-lg text-foreground break-words">
                                {getMedicamentoNome(rm.id_medicamento)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-2 md:col-span-1">
                          <Label className="text-muted-foreground text-sm">Início do tratamento</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-full max-w-[180px]">
                              <Input
                                type="date"
                                value={formData.dataInicioTratamento || getDataHojeYmd()}
                                onChange={(e) => updateFormForRm(rm, 'dataInicioTratamento', e.target.value)}
                                className="border rounded-md w-full text-center"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="shrink-0 h-9 w-9 border-border/70 text-muted-foreground hover:text-primary"
                              onClick={() => setAndamentoDialogRmId(String(rm.id))}
                              title="Visualizar andamento da receita"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="shrink-0 h-9 w-9 border-border/70 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                setRemoveMedicamentoTarget(rm);
                                setRemoveMedicamentoDialogOpen(true);
                              }}
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
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 border-t border-border">
                        <div className="space-y-3 flex-shrink-0 sm:border-r sm:border-border sm:pr-6">
                          <h4 className="flex items-center gap-2 font-medium text-foreground text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            INTERVALO E DURAÇÃO
                          </h4>
                          <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
                            {(['duracaoDias', 'cadaHoras', ...(formData.intervaloUnidade === 'dia' ? [] : (['vezesPorDia'] as const))] as const).map((field) => (
                              <div key={field} className={`grid gap-2 flex-shrink-0 ${field === 'vezesPorDia' ? 'w-[5.25rem]' : field === 'cadaHoras' ? 'w-[11.5rem]' : 'w-[7.5rem]'}`}>
                                {field === 'cadaHoras' ? (
                                  <>
                                    <Label className="text-muted-foreground text-sm">A cada</Label>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min={1}
                                        max={365}
                                        value={formData.cadaHoras}
                                        onChange={(e) => updateFormForRm(rm, 'cadaHoras', e.target.value)}
                                        className="border rounded-md text-center w-[4.5rem] min-w-[4.5rem]"
                                      />
                                      <Select
                                        value={formData.intervaloUnidade}
                                        onValueChange={(v) => updateFormForRm(rm, 'intervaloUnidade', v)}
                                      >
                                        <SelectTrigger className="w-[76px] h-9">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="hora">Hora</SelectItem>
                                          <SelectItem value="dia">Dia</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <Label className="text-muted-foreground text-sm">
                                      {field === 'vezesPorDia' ? 'Vezes/dia' : 'Duração de dias'}
                                    </Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={field === 'duracaoDias' ? 365 : 24}
                                      value={formData[field]}
                                      onChange={(e) => updateFormForRm(rm, field, e.target.value)}
                                      className="border rounded-md text-center"
                                    />
                                  </>
                                )}
                              </div>
                            ))}
                            <div className="grid gap-2 min-w-[7.25rem] flex-shrink-0">
                              <Label className="text-muted-foreground text-sm">Validade da Receita</Label>
                              <div className="relative flex items-center">
                                <Input readOnly value={validadeReceita} className="bg-muted/30 border rounded-md pr-9 text-center" placeholder="dd/mm/aaaa" />
                                <Calendar className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3 flex-1 min-w-0 sm:pl-6">
                          <h4 className="flex items-center gap-2 font-medium text-foreground text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formData.intervaloUnidade === 'dia' ? 'DIAS DAS TOMADAS' : 'HORÁRIOS DAS TOMADAS'}
                          </h4>
                          {formData.intervaloUnidade !== 'dia' && mostrarAvisoIntervalo && validacaoIntervalo.mensagem && (
                            <p className="text-sm text-destructive">{validacaoIntervalo.mensagem}</p>
                          )}
                          {formData.intervaloUnidade === 'dia' && (
                            <div className="grid gap-2 max-w-[180px]">
                              <Label className="text-muted-foreground text-sm">Hora da tomada</Label>
                              <Input
                                type="time"
                                value={formData.horaPadraoDia || '08:00'}
                                onChange={(e) => updateFormForRm(rm, 'horaPadraoDia', e.target.value)}
                                className="border rounded-md text-center"
                              />
                            </div>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {formData.horariosTomadas.map((h, i) => (
                              <div key={i} className="grid gap-1 min-w-[110px] w-full">
                                <Label className="text-muted-foreground text-sm">
                                  {formData.intervaloUnidade === 'dia' ? `${i + 1}ª TOMADA` : `${i + 1}ª DOSE`}
                                </Label>
                                {formData.intervaloUnidade === 'dia' ? (
                                  <Input
                                    readOnly
                                    value={`Dia ${h} — ${formData.horaPadraoDia || '08:00'}`}
                                    className="bg-muted/30 border rounded-md text-center"
                                  />
                                ) : (
                                  <div className="relative flex items-center">
                                    <Input
                                      type="time"
                                      value={h}
                                      onChange={(e) => setHorarioTomada(rm, i, e.target.value)}
                                      className="border rounded-md text-center"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedReceitaId && hasMedicamentos && (
                <div className="mt-4 flex justify-end gap-3">
                  {allAgendados && podeImprimir && !savingHorarios && (
                    <Button
                      variant={selectedReceita?.pronta_envio ? "secondary" : "default"}
                      onClick={handleMarcarReceitaProntaParaEnvio}
                      disabled={savingProntoEnvio || savingHorarios || Boolean(selectedReceita?.pronta_envio)}
                    >
                      {selectedReceita?.pronta_envio
                        ? `Pronta para envio${selectedReceita?.codigo_envio ? ` — ${selectedReceita.codigo_envio}` : ''}`
                        : savingProntoEnvio
                          ? 'Marcando...'
                          : 'Pronto para envio'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    disabled={!podeImprimir || savingHorarios}
                  >
                    Imprimir receita
                  </Button>
                  <Button
                    onClick={handleSalvarReceita}
                    disabled={savingHorarios || !pacienteTemTelefone}
                  >
                    {savingHorarios ? 'Salvando...' : 'Salvar edição da receita'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedReceitaId && !loadingReceita && hasMedicamentos && someAgendados && !allAgendados && (
          <Card className="mb-6 border rounded-lg shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Medicamentos já agendados</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Horários de administração já cadastrados para esta receita. Clique no lápis para editar.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {medicamentosAgendados.map((rm, index) => {
                const horarios = horariosPorRm(String(rm.id));
                const formData = getFormForRm(rm);
                const duracaoDiasNum = Math.max(0, parseInt(formData.duracaoDias, 10) || 0);
                const validadeReceita = formData.dataInicioTratamento?.trim() && duracaoDiasNum >= 1
                  ? calcularValidadeReceita(inputParaDataBR(formData.dataInicioTratamento), duracaoDiasNum)
                  : '';
                const horariosPreenchidos = formData.horariosTomadas.filter((h) => h?.trim());
                const cadaHorasNum = Math.max(0, parseInt(formData.cadaHoras, 10) || 0);
                const todosHorariosPreenchidos = formData.horariosTomadas.length > 0 && horariosPreenchidos.length === formData.horariosTomadas.length;
                const validacaoIntervalo = todosHorariosPreenchidos ? validarIntervaloHorarios(horariosPreenchidos, cadaHorasNum) : { valido: true as const };
                const mostrarAvisoIntervalo = todosHorariosPreenchidos && !validacaoIntervalo.valido;

                return (
                  <div key={rm.id} className="border rounded-lg p-5 space-y-5 bg-card shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-1 md:col-span-2">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">Nome do Medicamento</span>
                          <div className="relative flex items-center gap-3 rounded-md bg-muted/50 border border-border/60 px-3 py-2">
                            <button
                              type="button"
                              className="flex items-center justify-center w-10 h-10 rounded-md border bg-muted hover:bg-muted/80 transition-colors"
                              onClick={() => handleOpenEditarImagemMedicamento(rm.id_medicamento)}
                              aria-label="Alterar imagem do medicamento"
                            >
                              {getMedicamentoImagemUrl(rm.id_medicamento) ? (
                                <img
                                  src={getMedicamentoImagemUrl(rm.id_medicamento)}
                                  alt={getMedicamentoNome(rm.id_medicamento)}
                                  className="w-8 h-8 object-contain rounded"
                                />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                            <div className="flex items-center">
                              <Paperclip className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-semibold text-base md:text-lg text-foreground break-words">
                                {getMedicamentoNome(rm.id_medicamento)}
                              </span>
                            </div>
                          </div>
                        </div>
                      <div className="grid gap-2 md:col-span-1">
                        <Label className="text-muted-foreground text-sm">Início do tratamento</Label>
                        <div className="flex items-center gap-2">
                          <div className="w-full max-w-[180px]">
                            <Input
                              type="date"
                              value={formData.dataInicioTratamento || getDataHojeYmd()}
                              onChange={(e) => updateFormForRm(rm, 'dataInicioTratamento', e.target.value)}
                              className="border rounded-md w-full text-center"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 h-9 w-9 border-border/70 text-muted-foreground hover:text-primary"
                            onClick={() => setAndamentoDialogRmId(String(rm.id))}
                            title="Visualizar andamento da receita"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 h-9 w-9 border-border/70 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setRemoveMedicamentoTarget(rm);
                              setRemoveMedicamentoDialogOpen(true);
                            }}
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
                      </div>
                    </div>
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 border-t border-border">
                        <div className="space-y-3 flex-shrink-0 sm:border-r sm:border-border sm:pr-6">
                          <h4 className="flex items-center gap-2 font-medium text-foreground text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" /> INTERVALO E DURAÇÃO
                          </h4>
                          <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
                          {(['duracaoDias', 'cadaHoras', ...(formData.intervaloUnidade === 'dia' ? [] : (['vezesPorDia'] as const))] as const).map((field) => (
                            <div key={field} className={`grid gap-2 flex-shrink-0 ${field === 'vezesPorDia' ? 'w-[5.25rem]' : field === 'cadaHoras' ? 'w-[11.5rem]' : 'w-[7.5rem]'}`}>
                              {field === 'cadaHoras' ? (
                                <>
                                  <Label className="text-muted-foreground text-sm">A cada</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min={1}
                                      max={365}
                                      value={formData.cadaHoras}
                                      onChange={(e) => updateFormForRm(rm, 'cadaHoras', e.target.value)}
                                      className="border rounded-md text-center w-[4.5rem] min-w-[4.5rem]"
                                    />
                                    <Select
                                      value={formData.intervaloUnidade}
                                      onValueChange={(v) => updateFormForRm(rm, 'intervaloUnidade', v)}
                                    >
                                      <SelectTrigger className="w-[76px] h-9">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="hora">Hora</SelectItem>
                                        <SelectItem value="dia">Dia</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Label className="text-muted-foreground text-sm">
                                    {field === 'vezesPorDia' ? 'Vezes/dia' : 'Duração de dias'}
                                  </Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={field === 'duracaoDias' ? 365 : 24}
                                    value={formData[field]}
                                    onChange={(e) => updateFormForRm(rm, field, e.target.value)}
                                    className="border rounded-md text-center"
                                  />
                                </>
                              )}
                            </div>
                          ))}
                            <div className="grid gap-2 min-w-[7.25rem] flex-shrink-0">
                              <Label className="text-muted-foreground text-sm">Validade da Receita</Label>
                              <div className="relative flex items-center">
                                <Input
                                  readOnly
                                  value={validadeReceita}
                                  className="bg-muted/30 border rounded-md pr-9 text-center"
                                  placeholder="dd/mm/aaaa"
                                />
                                <Calendar className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3 flex-1 min-w-0 sm:pl-6">
                          <h4 className="flex items-center gap-2 font-medium text-foreground text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" /> {formData.intervaloUnidade === 'dia' ? 'DIAS DAS TOMADAS' : 'HORÁRIOS DAS TOMADAS'}
                          </h4>
                          {formData.intervaloUnidade !== 'dia' && mostrarAvisoIntervalo && validacaoIntervalo.mensagem && (
                            <p className="text-sm text-destructive">{validacaoIntervalo.mensagem}</p>
                          )}
                          {formData.intervaloUnidade === 'dia' && (
                            <div className="grid gap-2 max-w-[180px]">
                              <Label className="text-muted-foreground text-sm">Hora da tomada</Label>
                              <Input
                                type="time"
                                value={formData.horaPadraoDia || '08:00'}
                                onChange={(e) => updateFormForRm(rm, 'horaPadraoDia', e.target.value)}
                                className="border rounded-md text-center"
                              />
                            </div>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {formData.horariosTomadas.map((h, i) => (
                              <div key={i} className="grid gap-1 min-w-[110px] w-full">
                                <Label className="text-muted-foreground text-sm">
                                  {formData.intervaloUnidade === 'dia' ? `${i + 1}ª TOMADA` : `${i + 1}ª DOSE`}
                                </Label>
                                {formData.intervaloUnidade === 'dia' ? (
                                  <Input
                                    readOnly
                                    value={`Dia ${h} — ${formData.horaPadraoDia || '08:00'}`}
                                    className="bg-muted/30 border rounded-md text-center"
                                  />
                                ) : (
                                  <div className="relative flex items-center">
                                    <Input
                                      type="time"
                                      value={h}
                                      onChange={(e) => setHorarioTomada(rm, i, e.target.value)}
                                      className="border rounded-md text-center"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                  </div>
                );
              })}
              {selectedReceitaId && hasMedicamentos && (
                <div className="mt-4 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    disabled={!podeImprimir || savingHorarios}
                  >
                    Imprimir receita
                  </Button>
                  <Button
                    onClick={handleSalvarReceita}
                    disabled={savingHorarios || !pacienteTemTelefone}
                  >
                    {savingHorarios ? 'Salvando...' : 'Salvar edição da receita'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedReceitaId && !loadingReceita && hasMedicamentos && medicamentosNaoAgendados.length > 0 && (
          <Card className="border rounded-lg shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Prescrição de Medicamentos</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Preencha os dados de cada medicamento abaixo.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {medicamentosNaoAgendados.map((rm, index) => {
                const form = getFormForRm(rm);
                const duracaoDiasNum = Math.max(0, parseInt(form.duracaoDias, 10) || 0);
                const validadeReceita = form.dataInicioTratamento?.trim() && duracaoDiasNum >= 1
                  ? calcularValidadeReceita(inputParaDataBR(form.dataInicioTratamento), duracaoDiasNum)
                  : '';
                const horariosPreenchidos = form.horariosTomadas.filter((h) => h?.trim());
                const cadaHorasNum = Math.max(0, parseInt(form.cadaHoras, 10) || 0);
                const todosHorariosPreenchidos = form.horariosTomadas.length > 0 && horariosPreenchidos.length === form.horariosTomadas.length;
                const validacaoIntervalo = todosHorariosPreenchidos
                  ? validarIntervaloHorarios(horariosPreenchidos, cadaHorasNum)
                  : { valido: true as const };
                const mostrarAvisoIntervalo = todosHorariosPreenchidos && !validacaoIntervalo.valido;

                return (
                  <div key={rm.id} className="border rounded-lg p-5 space-y-5 bg-card shadow-sm">
                    {/* 1 IDENTIFICAÇÃO */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="grid gap-1 md:col-span-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Nome do Medicamento</span>
                        <div className="relative flex items-center gap-3 rounded-md bg-muted/50 border border-border/60 px-3 py-2">
                          <button
                            type="button"
                            className="flex items-center justify-center w-10 h-10 rounded-md border bg-muted hover:bg-muted/80 transition-colors"
                            onClick={() => handleOpenEditarImagemMedicamento(rm.id_medicamento)}
                            aria-label="Alterar imagem do medicamento"
                          >
                            {getMedicamentoImagemUrl(rm.id_medicamento) ? (
                              <img
                                src={getMedicamentoImagemUrl(rm.id_medicamento)}
                                alt={getMedicamentoNome(rm.id_medicamento)}
                                className="w-8 h-8 object-contain rounded"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                          <div className="flex items-center">
                            <Paperclip className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-semibold text-base md:text-lg text-foreground break-words">
                              {getMedicamentoNome(rm.id_medicamento)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2 md:col-span-1">
                        <Label className="text-muted-foreground text-sm">Início do tratamento</Label>
                        <div className="flex items-center gap-2">
                          <div className="w-full max-w-[180px]">
                            <Input
                              type="date"
                              value={form.dataInicioTratamento || getDataHojeYmd()}
                              onChange={(e) => updateFormForRm(rm, 'dataInicioTratamento', e.target.value)}
                              className="border rounded-md w-full text-center"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 h-9 w-9 border-border/70 text-muted-foreground hover:text-primary"
                            onClick={() => setAndamentoDialogRmId(String(rm.id))}
                            title="Visualizar andamento da receita"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 h-9 w-9 border-border/70 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setRemoveMedicamentoTarget(rm);
                              setRemoveMedicamentoDialogOpen(true);
                            }}
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
                      </div>
                    </div>

                    {/* INTERVALO E DURAÇÃO + HORÁRIOS DAS TOMADAS lado a lado */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 border-t border-border">
                      <div className="space-y-3 flex-shrink-0 sm:border-r sm:border-border sm:pr-6">
                        <h4 className="flex items-center gap-2 font-medium text-foreground text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          INTERVALO E DURAÇÃO
                        </h4>
                        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
                          <div className="grid gap-2 w-[7.5rem] flex-shrink-0">
                            <Label className="text-muted-foreground text-sm">Duração de dias</Label>
                            <Input
                              type="number"
                              min={1}
                              max={365}
                              value={form.duracaoDias}
                              onChange={(e) => updateFormForRm(rm, 'duracaoDias', e.target.value)}
                              className="border rounded-md text-center"
                            />
                          </div>
                          <div className="grid gap-2 w-[11.5rem] flex-shrink-0">
                            <Label className="text-muted-foreground text-sm">A cada</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                max={365}
                                value={form.cadaHoras}
                                onChange={(e) => updateFormForRm(rm, 'cadaHoras', e.target.value)}
                                className="border rounded-md text-center w-[4.5rem] min-w-[4.5rem]"
                              />
                              <Select
                                value={form.intervaloUnidade}
                                onValueChange={(v) => updateFormForRm(rm, 'intervaloUnidade', v)}
                              >
                                <SelectTrigger className="w-[76px] h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hora">Hora</SelectItem>
                                  <SelectItem value="dia">Dia</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {form.intervaloUnidade !== 'dia' && (
                            <div className="grid gap-2 w-[5.25rem] flex-shrink-0">
                              <Label className="text-muted-foreground text-sm">Vezes/dia</Label>
                              <Input
                                type="number"
                                min={1}
                                max={24}
                                value={form.vezesPorDia}
                                onChange={(e) => updateFormForRm(rm, 'vezesPorDia', e.target.value)}
                                className="border rounded-md text-center"
                              />
                            </div>
                          )}
                          <div className="grid gap-2 min-w-[7.25rem] flex-shrink-0">
                            <Label className="text-muted-foreground text-sm">Validade da Receita</Label>
                            <div className="relative flex items-center">
                              <Input
                                readOnly
                                value={validadeReceita}
                                className="bg-muted/30 border rounded-md pr-9 text-center"
                                placeholder="dd/mm/aaaa"
                              />
                              <Calendar className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 flex-1 min-w-0 sm:pl-6">
                        <h4 className="flex items-center gap-2 font-medium text-foreground text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {form.intervaloUnidade === 'dia' ? 'DIAS DAS TOMADAS' : 'HORÁRIOS DAS TOMADAS'}
                        </h4>
                        {form.intervaloUnidade !== 'dia' && mostrarAvisoIntervalo && validacaoIntervalo.mensagem && (
                          <p className="text-sm text-destructive">{validacaoIntervalo.mensagem}</p>
                        )}
                        {form.intervaloUnidade === 'dia' && (
                          <div className="grid gap-2 max-w-[180px]">
                            <Label className="text-muted-foreground text-sm">Hora da tomada</Label>
                            <Input
                              type="time"
                              value={form.horaPadraoDia || '08:00'}
                              onChange={(e) => updateFormForRm(rm, 'horaPadraoDia', e.target.value)}
                              className="border rounded-md text-center"
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {form.horariosTomadas.map((h, i) => (
                            <div key={i} className="grid gap-1 min-w-[110px] w-full">
                              <Label className="text-muted-foreground text-sm">
                                {form.intervaloUnidade === 'dia' ? `${i + 1}ª TOMADA` : `${i + 1}ª DOSE`}
                              </Label>
                              {form.intervaloUnidade === 'dia' ? (
                                <Input
                                  readOnly
                                  value={`Dia ${h} — ${form.horaPadraoDia || '08:00'}`}
                                  className="bg-muted/30 border rounded-md text-center"
                                />
                              ) : (
                                <div className="relative flex items-center">
                                  <Input
                                    type="time"
                                    value={h}
                                    onChange={(e) => setHorarioTomada(rm, i, e.target.value)}
                                    className="border rounded-md text-center"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {selectedReceitaId && hasMedicamentos && (
                <div className="mt-4 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    disabled={!podeImprimir || savingHorarios}
                  >
                    Imprimir receita
                  </Button>
                  <Button
                    onClick={handleSalvarReceita}
                    disabled={savingHorarios || !pacienteTemTelefone}
                  >
                    {savingHorarios ? 'Salvando...' : 'Salvar edição da receita'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog
          open={celularDialogOpen}
          onOpenChange={(open) => {
            setCelularDialogOpen(open);
            if (!open) {
              setNovoNumeroContato('');
              setEditingCelular(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {editingCelular ? 'Editar telefone do paciente' : 'Cadastrar telefone do paciente'}
              </DialogTitle>
              <DialogDescription>
                {editingCelular ? 'Atualize o número de telefone do paciente ' : 'Informe um número de telefone para o paciente '}
                <span className="font-semibold">
                  {selectedPaciente?.nome ?? ''}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="novo-telefone">Número de telefone *</Label>
                <Input
                  id="novo-telefone"
                  placeholder="(00) 00000-0000"
                  maxLength={20}
                  value={novoNumeroContato}
                  onChange={(e) => setNovoNumeroContato(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCelularDialogOpen(false);
                  setNovoNumeroContato('');
                  setEditingCelular(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSalvarCelularPaciente}
                disabled={savingCelular}
              >
                {savingCelular ? 'Salvando...' : editingCelular ? 'Salvar alterações' : 'Salvar telefone'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={adicionarMedicamentoDialogOpen}
          onOpenChange={(open) => {
            setAdicionarMedicamentoDialogOpen(open);
            if (!open) {
              setMedicamentoId('');
              setMedicamentoPopoverOpen(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Adicionar medicamento à receita</DialogTitle>
              <DialogDescription>
                Busque um medicamento e adicione à receita selecionada.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Medicamento *</Label>
                <Popover open={medicamentoPopoverOpen} onOpenChange={setMedicamentoPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal">
                      {medicamentoId ? getMedicamentoNome(medicamentoId) : 'Selecione o medicamento'}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Pesquisar medicamento..." />
                      <CommandList className="max-h-[240px]">
                        {medicamentos.map((m) => (
                          <CommandItem
                            key={m.id}
                            value={String(m.nome)}
                            onSelect={() => {
                              setMedicamentoId(String(m.id));
                              setMedicamentoPopoverOpen(false);
                            }}
                          >
                            {m.nome}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdicionarMedicamentoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleVincularMedicamentoRapido}
                disabled={!medicamentoId || !selectedReceitaId}
              >
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={imagemMedicamentoDialogOpen}
          onOpenChange={(open) => {
            setImagemMedicamentoDialogOpen(open);
            if (!open) {
              setImagemMedicamentoId(null);
              setImagemMedicamentoUrl('');
            }
          }}
        >
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Alterar imagem do medicamento</DialogTitle>
              <DialogDescription>
                Selecione uma imagem do seu computador para o medicamento selecionado. A alteração será refletida em todas as telas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="imagem-medicamento-arquivo">Imagem do medicamento</Label>
                <Input
                  id="imagem-medicamento-arquivo"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={handleImagemMedicamentoFileChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Use uma imagem PNG, JPG ou WebP de até 5MB. Recomenda-se imagens quadradas para melhor visualização.
                </p>
              </div>
              {imagemMedicamentoUrl.trim() && (
                <div className="flex items-center justify-center w-full h-32 border rounded-md bg-muted/40">
                  <img
                    src={imagemMedicamentoUrl.trim()}
                    alt="Pré-visualização do medicamento"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setImagemMedicamentoDialogOpen(false);
                  setImagemMedicamentoId(null);
                  setImagemMedicamentoUrl('');
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSalvarImagemMedicamento}
                disabled={savingImagemMedicamento}
              >
                {savingImagemMedicamento ? 'Salvando...' : 'Salvar imagem'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Andamento da receita (vencimento 6 meses, renovações mensais) */}
        <Dialog open={!!andamentoDialogRmId} onOpenChange={(open) => !open && setAndamentoDialogRmId(null)}>
          <DialogContent className="max-w-6xl w-[92vw] min-w-[min(92vw,72rem)] max-h-[92vh] overflow-y-auto p-10">
            {andamentoDialogRmId && (() => {
              const rm = receitaMedicamentos.find((r) => String(r.id) === andamentoDialogRmId);
              if (!rm) return null;
              const horarios = horariosPorRm(andamentoDialogRmId);
              const formData = getFormFromAgendado(rm, horarios);
              const dataInicioStr = formData.dataInicioTratamento;
              if (!dataInicioStr?.trim()) {
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle>Andamento da receita</DialogTitle>
                      <DialogDescription>Data de início não disponível para este agendamento.</DialogDescription>
                    </DialogHeader>
                  </>
                );
              }
              const hoje = new Date();
              hoje.setHours(0, 0, 0, 0);
              const dataInicioBR = dataInicioStr.includes('/') ? dataInicioStr : inputParaDataBR(dataInicioStr);
              const dataVencimento = calcularDataVencimentoReceita(dataInicioStr);
              const renovacoes = calcularRenovacoesMensais(dataInicioStr);
              const contador = contadorVencimentoReceita(dataInicioStr);
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Eye className="h-7 w-7" />
                      Andamento da receita
                    </DialogTitle>
                    <DialogDescription className="text-lg">
                      {getMedicamentoNome(rm.id_medicamento)} — Validade de 6 meses, com renovação mensal.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-8 py-4">
                    <div className="grid grid-cols-2 gap-4 text-lg">
                      <span className="text-muted-foreground">Início do tratamento:</span>
                      <span className="font-medium">{dataInicioBR}</span>
                      <span className="text-muted-foreground">Vencimento da receita:</span>
                      <span className="font-medium">{dataVencimento}</span>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-6 space-y-3">
                      {contador.vencida ? (
                        <p className="text-lg font-medium text-destructive">Receita vencida.</p>
                      ) : (
                        <>
                          <p className="text-lg font-medium">
                            Restam <span className="text-primary">{contador.restamMeses}</span> mês(es) para o vencimento.
                          </p>
                          <p className="text-lg text-muted-foreground">
                            Próxima renovação ({contador.proximaRenovacaoMes}º mês): <span className="font-medium text-foreground">{contador.proximaRenovacaoBR}</span>
                          </p>
                        </>
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-medium text-muted-foreground mb-4">Renovações mensais (paciente deve voltar a cada mês):</p>
                      <ul className="space-y-3 text-lg">
                        {renovacoes.map((r) => {
                          const dataRenovacao = new Date(r.data);
                          dataRenovacao.setHours(0, 0, 0, 0);
                          const realizada = dataRenovacao <= hoje;
                          return (
                            <li
                              key={r.mes}
                              className={`flex justify-between items-center rounded-lg border px-5 py-4 ${realizada ? 'bg-muted border-muted-foreground/30' : ''}`}
                            >
                              <span className={realizada ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                                {r.label}
                                {realizada && <span className="ml-2 text-xs font-normal text-muted-foreground">(realizada)</span>}
                              </span>
                              <span className="font-medium">{r.dataBR}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={removeMedicamentoDialogOpen}
          onOpenChange={(open) => {
            setRemoveMedicamentoDialogOpen(open);
            if (!open) setRemoveMedicamentoTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover medicamento da receita?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O medicamento será removido desta receita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Não</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (!removeMedicamentoTarget) return;
                  await handleRemoveMedicamentoFromReceita(removeMedicamentoTarget);
                  setRemoveMedicamentoDialogOpen(false);
                  setRemoveMedicamentoTarget(null);
                }}
              >
                Sim
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AppLayout>
  );
}
