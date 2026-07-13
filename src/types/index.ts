export interface Produto {
  id: string;
  nome: string;
  preco: number;
  imagem: string;
  categoria: string;
  valorAnterior?: number;
  desconto?: number;
  descricao?: string;
  tamanhoVaso?: string;
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}
