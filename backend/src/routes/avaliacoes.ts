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
router.post('/', async (req: Request, res: Response) => {
  const { clienteNome, nota, comentario, produtoId } = req.body;

  if (!clienteNome || typeof nota !== 'number' || nota < 1 || nota > 5 || !comentario || !produtoId) {
    res.status(400).json({ error: 'Dados da avaliacao invalidos' });
    return;
  }

  try {
    const produtoExiste = await prisma.produto.findUnique({
      where: { id: produtoId }
    });

    if (!produtoExiste) {
      res.status(404).json({ error: 'Produto a ser avaliado nao existe no banco' });
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
