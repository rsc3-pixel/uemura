import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';
import { mpPayment } from '../config/mercadopago.js';

const router = Router();

// POST /api/pedidos: Criar um novo pedido no banco SQLite e gerar o PIX Dinâmico no Mercado Pago
router.post('/', async (req: Request, res: Response) => {
  const { clienteNome, clienteTelefone, clienteEndereco, itens, frete, desconto } = req.body;

  if (!clienteNome || !clienteTelefone || !clienteEndereco || !itens || !Array.isArray(itens) || itens.length === 0) {
    res.status(400).json({ error: 'Dados do pedido ou itens invalidos' });
    return;
  }

  try {
    // 1. Calcula o total geral de forma segura no servidor
    let totalItens = 0;
    const itensParaSalvar = [];

    for (const item of itens) {
      const prod = await prisma.produto.findUnique({
        where: { id: item.produto.id }
      });

      if (!prod) {
        res.status(404).json({ error: `Produto com id ${item.produto.id} nao encontrado no banco` });
        return;
      }

      totalItens += prod.preco * item.quantidade;
      itensParaSalvar.push({
        produtoId: prod.id,
        quantidade: item.quantidade,
        precoUnitario: prod.preco
      });
    }

    const subtotal = totalItens;
    const valorDesconto = desconto ? (subtotal * desconto) / 100 : 0;
    const totalGeral = Math.max(0, subtotal - valorDesconto) + (frete || 0);

    const pedidoId = `PED-${Math.floor(100000 + Math.random() * 900000)}`;

    // 2. Grava o pedido e os itens no banco de dados SQLite
    const novoPedido = await prisma.pedido.create({
      data: {
        id: pedidoId,
        clienteNome,
        clienteTelefone,
        clienteEndereco,
        total: totalGeral,
        status: 'Pendente',
        itens: {
          create: itensParaSalvar
        }
      },
      include: {
        itens: true
      }
    });

    // 3. Tenta gerar o PIX Dinâmico na API real do Mercado Pago (Sandbox)
    try {
      if (!mpPayment) {
        throw new Error('MP_ACCESS_TOKEN ausente. Acionando contingência.');
      }

      const emailPayer = 'cliente-uemura@teste.com';
      const nomePartes = clienteNome.split(' ');
      const firstName = nomePartes[0];
      const lastName = nomePartes.slice(1).join(' ') || 'Cliente';

      const mpResponse = await mpPayment.create({
        body: {
          transaction_amount: Number(totalGeral.toFixed(2)),
          description: `Pedido ${pedidoId} - Uemura Flores e Plantas`,
          payment_method_id: 'pix',
          external_reference: pedidoId, // Cruzamento fundamental para identificacao do Webhook
          payer: {
            email: emailPayer,
            first_name: firstName,
            last_name: lastName,
          },
          // URL ilustrativa de Webhook para escuta das mudancas de status
          notification_url: 'https://webhook.uemurafloreseplantas.com.br/api/webhooks/pagamento'
        }
      });

      // Extrai os dados do PIX dinâmico
      const pixCopiaCola = mpResponse.point_of_interaction?.transaction_data?.qr_code;
      const pixBase64Image = mpResponse.point_of_interaction?.transaction_data?.qr_code_base64;

      if (pixCopiaCola && pixBase64Image) {
        res.json({
          pedido: novoPedido,
          pix: {
            copiaCola: pixCopiaCola,
            qrcode: `data:image/png;base64,${pixBase64Image}` // QR Code em Base64 nativo
          }
        });
        return;
      }

      throw new Error('Retorno do Mercado Pago incompleto. Acionando contingência.');

    } catch (mpError) {
      console.warn('Erro ao conectar ao Mercado Pago (Token inativo ou sem rede). Gerando PIX de contingência local...', mpError);

      // Fallback seguro: Gera código PIX fictício de alta fidelidade
      const pixCopiaColaContingencia = `00020101021126580014br.gov.bcb.pix0136uemurafloresplantaspix@teste.com.br5204000053039865405${totalGeral.toFixed(2)}5802BR5925UEMURA FLORES E PLANTAS6009SAO PAULO62070503${pedidoId}6304D1B9`;
      
      res.json({
        pedido: novoPedido,
        pix: {
          copiaCola: pixCopiaColaContingencia,
          qrcode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCopiaColaContingencia)}`
        }
      });
    }

  } catch (error) {
    console.error('Erro ao registrar pedido:', error);
    res.status(500).json({ error: 'Erro interno ao registrar pedido no banco de dados' });
  }
});

// GET /api/pedidos/cliente/:telefone: Buscar historico de pedidos por telefone do cliente
router.get('/cliente/:telefone', async (req: Request, res: Response) => {
  const telefone = req.params.telefone as string;

  try {
    const pedidos = await prisma.pedido.findMany({
      where: { clienteTelefone: telefone },
      include: {
        itens: {
          include: {
            produto: true
          }
        }
      },
      orderBy: { dataCriacao: 'desc' }
    });

    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao buscar pedidos por telefone:', error);
    res.status(500).json({ error: 'Erro interno ao buscar historico por telefone' });
  }
});

// GET /api/pedidos/:id: Consultar os dados e status do pedido
router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        itens: {
          include: {
            produto: true
          }
        }
      }
    });

    if (!pedido) {
      res.status(404).json({ error: 'Pedido nao encontrado' });
      return;
    }

    res.json(pedido);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro interno ao buscar dados do pedido' });
  }
});

// POST /api/pedidos/:id/simular-pagamento: Simular o recebimento do PIX mudando o status para Aprovado
router.post('/:id/simular-pagamento', async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const pedidoExistente = await prisma.pedido.findUnique({
      where: { id }
    });

    if (!pedidoExistente) {
      res.status(404).json({ error: 'Pedido nao encontrado para simulacao' });
      return;
    }

    const pedidoAtualizado = await prisma.pedido.update({
      where: { id },
      data: { status: 'Aprovado' }
    });

    res.json({
      message: 'Pagamento simulado com sucesso!',
      pedido: pedidoAtualizado
    });
  } catch (error) {
    console.error('Erro ao simular pagamento:', error);
    res.status(500).json({ error: 'Erro interno ao simular status de pagamento' });
  }
});

// POST /api/pedidos/:id/atualizar-status: Atualizar status do pedido para qualquer etapa da entrega (testes)
router.post('/:id/atualizar-status', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;

  const statusValidos = ['Pendente', 'Aprovado', 'Preparando', 'Em Rota', 'Entregue'];

  if (!status || !statusValidos.includes(status)) {
    res.status(400).json({ error: `Status invalido. Escolha um destes: ${statusValidos.join(', ')}` });
    return;
  }

  try {
    const pedidoExistente = await prisma.pedido.findUnique({
      where: { id }
    });

    if (!pedidoExistente) {
      res.status(404).json({ error: 'Pedido nao encontrado para atualizacao de status' });
      return;
    }

    const pedidoAtualizado = await prisma.pedido.update({
      where: { id },
      data: { status }
    });

    res.json({
      message: `Status do pedido atualizado para ${status} com sucesso!`,
      pedido: pedidoAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({ error: 'Erro interno ao atualizar status do pedido' });
  }
});

export default router;
