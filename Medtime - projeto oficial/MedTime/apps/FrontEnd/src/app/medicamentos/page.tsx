
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { upload } from '@zoerai/integration';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, X, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { Medicamento } from '@/types/medtime';

export default function MedicamentosPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    principio_ativo: '',
    concentracao: '',
    forma_farmaceutica: '',
    id_prefeitura: '1',
    imagem_url: '',
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMedicamento, setEditingMedicamento] = useState<Medicamento | null>(null);

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.push('/meus-medicamentos');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchMedicamentos();
    }
  }, [user, showInactive]);

  const fetchMedicamentos = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { limit: '100' };
      if (showInactive) {
        params.showInactive = 'true';
      }
      const data = await api.get<Medicamento[]>('/medicamentos', params);
      setMedicamentos(data || []);
    } catch (error) {
      toast.error('Erro ao carregar medicamentos');
    } finally {
      setLoading(false);
    }
  };

  const maxImageSize = 5 * 1024 * 1024; // 5MB
  const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  /** Lê arquivo da máquina e define como imagem (base64 data URL) */
  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!allowedImageTypes.includes(file.type)) {
      toast.error('Use PNG, JPG ou WebP (máx. 5MB)');
      e.target.value = '';
      return;
    }
    if (file.size > maxImageSize) {
      toast.error('A imagem deve ter no máximo 5MB');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFormData((prev) => ({ ...prev, imagem_url: dataUrl }));
      setImagePreview(dataUrl);
      toast.success('Imagem selecionada');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem (PNG, JPG ou WebP)');
      return;
    }

    if (file.size > maxImageSize) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const result = await upload.uploadWithPresignedUrl(file, {
        maxSize: maxImageSize,
        allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp'],
        onProgress: (progress) => setUploadProgress(progress),
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao fazer upload da imagem');
      }

      setFormData((prev) => ({ ...prev, imagem_url: result.url || '' }));
      setImagePreview(result.url || null);
      toast.success('Imagem carregada com sucesso');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imagem_url: '' });
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/medicamentos', formData);
      toast.success('Medicamento cadastrado com sucesso');
      setDialogOpen(false);
      setFormData({
        nome: '',
        descricao: '',
        principio_ativo: '',
        concentracao: '',
        forma_farmaceutica: '',
        id_prefeitura: '1',
        imagem_url: '',
      });
      setImagePreview(null);
      fetchMedicamentos();
    } catch (error: unknown) {
      const msg = error instanceof ApiError
        ? error.errorMessage
        : error && typeof error === 'object' && 'message' in error
          ? String((error as Error).message)
          : 'Erro ao cadastrar medicamento';
      toast.error(msg);
    }
  };

  const handleEdit = (medicamento: Medicamento) => {
    setEditingMedicamento(medicamento);
    setFormData({
      nome: medicamento.nome,
      descricao: medicamento.descricao || '',
      principio_ativo: medicamento.principio_ativo || '',
      concentracao: medicamento.concentracao || '',
      forma_farmaceutica: medicamento.forma_farmaceutica || '',
      id_prefeitura: String(medicamento.id_prefeitura),
      imagem_url: medicamento.imagem_url || '',
    });
    setImagePreview(medicamento.imagem_url || null);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedicamento) return;
    try {
      await api.put(`/medicamentos?id=${editingMedicamento.id}`, {
        nome: formData.nome,
        descricao: formData.descricao || null,
        principio_ativo: formData.principio_ativo || null,
        concentracao: formData.concentracao || null,
        forma_farmaceutica: formData.forma_farmaceutica || null,
        imagem_url: formData.imagem_url || null,
      });
      toast.success('Medicamento atualizado com sucesso');
      setEditDialogOpen(false);
      setEditingMedicamento(null);
      fetchMedicamentos();
    } catch (error) {
      toast.error('Erro ao atualizar medicamento');
    }
  };

  const handleToggleStatus = async (id: number | string, currentStatus: boolean) => {
    try {
      await api.put(`/medicamentos?id=${id}`, { ativo: !currentStatus });
      toast.success(
        currentStatus 
          ? 'Medicamento desativado com sucesso' 
          : 'Medicamento reativado com sucesso'
      );
      fetchMedicamentos();
    } catch (error) {
      toast.error('Erro ao alterar status do medicamento');
    }
  };

  const filteredMedicamentos = medicamentos.filter(m =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.principio_ativo?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold mb-2">Medicamentos</h1>
            <p className="text-muted-foreground">
              Gerencie o catálogo de medicamentos
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Medicamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Cadastrar Medicamento</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo medicamento
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Imagem do Medicamento</Label>
                    <div className="flex flex-col gap-3">
                      <Input
                        placeholder="URL da imagem"
                        value={formData.imagem_url.startsWith('data:') ? '' : formData.imagem_url}
                        onChange={(e) => {
                          const url = e.target.value;
                          setFormData((prev) => ({ ...prev, imagem_url: url }));
                          setImagePreview(url || null);
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Ou selecione um arquivo da sua máquina (PNG, JPG ou WebP, máx. 5MB)
                      </p>
                      <Input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                        onChange={handleLocalImageSelect}
                        className="cursor-pointer"
                      />
                      {imagePreview ? (
                        <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-muted">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={handleRemoveImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-muted/50">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="principio_ativo">Princípio Ativo</Label>
                    <Input
                      id="principio_ativo"
                      value={formData.principio_ativo}
                      onChange={(e) => setFormData({ ...formData, principio_ativo: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="concentracao">Concentração</Label>
                    <Input
                      id="concentracao"
                      value={formData.concentracao}
                      onChange={(e) => setFormData({ ...formData, concentracao: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="forma_farmaceutica">Forma Farmacêutica</Label>
                    <Input
                      id="forma_farmaceutica"
                      value={formData.forma_farmaceutica}
                      onChange={(e) => setFormData({ ...formData, forma_farmaceutica: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    Cadastrar
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
                    placeholder="Buscar por nome ou princípio ativo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-0 h-10 px-3 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showInactive"
                  checked={showInactive}
                  onCheckedChange={(checked) => setShowInactive(checked as boolean)}
                />
                <label
                  htmlFor="showInactive"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Mostrar medicamentos inativos
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Princípio Ativo</TableHead>
                  <TableHead>Concentração</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Nenhum medicamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMedicamentos.map((medicamento) => (
                    <TableRow key={medicamento.id} className={!medicamento.ativo ? 'opacity-60' : ''}>
                      <TableCell>
                        {medicamento.imagem_url ? (
                          <img
                            src={medicamento.imagem_url}
                            alt={medicamento.nome}
                            className="w-12 h-12 object-contain rounded border"
                          />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-muted rounded border">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{medicamento.nome}</TableCell>
                      <TableCell className="max-w-[180px] truncate" title={medicamento.descricao || ''}>
                        {medicamento.descricao || '-'}
                      </TableCell>
                      <TableCell>{medicamento.principio_ativo || '-'}</TableCell>
                      <TableCell>{medicamento.concentracao || '-'}</TableCell>
                      <TableCell>{medicamento.forma_farmaceutica || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={medicamento.ativo ? 'default' : 'secondary'}>
                          {medicamento.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(medicamento)}
                            title="Editar medicamento"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {medicamento.ativo ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(medicamento.id, medicamento.ativo)}
                              title="Desativar medicamento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(medicamento.id, medicamento.ativo)}
                              title="Reativar medicamento"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingMedicamento(null);
            setImagePreview(null);
          }
        }}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Editar Medicamento</DialogTitle>
                <DialogDescription>Altere os dados do medicamento</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Imagem</Label>
                  <Input
                    placeholder="URL da imagem"
                    value={formData.imagem_url.startsWith('data:') ? '' : formData.imagem_url}
                    onChange={(e) => {
                      const url = e.target.value;
                      setFormData((prev) => ({ ...prev, imagem_url: url }));
                      setImagePreview(url || null);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ou selecione um arquivo da sua máquina (PNG, JPG ou WebP, máx. 5MB)
                  </p>
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                    onChange={handleLocalImageSelect}
                    className="cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="relative w-full h-36 border rounded-lg overflow-hidden bg-muted">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Princípio Ativo</Label>
                    <Input
                      value={formData.principio_ativo}
                      onChange={(e) => setFormData({ ...formData, principio_ativo: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Concentração</Label>
                    <Input
                      value={formData.concentracao}
                      onChange={(e) => setFormData({ ...formData, concentracao: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Forma Farmacêutica</Label>
                  <Input
                    value={formData.forma_farmaceutica}
                    onChange={(e) => setFormData({ ...formData, forma_farmaceutica: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
