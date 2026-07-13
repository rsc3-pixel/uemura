import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

// GET /api/produtos: Listar todos os produtos do banco SQLite
router.get('/', async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany();
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno ao buscar lista de produtos' });
  }
});

// POST /api/produtos/popular: Popular a carga inicial de produtos se o banco estiver vazio
router.post('/popular', async (req, res) => {
  const { produtos } = req.body;

  if (!produtos || !Array.isArray(produtos)) {
    res.status(400).json({ error: 'Lista de produtos invalida' });
    return;
  }

  try {
    const resultados = [];
    
    for (const prod of produtos) {
      const dbProd = await prisma.produto.upsert({
        where: { id: prod.id },
        update: {
          nome: prod.nome,
          preco: prod.preco,
          imagem: prod.imagem,
          categoria: prod.categoria,
          valorAnterior: prod.valorAnterior || null,
          desconto: prod.desconto || null,
          descricao: prod.descricao || '',
          tamanhoVaso: prod.tamanhoVaso || ''
        },
        create: {
          id: prod.id,
          nome: prod.nome,
          preco: prod.preco,
          imagem: prod.imagem,
          categoria: prod.categoria,
          valorAnterior: prod.valorAnterior || null,
          desconto: prod.desconto || null,
          descricao: prod.descricao || '',
          tamanhoVaso: prod.tamanhoVaso || ''
        }
      });
      resultados.push(dbProd);
    }

    res.json({ message: `${resultados.length} produtos populados com sucesso no banco SQLite.` });
  } catch (error) {
    console.error('Erro ao popular produtos:', error);
    res.status(500).json({ error: 'Erro interno ao popular dados do banco' });
  }
});

export default router;
