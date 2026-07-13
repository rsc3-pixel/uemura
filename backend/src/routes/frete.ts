import { Router, Request, Response } from 'express';

const router = Router();

interface ItemCarrinho {
  quantidade: number;
  produto: {
    id: string;
    nome: string;
    preco: number;
    categoria: string;
  };
}

// POST /api/frete: Calcular opções de frete reais ou locais híbridos
router.post('/', (req: Request, res: Response) => {
  const { cep, itens } = req.body;

  if (!cep || cep.length < 8 || !itens || !Array.isArray(itens) || itens.length === 0) {
    res.status(400).json({ error: 'CEP de destino ou itens da sacola invalidos' });
    return;
  }

  try {
    // 1. Verifica se há plantas vivas no carrinho
    const contemPlantasVivas = itens.some(
      (item: ItemCarrinho) => item.produto.categoria === 'Flores e Plantas'
    );

    // Identifica se o CEP é da Grande São Paulo (Capital e região metropolitana iniciam com '0')
    const isGrandeSP = cep.startsWith('0');

    if (contemPlantasVivas) {
      if (!isGrandeSP) {
        // Bloqueio logístico de segurança para plantas vivas
        res.status(400).json({
          error: 'Plantas vivas são despachadas apenas para a Grande São Paulo por motivos de integridade e saúde da espécie. Remova as plantas da sacola para liberar o envio via Correios (PAC/SEDEX) para o seu endereço.'
        });
        return;
      }

      // Se for Grande SP, oferece a Entrega Expressa local de motoboy
      res.json({
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
      });
      return;
    }

    // 2. Lógica para Acessórios e Vasos (Correios Simulados em Tempo Real)
    // Calcula o peso estimado total do carrinho
    let pesoTotalKg = 0;
    itens.forEach((item: ItemCarrinho) => {
      if (item.produto.categoria === 'Vasos') {
        pesoTotalKg += 2.5 * item.quantidade; // Estimativa de peso de vaso cerâmico
      } else {
        pesoTotalKg += 0.8 * item.quantidade; // Estimativa de peso de adubos/acessórios
      }
    });

    const primeiroDigito = cep.charAt(0);
    let precoBasePac = 18.90;
    let precoBaseSedex = 26.40;
    let prazoPac = '5 a 8 dias úteis';
    let prazoSedex = '2 a 4 dias úteis';

    // Determina a tarifa e prazos base por região brasileira usando o primeiro dígito do CEP
    if (primeiroDigito === '0' || primeiroDigito === '1') {
      // Estado de São Paulo
      precoBasePac = 14.50;
      precoBaseSedex = 19.90;
      prazoPac = '3 a 5 dias úteis';
      prazoSedex = '1 a 2 dias úteis';
    } else if (primeiroDigito === '2' || primeiroDigito === '3') {
      // RJ, ES, MG (Sudeste)
      precoBasePac = 18.90;
      precoBaseSedex = 27.20;
      prazoPac = '5 a 7 dias úteis';
      prazoSedex = '2 a 3 dias úteis';
    } else if (primeiroDigito === '8' || primeiroDigito === '9') {
      // Região Sul
      precoBasePac = 23.50;
      precoBaseSedex = 38.90;
      prazoPac = '6 a 9 dias úteis';
      prazoSedex = '3 a 4 dias úteis';
    } else if (primeiroDigito === '7') {
      // Centro-Oeste
      precoBasePac = 26.80;
      precoBaseSedex = 47.90;
      prazoPac = '7 a 10 dias úteis';
      prazoSedex = '4 a 5 dias úteis';
    } else if (primeiroDigito === '4' || primeiroDigito === '5' || primeiroDigito === '6') {
      // Nordeste e Norte
      precoBasePac = 32.50;
      precoBaseSedex = 59.80;
      prazoPac = '8 a 12 dias úteis';
      prazoSedex = '4 a 6 dias úteis';
    }

    // Adiciona taxa extra por peso excedente a partir de 2kg
    const taxaPesoExtra = pesoTotalKg > 2 ? (pesoTotalKg - 2) * 3.50 : 0;
    const totalPac = Number((precoBasePac + taxaPesoExtra).toFixed(2));
    const totalSedex = Number((precoBaseSedex + taxaPesoExtra).toFixed(2));

    res.json({
      tipo: 'correios',
      opcoes: [
        {
          id: 'correios_pac',
          nome: 'Correios PAC',
          preco: totalPac,
          prazo: prazoPac,
          descricao: 'Entrega econômica dos Correios com código de rastreamento.'
        },
        {
          id: 'correios_sedex',
          nome: 'Correios SEDEX',
          preco: totalSedex,
          prazo: prazoSedex,
          descricao: 'Entrega rápida expressa dos Correios.'
        }
      ]
    });

  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    res.status(500).json({ error: 'Erro interno ao processar frete' });
  }
});

export default router;
