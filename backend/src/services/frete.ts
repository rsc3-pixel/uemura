// Regras de frete centralizadas. Usadas tanto pela rota POST /api/frete (cotacao
// exibida na sacola) quanto pela rota POST /api/pedidos (recalculo no fechamento).
//
// O pedido NUNCA aceita o valor de frete enviado pelo cliente: ele recebe apenas o
// id da opcao escolhida e recalcula a tarifa aqui. Caso contrario bastaria editar o
// body no console do navegador para zerar o frete.

// Item cru vindo do request (usado apenas na cotacao POST /api/frete).
export interface ItemCarrinho {
  quantidade: number;
  produto: {
    id: string;
    categoria?: string;
  };
}

// Item ja resolvido: categoria e quantidade confiaveis. A rota de pedidos monta
// isto a partir do banco, para nao confiar na categoria enviada pelo cliente.
export interface ItemFrete {
  categoria: string;
  quantidade: number;
}

export interface OpcaoFrete {
  id: string;
  nome: string;
  preco: number;
  prazo: string;
  descricao: string;
}

export type ResultadoFrete =
  | { ok: true; tipo: 'local' | 'correios'; opcoes: OpcaoFrete[] }
  | { ok: false; error: string };

const CATEGORIA_PLANTA_VIVA = 'Flores e Plantas';

// Tarifas por regiao, indexadas pelo primeiro digito do CEP.
const TARIFAS_POR_REGIAO = [
  { digitos: ['0', '1'], pac: 14.50, sedex: 19.90, prazoPac: '3 a 5 dias úteis', prazoSedex: '1 a 2 dias úteis' },
  { digitos: ['2', '3'], pac: 18.90, sedex: 27.20, prazoPac: '5 a 7 dias úteis', prazoSedex: '2 a 3 dias úteis' },
  { digitos: ['4', '5', '6'], pac: 32.50, sedex: 59.80, prazoPac: '8 a 12 dias úteis', prazoSedex: '4 a 6 dias úteis' },
  { digitos: ['7'], pac: 26.80, sedex: 47.90, prazoPac: '7 a 10 dias úteis', prazoSedex: '4 a 5 dias úteis' },
  { digitos: ['8', '9'], pac: 23.50, sedex: 38.90, prazoPac: '6 a 9 dias úteis', prazoSedex: '3 a 4 dias úteis' },
];

const TARIFA_PADRAO = { pac: 18.90, sedex: 26.40, prazoPac: '5 a 8 dias úteis', prazoSedex: '2 a 4 dias úteis' };

const PESO_KG_POR_CATEGORIA: Record<string, number> = {
  'Vasos': 2.5,
};
const PESO_KG_PADRAO = 0.8;
const FAIXA_PESO_LIVRE_KG = 2;
const TAXA_POR_KG_EXTRA = 3.50;

export const ERRO_PLANTA_FORA_DE_SP =
  'Plantas vivas são despachadas apenas para a Grande São Paulo por motivos de integridade e saúde da espécie. ' +
  'Remova as plantas da sacola para liberar o envio via Correios (PAC/SEDEX) para o seu endereço.';

const somenteDigitos = (cep: string) => String(cep).replace(/\D/g, '');

// Converte itens crus do request em itens de frete. So para a COTACAO, onde a
// categoria informada pelo cliente e aceitavel (nao ha dinheiro em jogo ainda).
export const itensCarrinhoParaFrete = (itens: ItemCarrinho[]): ItemFrete[] =>
  itens.map((item) => ({
    categoria: item.produto.categoria ?? '',
    quantidade: item.quantidade
  }));

const calcularPesoTotalKg = (itens: ItemFrete[]) =>
  itens.reduce((peso, item) => {
    const pesoUnitario = PESO_KG_POR_CATEGORIA[item.categoria] ?? PESO_KG_PADRAO;
    return peso + pesoUnitario * item.quantidade;
  }, 0);

export const calcularOpcoesFrete = (cepBruto: string, itens: ItemFrete[]): ResultadoFrete => {
  const cep = somenteDigitos(cepBruto);

  if (cep.length !== 8) {
    return { ok: false, error: 'CEP de destino invalido. Informe os 8 digitos.' };
  }

  const contemPlantasVivas = itens.some((item) => item.categoria === CATEGORIA_PLANTA_VIVA);
  const isGrandeSP = cep.startsWith('0');

  if (contemPlantasVivas) {
    if (!isGrandeSP) {
      return { ok: false, error: ERRO_PLANTA_FORA_DE_SP };
    }

    return {
      ok: true,
      tipo: 'local',
      opcoes: [
        {
          id: 'moto_uemura',
          nome: 'Entrega Expressa Uemura (Motoboy)',
          preco: 15.00,
          prazo: 'Mesmo dia ou dia útil seguinte',
          descricao: 'Flores e plantas transportadas em suportes verticais seguros.'
        }
      ]
    };
  }

  const tarifa = TARIFAS_POR_REGIAO.find((t) => t.digitos.includes(cep.charAt(0))) ?? TARIFA_PADRAO;

  const pesoTotalKg = calcularPesoTotalKg(itens);
  const pesoExcedente = Math.max(0, pesoTotalKg - FAIXA_PESO_LIVRE_KG);
  const taxaPesoExtra = pesoExcedente * TAXA_POR_KG_EXTRA;

  return {
    ok: true,
    tipo: 'correios',
    opcoes: [
      {
        id: 'correios_pac',
        nome: 'Correios PAC',
        preco: Number((tarifa.pac + taxaPesoExtra).toFixed(2)),
        prazo: tarifa.prazoPac,
        descricao: 'Entrega econômica dos Correios com código de rastreamento.'
      },
      {
        id: 'correios_sedex',
        nome: 'Correios SEDEX',
        preco: Number((tarifa.sedex + taxaPesoExtra).toFixed(2)),
        prazo: tarifa.prazoSedex,
        descricao: 'Entrega rápida expressa dos Correios.'
      }
    ]
  };
};
