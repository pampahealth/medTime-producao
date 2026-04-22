
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit, Trash2, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

interface Medico {
  id: number;
  user_id: number;
  nome: string;
  crm: string;
  especialidade: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function MedicosPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [exibirInativos, setExibirInativos] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    crm: '',
    especialidade: '',
    ativo: true,
  });

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.push('/meus-medicamentos');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchMedicos();
    }
  }, [user]);

  const fetchMedicos = async () => {
    try {
      setLoading(true);
      const data = await api.get<Medico[]>('/medicos', { limit: '100' });
      setMedicos(data || []);
    } catch (error) {
      toast.error('Erro ao carregar médicos');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      crm: '',
      especialidade: '',
      ativo: true,
    });
    setEditingId(null);
  };

  const handleEdit = (medico: Medico) => {
    setFormData({
      nome: medico.nome,
      crm: medico.crm,
      especialidade: medico.especialidade,
      ativo: medico.ativo,
    });
    setEditingId(medico.id);
    setDialogOpen(true);
  };

  const validateCRM = (crm: string): boolean => {
    const cleanCRM = crm.replace(/\D/g, '');
    return cleanCRM.length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCRM(formData.crm)) {
      toast.error('CRM inválido');
      return;
    }

    try {
      const submitData = {
        ...formData,
        crm: formData.crm.replace(/\D/g, ''),
      };

      if (editingId) {
        await api.put(`/medicos?id=${editingId}`, submitData);
        toast.success('Médico atualizado com sucesso');
      } else {
        await api.post('/medicos', submitData);
        toast.success('Médico cadastrado com sucesso');
      }

      setDialogOpen(false);
      resetForm();
      fetchMedicos();
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro ao salvar médico';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente desativar este médico?')) return;

    try {
      await api.delete(`/medicos?id=${id}`);
      toast.success('Médico desativado com sucesso');
      fetchMedicos();
    } catch (error) {
      toast.error('Erro ao desativar médico');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const filteredMedicos = medicos.filter(m =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.crm.includes(searchTerm) ||
    (m.especialidade ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const medicosExibidos = exibirInativos
    ? filteredMedicos
    : filteredMedicos.filter(m => m.ativo);

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
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Médicos</h1>
            </div>
            <p className="text-muted-foreground">
              Gerencie os médicos cadastrados no sistema
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Médico
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Editar Médico' : 'Cadastrar Médico'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? 'Atualize os dados do médico'
                      : 'Preencha os dados do novo médico'}
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
                      placeholder="Dr. João Silva"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="crm">CRM *</Label>
                    <Input
                      id="crm"
                      value={formData.crm}
                      onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                      required
                      placeholder="123456"
                      maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground">
                      Apenas números
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="especialidade">Especialidade *</Label>
                    <Input
                      id="especialidade"
                      value={formData.especialidade}
                      onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                      required
                      placeholder="Cardiologia"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ativo" className="cursor-pointer">
                      Status do Médico
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
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-md flex items-center rounded-full bg-muted/80 shadow-sm border border-border/50 overflow-hidden">
                  <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-muted">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por nome, CRM ou especialidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-0 h-10 px-3 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    id="exibir-inativos"
                    checked={exibirInativos}
                    onCheckedChange={(checked) => setExibirInativos(checked === true)}
                  />
                  <span className="text-sm">Exibir usuários inativos</span>
                </label>
                <span className="text-sm text-muted-foreground">
                  {medicosExibidos.length} médico{medicosExibidos.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CRM</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicosExibidos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum médico encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  medicosExibidos.map((medico) => (
                    <TableRow key={medico.id}>
                      <TableCell className="font-medium">{medico.nome}</TableCell>
                      <TableCell>{medico.crm}</TableCell>
                      <TableCell>{medico.especialidade}</TableCell>
                      <TableCell>
                        <Badge variant={medico.ativo ? 'default' : 'secondary'}>
                          {medico.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(medico)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(medico.id)}
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
