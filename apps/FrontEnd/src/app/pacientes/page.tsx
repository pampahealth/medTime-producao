
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit, Trash2, Smartphone, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import type { Paciente } from '@/types/medtime';

interface PacienteCelular {
  id: number;
  user_id: number;
  id_paciente: number;
  modelo: string;
  marca: string;
  numero_serie?: string;
  numero_contato: string;
  tipo_celular: 'proprio' | 'cuidador';
  nome_cuidador?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CelularFormData {
  id?: number;
  modelo: string;
  marca: string;
  numero_serie: string;
  numero_contato: string;
  tipo_celular: 'proprio' | 'cuidador';
  nome_cuidador: string;
  ativo: boolean;
}

/** Mapa id_paciente -> primeiro celular ativo (para exibir na grid) + refetch */
function useCelularesPorPaciente(): [Record<number | string, PacienteCelular>, () => void] {
  const [map, setMap] = useState<Record<number | string, PacienteCelular>>({});
  const [ver, setVer] = useState(0);
  const refetch = useCallback(() => setVer((v) => v + 1), []);
  useEffect(() => {
    api.get<PacienteCelular[]>('/paciente-celulares', { limit: '500' })
      .then((list) => {
        const next: Record<number | string, PacienteCelular> = {};
        (list || []).forEach((c) => {
          if (c.ativo && !next[c.id_paciente]) next[c.id_paciente] = c;
        });
        setMap(next);
      })
      .catch(() => {});
  }, [ver]);
  return [map, refetch];
}

export default function PacientesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [celularesPorPaciente, refetchCelulares] = useCelularesPorPaciente();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [celularDialogOpen, setCelularDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | string | null>(null);
  const [selectedPacienteNome, setSelectedPacienteNome] = useState<string>('');
  /** Ref com id do paciente ao abrir o modal de celular (evita perder o id antes do state atualizar) */
  const pendingCelularPacienteIdRef = useRef<number | string | null>(null);
  const [loadingCelular, setLoadingCelular] = useState(false);
  const [formData, setFormData] = useState({
    cartao_sus: '',
    cpf: '',
    nome: '',
    data_nascimento: '',
    celular: '',
    id_prefeitura: 1,
    ativo: true,
  });
  const [celularFormData, setCelularFormData] = useState<CelularFormData>({
    modelo: '',
    marca: '',
    numero_serie: '',
    numero_contato: '',
    tipo_celular: 'proprio',
    nome_cuidador: '',
    ativo: true,
  });

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.push('/meus-medicamentos');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (isLoading) return;
    if (!user?.isAdmin) {
      setLoading(false);
      return;
    }
    fetchPacientes();
  }, [user, isLoading]);

  const fetchPacientes = async () => {
    try {
      setLoading(true);
      const data = await api.get<Paciente[]>('/pacientes', { limit: '100' });
      setPacientes(data || []);
    } catch (error) {
      toast.error('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCelularPaciente = async (idPaciente: number | string) => {
    try {
      setLoadingCelular(true);
      const celulares = await api.get<PacienteCelular[]>('/paciente-celulares', { limit: '100' });
      const idStr = String(idPaciente);
      const celularPaciente = celulares?.find(c => String(c.id_paciente) === idStr && c.ativo);

      if (celularPaciente) {
        setCelularFormData({
          id: celularPaciente.id,
          modelo: celularPaciente.modelo,
          marca: celularPaciente.marca,
          numero_serie: celularPaciente.numero_serie || '',
          numero_contato: celularPaciente.numero_contato,
          tipo_celular: celularPaciente.tipo_celular,
          nome_cuidador: celularPaciente.nome_cuidador || '',
          ativo: celularPaciente.ativo,
        });
        return celularPaciente;
      }
      return null;
    } catch {
      return null;
    } finally {
      setLoadingCelular(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cartao_sus: '',
      cpf: '',
      nome: '',
      data_nascimento: '',
      celular: '',
      id_prefeitura: 1,
      ativo: true,
    });
    setEditingId(null);
  };

  const resetCelularForm = () => {
    setCelularFormData({
      modelo: '',
      marca: '',
      numero_serie: '',
      numero_contato: '',
      tipo_celular: 'proprio',
      nome_cuidador: '',
      ativo: true,
    });
    setSelectedPacienteId(null);
    setSelectedPacienteNome('');
    pendingCelularPacienteIdRef.current = null;
  };

  const handleEdit = async (paciente: Paciente) => {
    setFormData({
      cartao_sus: paciente.cartao_sus,
      cpf: paciente.cpf || '',
      nome: paciente.nome,
      data_nascimento: paciente.data_nascimento || '',
      celular: paciente.celular || '',
      id_prefeitura: paciente.id_prefeitura,
      ativo: paciente.ativo,
    });
    setEditingId(paciente.id);
    setSelectedPacienteId(paciente.id);
    setSelectedPacienteNome(paciente.nome);
    const celular = celularesPorPaciente[paciente.id] ?? await fetchCelularPaciente(paciente.id);
    if (celular) {
      setCelularFormData({
        id: celular.id,
        modelo: celular.modelo,
        marca: celular.marca,
        numero_serie: celular.numero_serie || '',
        numero_contato: celular.numero_contato,
        tipo_celular: celular.tipo_celular,
        nome_cuidador: celular.nome_cuidador || '',
        ativo: celular.ativo,
      });
    } else {
      resetCelularForm();
      setCelularFormData((prev) => ({ ...prev, numero_contato: paciente.celular || '' }));
    }
    setDialogOpen(true);
  };

  const handleOpenCelularDialog = async (paciente: Paciente) => {
    resetCelularForm();
    setSelectedPacienteId(paciente.id);
    setSelectedPacienteNome(paciente.nome);
    pendingCelularPacienteIdRef.current = paciente.id;
    const celularExistente = await fetchCelularPaciente(paciente.id);
    if (!celularExistente) {
      setCelularFormData((prev) => ({ ...prev, numero_contato: paciente.celular || '' }));
    }
    setCelularDialogOpen(true);
  };

  const validateCPF = (cpf: string): boolean => {
    if (!cpf) return true;
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.length === 11;
  };

  const validateCartaoSUS = (cartao: string): boolean => {
    const cleanCartao = cartao.replace(/\D/g, '');
    return cleanCartao.length > 0 && cleanCartao.length <= 20;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCartaoSUS(formData.cartao_sus)) {
      toast.error('Cartão SUS inválido');
      return;
    }

    if (formData.cpf && !validateCPF(formData.cpf)) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }

    try {
      const idPrefeitura = formData.id_prefeitura;
      const isUuid = typeof idPrefeitura === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idPrefeitura);
      const editingPaciente = editingId != null ? pacientes.find(p => String(p.id) === String(editingId)) : null;
      const submitData: Record<string, unknown> = {
        cartao_sus: formData.cartao_sus.replace(/\D/g, ''),
        nome: formData.nome,
        celular: formData.celular || null,
        cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : null,
        data_nascimento: formData.data_nascimento || null,
        ativo: formData.ativo,
        app_instalado: editingPaciente?.app_instalado ?? true,
      };
      if (isUuid) submitData.id_prefeitura = idPrefeitura;

      if (editingId != null) {
        const pacienteId = String(editingId);
        await api.put(`/pacientes?id=${encodeURIComponent(pacienteId)}`, submitData as Record<string, string | boolean | null>);
        if (selectedPacienteId != null && (celularFormData.marca.trim() || celularFormData.modelo.trim() || celularFormData.numero_contato.trim())) {
          const celularPayload = {
            id_paciente: selectedPacienteId,
            modelo: celularFormData.modelo.trim() || ' ',
            marca: celularFormData.marca.trim() || ' ',
            numero_serie: celularFormData.numero_serie.trim() || null,
            numero_contato: celularFormData.numero_contato.trim(),
            tipo_celular: celularFormData.tipo_celular,
            nome_cuidador: celularFormData.tipo_celular === 'cuidador' ? celularFormData.nome_cuidador.trim() || null : null,
            ativo: celularFormData.ativo,
          };
          if (celularFormData.id) {
            await api.put(`/paciente-celulares?id=${celularFormData.id}`, celularPayload);
          } else {
            await api.post('/paciente-celulares', celularPayload);
          }
        }
        toast.success('Paciente e celular atualizados com sucesso');
        setDialogOpen(false);
        resetForm();
        resetCelularForm();
        fetchPacientes();
        refetchCelulares();
      } else {
        const novoPaciente = await api.post<Paciente & { a004_id_paciente?: string; a004_nome?: string }>('/pacientes', submitData);
        toast.success('Paciente cadastrado com sucesso');
        setDialogOpen(false);
        resetForm();
        fetchPacientes();
        const idPaciente = novoPaciente.id ?? novoPaciente.a004_id_paciente ?? null;
        setSelectedPacienteId(idPaciente);
        setSelectedPacienteNome(novoPaciente.nome ?? novoPaciente.a004_nome ?? '');
        pendingCelularPacienteIdRef.current = idPaciente;
        setCelularFormData({
          ...celularFormData,
          numero_contato: formData.celular || '',
        });
        setCelularDialogOpen(true);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro ao salvar paciente';
      toast.error(errorMessage);
    }
  };

  const handleCelularSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idPaciente = selectedPacienteId ?? pendingCelularPacienteIdRef.current;
    if (!idPaciente) {
      toast.error('ID do paciente não encontrado');
      return;
    }

    if (!celularFormData.modelo.trim()) {
      toast.error('Modelo é obrigatório');
      return;
    }

    if (!celularFormData.marca.trim()) {
      toast.error('Marca é obrigatória');
      return;
    }

    if (!celularFormData.numero_contato.trim()) {
      toast.error('Número de contato é obrigatório');
      return;
    }

    if (celularFormData.tipo_celular === 'cuidador' && !celularFormData.nome_cuidador.trim()) {
      toast.error('Nome do cuidador é obrigatório quando o tipo é "Cuidador"');
      return;
    }

    try {
      const submitData = {
        id_paciente: idPaciente,
        modelo: celularFormData.modelo.trim(),
        marca: celularFormData.marca.trim(),
        numero_serie: celularFormData.numero_serie.trim() || null,
        numero_contato: celularFormData.numero_contato.trim(),
        tipo_celular: celularFormData.tipo_celular,
        nome_cuidador: celularFormData.tipo_celular === 'cuidador' ? celularFormData.nome_cuidador.trim() : null,
        ativo: celularFormData.ativo,
      };

      if (celularFormData.id) {
        await api.put(`/paciente-celulares?id=${celularFormData.id}`, submitData);
        toast.success('Celular atualizado com sucesso');
      } else {
        await api.post('/paciente-celulares', submitData);
        toast.success('Celular cadastrado com sucesso');
      }
      
      setCelularDialogOpen(false);
      resetCelularForm();
      refetchCelulares();
      fetchPacientes();
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro ao salvar celular';
      toast.error(errorMessage);
    }
  };

  const handleSkipCelular = () => {
    setCelularDialogOpen(false);
    resetCelularForm();
    toast.info('Você pode cadastrar o celular depois na tela de Celulares');
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm('Deseja realmente desativar este paciente?')) return;

    try {
      await api.delete(`/pacientes?id=${encodeURIComponent(String(id))}`);
      toast.success('Paciente desativado com sucesso');
      fetchPacientes();
    } catch (error) {
      toast.error('Erro ao desativar paciente');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
      resetCelularForm();
    }
  };

  const handleCelularDialogClose = (open: boolean) => {
    setCelularDialogOpen(open);
    if (!open) {
      resetCelularForm();
    }
  };

  const filteredPacientes = pacientes.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cartao_sus.includes(searchTerm)
  );

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Pacientes</h1>
            <p className="text-muted-foreground">
              Gerencie os pacientes cadastrados no sistema
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Editar Paciente' : 'Cadastrar Paciente'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? 'Atualize os dados do paciente'
                      : 'Preencha os dados do novo paciente'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cartao_sus">Cartão SUS *</Label>
                    <Input
                      id="cartao_sus"
                      value={formData.cartao_sus}
                      onChange={(e) => setFormData({ ...formData, cartao_sus: e.target.value })}
                      required
                      maxLength={20}
                      placeholder="Apenas números"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cpf">CPF (11 dígitos)</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      maxLength={11}
                      placeholder="Apenas números"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="celular">Celular</Label>
                    <Input
                      id="celular"
                      value={formData.celular}
                      onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                      maxLength={20}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ativo" className="cursor-pointer">
                      Status do Paciente
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {formData.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      <Switch
                        id="ativo"
                        checked={formData.ativo}
                        onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                      />
                    </div>
                  </div>
                  {editingId && selectedPacienteId && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Dados do celular
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Marca</Label>
                            <Input
                              value={celularFormData.marca}
                              onChange={(e) => setCelularFormData({ ...celularFormData, marca: e.target.value })}
                              placeholder="Ex: Samsung"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Modelo</Label>
                            <Input
                              value={celularFormData.modelo}
                              onChange={(e) => setCelularFormData({ ...celularFormData, modelo: e.target.value })}
                              placeholder="Ex: Galaxy S21"
                            />
                          </div>
                          <div className="grid gap-2 col-span-2">
                            <Label>Número de contato</Label>
                            <Input
                              value={celularFormData.numero_contato}
                              onChange={(e) => setCelularFormData({ ...celularFormData, numero_contato: e.target.value })}
                              placeholder="(00) 00000-0000"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingId ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={celularDialogOpen} onOpenChange={handleCelularDialogClose}>
          <DialogContent className="sm:max-w-[550px]">
            <form onSubmit={handleCelularSubmit}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  {celularFormData.id ? 'Editar Celular do Paciente' : 'Cadastrar Celular do Paciente'}
                </DialogTitle>
                <DialogDescription>
                  {celularFormData.id ? 'Atualize os dados do celular' : 'Vincule um celular'} ao paciente <strong>{selectedPacienteNome}</strong>
                </DialogDescription>
              </DialogHeader>
              {loadingCelular ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="marca">Marca *</Label>
                      <Input
                        id="marca"
                        value={celularFormData.marca}
                        onChange={(e) => setCelularFormData({ ...celularFormData, marca: e.target.value })}
                        placeholder="Ex: Samsung, Apple, Motorola"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="modelo">Modelo *</Label>
                      <Input
                        id="modelo"
                        value={celularFormData.modelo}
                        onChange={(e) => setCelularFormData({ ...celularFormData, modelo: e.target.value })}
                        placeholder="Ex: Galaxy S21, iPhone 12"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="numero_serie">Número de Série</Label>
                    <Input
                      id="numero_serie"
                      value={celularFormData.numero_serie}
                      onChange={(e) => setCelularFormData({ ...celularFormData, numero_serie: e.target.value })}
                      placeholder="Número de série do aparelho (opcional)"
                      maxLength={100}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="numero_contato">Número de Contato *</Label>
                    <Input
                      id="numero_contato"
                      value={celularFormData.numero_contato}
                      onChange={(e) => setCelularFormData({ ...celularFormData, numero_contato: e.target.value })}
                      placeholder="(00) 00000-0000"
                      maxLength={20}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tipo_celular">Tipo de Celular *</Label>
                    <Select
                      value={celularFormData.tipo_celular}
                      onValueChange={(value: 'proprio' | 'cuidador') => 
                        setCelularFormData({ ...celularFormData, tipo_celular: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proprio">Próprio</SelectItem>
                        <SelectItem value="cuidador">Cuidador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {celularFormData.tipo_celular === 'cuidador' && (
                    <div className="grid gap-2">
                      <Label htmlFor="nome_cuidador">Nome do Cuidador *</Label>
                      <Input
                        id="nome_cuidador"
                        value={celularFormData.nome_cuidador}
                        onChange={(e) => setCelularFormData({ ...celularFormData, nome_cuidador: e.target.value })}
                        placeholder="Nome completo do cuidador"
                        maxLength={200}
                        required={celularFormData.tipo_celular === 'cuidador'}
                      />
                    </div>
                  )}

                  {celularFormData.id && (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="celular_ativo" className="cursor-pointer">
                        Status do Celular
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {celularFormData.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <Switch
                          id="celular_ativo"
                          checked={celularFormData.ativo}
                          onCheckedChange={(checked) => setCelularFormData({ ...celularFormData, ativo: checked })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter className="gap-2">
                {!celularFormData.id && (
                  <Button type="button" variant="outline" onClick={handleSkipCelular}>
                    Pular
                  </Button>
                )}
                <Button type="submit" disabled={loadingCelular}>
                  {celularFormData.id ? 'Atualizar Celular' : 'Cadastrar Celular'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md flex items-center rounded-full bg-muted/80 shadow-sm border border-border/50 overflow-hidden">
                <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-muted">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nome ou cartão SUS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-0 h-10 px-3 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cartão SUS</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Data Nasc.</TableHead>
                  <TableHead>Celular (paciente)</TableHead>
                  <TableHead>Marca (celular)</TableHead>
                  <TableHead>Modelo (celular)</TableHead>
                  <TableHead>Nº Contato (celular)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPacientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      Nenhum paciente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPacientes.map((paciente) => {
                    const celular = celularesPorPaciente[paciente.id];
                    return (
                      <TableRow key={paciente.id}>
                        <TableCell className="font-medium">{paciente.nome}</TableCell>
                        <TableCell>{paciente.cartao_sus}</TableCell>
                        <TableCell>{paciente.cpf || '-'}</TableCell>
                        <TableCell>{paciente.data_nascimento ? new Date(paciente.data_nascimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                        <TableCell>{paciente.celular || '-'}</TableCell>
                        <TableCell>{celular?.marca || '-'}</TableCell>
                        <TableCell>{celular?.modelo || '-'}</TableCell>
                        <TableCell>{celular?.numero_contato || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={paciente.ativo ? 'default' : 'secondary'}>
                            {paciente.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(paciente)}
                              title="Editar paciente e celular"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" title="Mais ações">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenCelularDialog(paciente)}>
                                  <Smartphone className="mr-2 h-4 w-4" />
                                  {celular ? 'Editar Celular' : 'Cadastrar Celular'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(paciente.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Desativar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
