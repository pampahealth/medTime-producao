
'use client';

import { useEffect, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit, Trash2, Smartphone, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Paciente } from '@/types/medtime';

interface PacienteCelular {
  id: number;
  user_id: number;
  id_paciente: number;
  modelo: string;
  marca: string;
  numero_serie: string | null;
  numero_contato: string;
  tipo_celular: 'proprio' | 'cuidador';
  nome_cuidador: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface PacienteCelularWithPaciente extends PacienteCelular {
  paciente_nome?: string;
}

export default function PacienteCelularesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [celulares, setCelulares] = useState<PacienteCelularWithPaciente[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pacienteComboboxOpen, setPacienteComboboxOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    id_paciente: '',
    modelo: '',
    marca: '',
    numero_serie: '',
    numero_contato: '',
    tipo_celular: 'proprio' as 'proprio' | 'cuidador',
    nome_cuidador: '',
    ativo: true,
  });

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.push('/meus-medicamentos');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [celularesResult, pacientesResult] = await Promise.allSettled([
      api.get<PacienteCelular[]>('/paciente-celulares', { limit: '100' }),
      api.get<Paciente[]>('/pacientes', { limit: '100' }),
    ]);

    const celularesRaw = celularesResult.status === 'fulfilled' ? celularesResult.value : undefined;
    const pacientesRaw = pacientesResult.status === 'fulfilled' ? pacientesResult.value : undefined;
    const celularesData = Array.isArray(celularesRaw) ? celularesRaw : [];
    const pacientesList = Array.isArray(pacientesRaw)
      ? pacientesRaw
      : pacientesRaw && typeof pacientesRaw === 'object' && Array.isArray((pacientesRaw as { data?: unknown }).data)
        ? (pacientesRaw as { data: Paciente[] }).data
        : [];

    if (celularesResult.status === 'rejected') {
      toast.error('Erro ao carregar celulares');
    }
    if (pacientesResult.status === 'rejected') {
      toast.error('Erro ao carregar lista de pacientes. Verifique se o proxy do backend está ativo (USE_BACKEND_PROXY).');
    }

    const celularesWithNames = celularesData.map((cel) => {
      const paciente = pacientesList.find((p) => String(p.id) === String(cel.id_paciente));
      return {
        ...cel,
        paciente_nome: paciente?.nome ?? 'Paciente não encontrado',
      };
    });

    setCelulares(celularesWithNames);
    setPacientes(pacientesList);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      id_paciente: '',
      modelo: '',
      marca: '',
      numero_serie: '',
      numero_contato: '',
      tipo_celular: 'proprio',
      nome_cuidador: '',
      ativo: true,
    });
    setEditingId(null);
  };

  const handleEdit = (celular: PacienteCelularWithPaciente) => {
    setFormData({
      id_paciente: celular.id_paciente.toString(),
      modelo: celular.modelo,
      marca: celular.marca,
      numero_serie: celular.numero_serie || '',
      numero_contato: celular.numero_contato,
      tipo_celular: celular.tipo_celular,
      nome_cuidador: celular.nome_cuidador || '',
      ativo: celular.ativo,
    });
    setEditingId(celular.id);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id_paciente) {
      toast.error('Selecione um paciente');
      return;
    }

    if (!formData.modelo.trim()) {
      toast.error('Modelo é obrigatório');
      return;
    }

    if (!formData.marca.trim()) {
      toast.error('Marca é obrigatória');
      return;
    }

    if (!formData.numero_contato.trim()) {
      toast.error('Número de contato é obrigatório');
      return;
    }

    if (formData.tipo_celular === 'cuidador' && !formData.nome_cuidador.trim()) {
      toast.error('Nome do cuidador é obrigatório quando o tipo é "Cuidador"');
      return;
    }

    try {
      const idPacienteRaw = String(formData.id_paciente).trim();
      const idPaciente = /^\d+$/.test(idPacienteRaw) ? parseInt(idPacienteRaw, 10) : idPacienteRaw;
      const submitData = {
        id_paciente: idPaciente,
        modelo: formData.modelo.trim(),
        marca: formData.marca.trim(),
        numero_serie: formData.numero_serie.trim() || null,
        numero_contato: formData.numero_contato.trim(),
        tipo_celular: formData.tipo_celular,
        nome_cuidador: formData.tipo_celular === 'cuidador' ? formData.nome_cuidador.trim() : null,
        ativo: formData.ativo,
      };

      if (editingId) {
        await api.put(`/paciente-celulares?id=${editingId}`, submitData);
        toast.success('Celular atualizado com sucesso');
      } else {
        await api.post('/paciente-celulares', submitData);
        toast.success('Celular cadastrado com sucesso');
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro ao salvar celular';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm('Deseja realmente excluir este contato? Os dados do telefone serão removidos.')) return;

    try {
      await api.delete(`/paciente-celulares?id=${encodeURIComponent(String(id))}`);
      toast.success('Contato excluído com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir contato');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const filteredCelulares = celulares.filter(c =>
    c.paciente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.numero_contato.includes(searchTerm)
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
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Smartphone className="h-8 w-8" />
              Celulares dos Pacientes
            </h1>
            <p className="text-muted-foreground">
              Gerencie os aparelhos celulares vinculados aos pacientes
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Celular
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Editar Celular' : 'Cadastrar Celular'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? 'Atualize os dados do celular do paciente'
                      : 'Vincule um novo celular ao paciente'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Paciente *</Label>
                    <Popover open={pacienteComboboxOpen} onOpenChange={setPacienteComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={pacienteComboboxOpen}
                          className={cn(
                            'w-full justify-between font-normal',
                            !formData.id_paciente && 'text-muted-foreground'
                          )}
                        >
                          {formData.id_paciente
                            ? (() => {
                                const p = pacientes.find(
                                  (x) => String(x.id) === String(formData.id_paciente)
                                );
                                return p ? `${p.nome} - ${p.cartao_sus}` : formData.id_paciente;
                              })()
                            : 'Selecione o paciente'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command
                          filter={(value, search) => {
                            const s = String(search ?? '').trim().toLowerCase();
                            if (!s) return 1;
                            const nome = String(value ?? '').toLowerCase();
                            return nome.includes(s) ? 1 : 0;
                          }}
                        >
                          <CommandInput placeholder="Buscar por nome ou Cartão SUS..." />
                          <CommandList>
                            <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                            <CommandGroup>
                              {pacientes
                                .filter((p) => p.ativo !== false)
                                .map((paciente) => {
                                  const value = `${paciente.nome} ${paciente.cartao_sus}`;
                                  return (
                                    <CommandItem
                                      key={String(paciente.id)}
                                      value={value}
                                      onSelect={() => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          id_paciente: String(paciente.id),
                                        }));
                                        setPacienteComboboxOpen(false);
                                      }}
                                    >
                                      {paciente.nome} - {paciente.cartao_sus}
                                    </CommandItem>
                                  );
                                })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="marca">Marca *</Label>
                      <Input
                        id="marca"
                        value={formData.marca}
                        onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                        placeholder="Ex: Samsung, Apple, Motorola"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="modelo">Modelo *</Label>
                      <Input
                        id="modelo"
                        value={formData.modelo}
                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                        placeholder="Ex: Galaxy S21, iPhone 12"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="numero_serie">Número de Série</Label>
                    <Input
                      id="numero_serie"
                      value={formData.numero_serie}
                      onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                      placeholder="Número de série do aparelho (opcional)"
                      maxLength={100}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="numero_contato">Número de Contato *</Label>
                    <Input
                      id="numero_contato"
                      value={formData.numero_contato}
                      onChange={(e) => setFormData({ ...formData, numero_contato: e.target.value })}
                      placeholder="(00) 00000-0000"
                      maxLength={20}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tipo_celular">Tipo de Celular *</Label>
                    <Select
                      value={formData.tipo_celular}
                      onValueChange={(value: 'proprio' | 'cuidador') => 
                        setFormData({ ...formData, tipo_celular: value })
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

                  {formData.tipo_celular === 'cuidador' && (
                    <div className="grid gap-2">
                      <Label htmlFor="nome_cuidador">Nome do Cuidador *</Label>
                      <Input
                        id="nome_cuidador"
                        value={formData.nome_cuidador}
                        onChange={(e) => setFormData({ ...formData, nome_cuidador: e.target.value })}
                        placeholder="Nome completo do cuidador"
                        maxLength={200}
                        required={formData.tipo_celular === 'cuidador'}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label htmlFor="ativo" className="cursor-pointer">
                      Status do Celular
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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md flex items-center rounded-full bg-muted/80 shadow-sm border border-border/50 overflow-hidden">
                <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-muted">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por paciente, modelo, marca ou número..."
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
                  <TableHead>Paciente</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Número de Contato</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cuidador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCelulares.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhum celular cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCelulares.map((celular) => (
                    <TableRow key={celular.id}>
                      <TableCell className="font-medium">{celular.paciente_nome}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{celular.marca}</span>
                          <span className="text-sm text-muted-foreground">{celular.modelo}</span>
                        </div>
                      </TableCell>
                      <TableCell>{celular.numero_contato}</TableCell>
                      <TableCell>
                        <Badge variant={celular.tipo_celular === 'proprio' ? 'default' : 'secondary'}>
                          {celular.tipo_celular === 'proprio' ? 'Próprio' : 'Cuidador'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {celular.tipo_celular === 'cuidador' ? celular.nome_cuidador : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={celular.ativo ? 'default' : 'secondary'}>
                          {celular.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(celular)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(celular.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
