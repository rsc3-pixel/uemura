import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';
import { mpPayment } from '../config/mercadopago.js';
import { calcularOpcoesFrete } from '../services/frete.js';
import { exigirAdmin } from '../middleware/admin.js';
import { sessaoValida } from '../services/auth.js';

const router = Router();

// POST /api/pedidos: Criar um novo pedido no banco SQLite e gerar o PIX Dinâmico no Mercado Pago
//
// O cliente envia INTENCOES (qual cupom, qual opcao de frete), nunca VALORES.
// Preco, desconto e frete sao todos derivados do banco/das regras aqui no servidor.
// Aceitar "desconto: 100" ou "frete: 0" do req.body permitiria zerar qualquer pedido
// pelo console do navegador.
router.post('/', async (req: Request, res: Response) => {
  const { clienteNome, clienteTelefone, clienteEndereco, cep, itens, freteId, cupomCodigo } = req.body;

  if (!clienteNome || !clienteTelefone || !clienteEndereco || !cep || !itens || !Array.isArray(itens) || itens.length === 0) {
    res.status(400).json({ error: 'Dados do pedido, CEP ou itens invalidos' });
    return;
  }

  try {
    // 1. Preco e categoria dos itens: sempre do banco, nunca do que o cliente mandou
    let subtotal = 0;
    const itensParaSalvar = [];
    const itensFrete = [];

    for (const item of itens) {
      const quantidade = Number(item.quantidade);

      if (!Number.isInteger(quantidade) || quantidade < 1) {
        res.status(400).json({ error: `Quantidade invalida para o produto ${item.produto?.id}` });
        return;
      }

      const prod = await prisma.produto.findUnique({
        where: { id: item.produto?.id }
      });

      if (!prod) {
        res.status(404).json({ error: `Produto com id ${item.produto?.id} nao encontrado no banco` });
        return;
      }

      subtotal += prod.preco * quantidade;
      itensParaSalvar.push({
        produtoId: prod.id,
        quantidade,
        precoUnitario: prod.preco
      });
      // Categoria do BANCO decide a restricao de planta viva, nao a que o cliente enviou
      itensFrete.push({ categoria: prod.categoria, quantidade });
    }

    // 2. Frete: recalculado pelas mesmas regras da cotacao, com as categorias do banco.
    //    O cliente escolhe a OPCAO, o servidor determina o PRECO.
    const cotacao = calcularOpcoesFrete(cep, itensFrete);

    if (!cotacao.ok) {
      res.status(400).json({ error: cotacao.error });
      return;
    }

    const opcaoEscolhida = cotacao.opcoes.find((o) => o.id === freteId);

    if (!opcaoEscolhida) {
      res.status(400).json({
        error: `Opcao de frete invalida para este CEP. Disponiveis: ${cotacao.opcoes.map((o) => o.id).join(', ')}`
      });
      return;
    }

    const valorFrete = opcaoEscolhida.preco;

    // 3. Desconto: derivado do cupom no banco. O cliente manda o CODIGO, nunca a porcentagem.
    let valorDesconto = 0;
    let descontoPorcentagem = 0;

    if (cupomCodigo) {
      const cupom = await prisma.cupom.findUnique({
        where: { codigo: String(cupomCodigo).toUpperCase() }
      });

      if (!cupom || !cupom.ativo) {
        res.status(400).json({ error: 'Cupom invalido ou inativo' });
        return;
      }

      descontoPorcentagem = cupom.descontoPorcentagem;
      valorDesconto = (subtotal * descontoPorcentagem) / 100;
    }

    // Desconto incide so nos produtos, nunca no frete (regra do rulebook)
    const totalGeral = Number((Math.max(0, subtotal - valorDesconto) + valorFrete).toFixed(2));

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

      // URL que o Mercado Pago chama ao compensar o PIX. Vem do ambiente (WEBHOOK_URL,
      // o dominio publico do backend em producao). Em dev fica indefinido e nao enviamos
      // notification_url, pois o MP nao conseguiria alcancar o localhost.
      const webhookUrl = process.env.WEBHOOK_URL;

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
          ...(webhookUrl ? { notification_url: webhookUrl } : {})
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

// GET /api/pedidos/cliente/:telefone: Buscar historico de pedidos do cliente
//
// Exige sessao autenticada (login por codigo, ver routes/auth.ts). O token vai no
// header x-session-token e precisa pertencer ao telefone consultado. Isso impede que
// alguem varra telefones alheios para coletar dados de clientes (LGPD).
router.get('/cliente/:telefone', async (req: Request, res: Response) => {
  const telefone = req.params.telefone as string;

  if (!sessaoValida(req.get('x-session-token'), telefone, Date.now())) {
    res.status(401).json({ error: 'Autentique-se com o codigo enviado para este telefone.' });
    return;
  }

  try {
    // Cliente autenticado como dono do numero: pode ver os proprios dados completos.
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
// Rota administrativa: em producao quem aprova o pagamento e o webhook do Mercado Pago.
router.post('/:id/simular-pagamento', exigirAdmin, async (req: Request, res: Response) => {
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

// POST /api/pedidos/:id/atualizar-status: Avancar o pedido na esteira logistica
// Rota administrativa: so a equipe da Uemura muda o status de uma entrega.
router.post('/:id/atualizar-status', exigirAdmin, async (req: Request, res: Response) => {
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
