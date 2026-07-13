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
// ESTIMATIVAS enquanto nao ha integracao oficial dos Correios (ver buscarFreteCorreios
// abaixo). Prazos calibrados por experiencia real: o SEDEX chega em poucos dias mesmo
// para o Nordeste; o PAC e o servico lento. Quando a Uemura tiver contrato, a API real
// substitui estes numeros.
const TARIFAS_POR_REGIAO = [
  { digitos: ['0', '1'], pac: 14.50, sedex: 19.90, prazoPac: '2 a 4 dias úteis', prazoSedex: '1 a 2 dias úteis' },
  { digitos: ['2', '3'], pac: 18.90, sedex: 27.20, prazoPac: '3 a 6 dias úteis', prazoSedex: '1 a 3 dias úteis' },
  { digitos: ['4', '5', '6'], pac: 32.50, sedex: 59.80, prazoPac: '5 a 9 dias úteis', prazoSedex: '2 a 4 dias úteis' },
  { digitos: ['7'], pac: 26.80, sedex: 47.90, prazoPac: '4 a 8 dias úteis', prazoSedex: '2 a 4 dias úteis' },
  { digitos: ['8', '9'], pac: 23.50, sedex: 38.90, prazoPac: '4 a 7 dias úteis', prazoSedex: '2 a 3 dias úteis' },
];

const TARIFA_PADRAO = { pac: 18.90, sedex: 26.40, prazoPac: '3 a 7 dias úteis', prazoSedex: '2 a 4 dias úteis' };

const PESO_KG_POR_CATEGORIA: Record<string, number> = {
  'Vasos': 2.5,
};
const PESO_KG_PADRAO = 0.8;
const FAIXA_PESO_LIVRE_KG = 2;
const TAXA_POR_KG_EXTRA = 3.50;

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

// ---------------------------------------------------------------------------
// PONTO DE INTEGRACAO com a API oficial dos Correios.
//
// Hoje o frete usa a tabela de estimativas acima. Quando a Uemura tiver contrato
// corporativo (Correios Facil), preencher estas variaveis de ambiente e implementar
// buscarFreteCorreios para chamar a API real de Precos e Prazos. As funcoes
// calcularOpcoesFrete ja estao prontas para consumir o resultado.
//
// Passos (ver docs/producao_real.md):
//   1. Obter usuario, senha e codigo de acesso no Portal Correios Facil.
//   2. Autenticar (OAuth2) e chamar a API de Precos e Prazos com CEP origem/destino,
//      peso e o codigo do servico contratado (SEDEX/PAC faturado).
//   3. Retornar { preco, prazo } por servico e alimentar opcaoPac/opcaoSedex com eles.
//
// const CORREIOS_USUARIO = process.env.CORREIOS_USUARIO;
// const CORREIOS_SENHA = process.env.CORREIOS_SENHA;
// const CORREIOS_CODIGO_ACESSO = process.env.CORREIOS_CODIGO_ACESSO;
//
// export async function buscarFreteCorreios(cepDestino: string, pesoKg: number):
//   Promise<{ pac: {preco: number, prazo: string}, sedex: {preco: number, prazo: string} }> {
//   // TODO: chamar a API oficial. Enquanto nao existe, o codigo usa a tabela estimada.
// }
// ---------------------------------------------------------------------------

// Monta a opcao de PAC para o CEP e peso informados.
const opcaoPac = (cep: string, taxaPesoExtra: number): OpcaoFrete => {
  const tarifa = TARIFAS_POR_REGIAO.find((t) => t.digitos.includes(cep.charAt(0))) ?? TARIFA_PADRAO;
  return {
    id: 'correios_pac',
    nome: 'Correios PAC',
    preco: Number((tarifa.pac + taxaPesoExtra).toFixed(2)),
    prazo: tarifa.prazoPac,
    descricao: 'Entrega econômica dos Correios com código de rastreamento.'
  };
};

// Monta a opcao de SEDEX. Aceita uma descricao alternativa para o caso de plantas vivas.
const opcaoSedex = (cep: string, taxaPesoExtra: number, descricao?: string): OpcaoFrete => {
  const tarifa = TARIFAS_POR_REGIAO.find((t) => t.digitos.includes(cep.charAt(0))) ?? TARIFA_PADRAO;
  return {
    id: 'correios_sedex',
    nome: 'Correios SEDEX',
    preco: Number((tarifa.sedex + taxaPesoExtra).toFixed(2)),
    prazo: tarifa.prazoSedex,
    descricao: descricao ?? 'Entrega rápida expressa dos Correios.'
  };
};

export const calcularOpcoesFrete = (cepBruto: string, itens: ItemFrete[]): ResultadoFrete => {
  const cep = somenteDigitos(cepBruto);

  if (cep.length !== 8) {
    return { ok: false, error: 'CEP de destino invalido. Informe os 8 digitos.' };
  }

  const contemPlantasVivas = itens.some((item) => item.categoria === CATEGORIA_PLANTA_VIVA);
  const isGrandeSP = cep.startsWith('0');

  const pesoTotalKg = calcularPesoTotalKg(itens);
  const pesoExcedente = Math.max(0, pesoTotalKg - FAIXA_PESO_LIVRE_KG);
  const taxaPesoExtra = pesoExcedente * TAXA_POR_KG_EXTRA;

  if (contemPlantasVivas) {
    // Grande SP: motoboy no mesmo dia, transporte proprio e mais seguro para a planta.
    if (isGrandeSP) {
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

    // Outros estados: SOMENTE SEDEX. O PAC e lento demais e a planta nao sobreviveria
    // aos 8-12 dias. Plantas vivas sao despachadas apenas as segundas-feiras (a loja
    // agrupa os envios para a planta nao ficar parada no fim de semana no transito).
    const sedexPlanta = opcaoSedex(
      cep,
      taxaPesoExtra,
      'Despachamos às segundas-feiras para a planta não ficar no trânsito no fim de semana. Prazo dos Correios após o envio.'
    );
    sedexPlanta.prazo = `Envio na próxima segunda + ${sedexPlanta.prazo}`;

    return {
      ok: true,
      tipo: 'correios',
      opcoes: [sedexPlanta]
    };
  }

  // Só vasos/acessórios: PAC e SEDEX para todo o Brasil.
  return {
    ok: true,
    tipo: 'correios',
    opcoes: [
      opcaoPac(cep, taxaPesoExtra),
      opcaoSedex(cep, taxaPesoExtra)
    ]
  };
};
