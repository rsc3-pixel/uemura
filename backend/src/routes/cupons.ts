import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';

const router = Router();

// POST /api/cupons/validar: Validar cupom e retornar o desconto calculado
router.post('/validar', async (req: Request, res: Response) => {
  const { codigo, subtotal } = req.body;

  if (!codigo || typeof subtotal !== 'number') {
    res.status(400).json({ error: 'Codigo do cupom ou subtotal invalidos' });
    return;
  }

  try {
    const cupom = await prisma.cupom.findUnique({
      where: { codigo: codigo.toUpperCase() }
    });

    if (!cupom) {
      res.status(404).json({ error: 'Cupom nao encontrado' });
      return;
    }

    if (!cupom.ativo) {
      res.status(400).json({ error: 'Este cupom nao esta mais ativo' });
      return;
    }

    const valorDesconto = (subtotal * cupom.descontoPorcentagem) / 100;
    const totalComDesconto = Math.max(0, subtotal - valorDesconto);

    res.json({
      valido: true,
      descontoPorcentagem: cupom.descontoPorcentagem,
      valorDesconto: Number(valorDesconto.toFixed(2)),
      totalComDesconto: Number(totalComDesconto.toFixed(2))
    });

  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    res.status(500).json({ error: 'Erro interno ao validar cupom no banco de dados' });
  }
});

export default router;
