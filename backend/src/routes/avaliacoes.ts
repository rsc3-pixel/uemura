import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';

const router = Router();

// GET /api/avaliacoes: Obter as ultimas 10 avaliações de clientes para exibir na vitrine
router.get('/', async (req: Request, res: Response) => {
  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      take: 10,
      orderBy: { dataCriacao: 'desc' },
      include: {
        produto: {
          select: {
            nome: true,
            imagem: true
          }
        }
      }
    });
    res.json(avaliacoes);
  } catch (error) {
    console.error('Erro ao buscar avaliacoes:', error);
    res.status(500).json({ error: 'Erro interno ao buscar as avaliacoes de clientes' });
  }
});

// POST /api/avaliacoes: Criar um novo review de um produto apos entrega
// So permite avaliar um produto que o cliente REALMENTE comprou e recebeu:
// o pedido informado precisa existir, estar "Entregue" e conter aquele produto.
// A trava do front (botao so aparece quando entregue) nao basta: qualquer um
// chamaria a rota direto para forjar depoimentos.
router.post('/', async (req: Request, res: Response) => {
  const { clienteNome, nota, comentario, produtoId, pedidoId } = req.body;

  if (!clienteNome || typeof nota !== 'number' || nota < 1 || nota > 5 || !comentario || !produtoId || !pedidoId) {
    res.status(400).json({ error: 'Dados da avaliacao invalidos' });
    return;
  }

  try {
    // O pedido precisa existir, ter sido entregue e conter o produto avaliado.
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { itens: true }
    });

    if (!pedido) {
      res.status(404).json({ error: 'Pedido informado nao existe' });
      return;
    }

    if (pedido.status !== 'Entregue') {
      res.status(403).json({ error: 'So e possivel avaliar apos o pedido ser entregue' });
      return;
    }

    const comprouEsteProduto = pedido.itens.some((item) => item.produtoId === produtoId);

    if (!comprouEsteProduto) {
      res.status(403).json({ error: 'Este produto nao faz parte do pedido informado' });
      return;
    }

    const novaAvaliacao = await prisma.avaliacao.create({
      data: {
        clienteNome,
        nota,
        comentario,
        produtoId
      },
      include: {
        produto: {
          select: {
            nome: true
          }
        }
      }
    });

    res.json({
      message: 'Avaliacao gravada com sucesso no SQLite!',
      avaliacao: novaAvaliacao
    });

  } catch (error) {
    console.error('Erro ao salvar avaliacao:', error);
    res.status(500).json({ error: 'Erro interno ao salvar avaliacao no banco de dados' });
  }
});

export default router;
