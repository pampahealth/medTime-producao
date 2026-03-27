export interface ReceitaResposta {
  data_receita: string | null;
  cartao_sus: string;
  nome_paciente: string;
  medicamentos: Array<{
    nome_medicamento: string;
    nome_imagem_medicamento: string;
    imagem_medicamento: string;
  }>;
}
