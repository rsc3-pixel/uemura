import { Router, Request, Response } from 'express';
import { calcularOpcoesFrete, itensCarrinhoParaFrete, type ItemCarrinho } from '../services/frete.js';

const router = Router();

// POST /api/frete: Cotacao de frete exibida na sacola.
// As regras vivem em services/frete.ts porque a rota de pedidos precisa recalcular
// a mesma tarifa no fechamento, sem confiar no valor que o cliente enviou.
router.post('/', (req: Request, res: Response) => {
  const { cep, itens } = req.body;

  if (!cep || !itens || !Array.isArray(itens) || itens.length === 0) {
    res.status(400).json({ error: 'CEP de destino ou itens da sacola invalidos' });
    return;
  }

  try {
    const resultado = calcularOpcoesFrete(cep, itensCarrinhoParaFrete(itens as ItemCarrinho[]));

    if (!resultado.ok) {
      res.status(400).json({ error: resultado.error });
      return;
    }

    res.json({ tipo: resultado.tipo, opcoes: resultado.opcoes });

  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    res.status(500).json({ error: 'Erro interno ao processar frete' });
  }
});

export default router;
