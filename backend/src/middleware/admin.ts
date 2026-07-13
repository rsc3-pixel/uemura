import { Request, Response, NextFunction } from 'express';

// Protege as rotas que mudam o status de um pedido (aprovar pagamento, avancar entrega).
// Sem isso qualquer pessoa que saiba um id de pedido marca o proprio pedido como pago.
//
// A chave vem do ambiente. Quando ela nao existe, as rotas administrativas ficam
// DESLIGADAS: e o padrao seguro para producao, onde essas rotas nao deveriam existir
// (a aprovacao real chega pelo webhook do Mercado Pago).
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

export const exigirAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!ADMIN_TOKEN) {
    res.status(403).json({
      error: 'Rota administrativa desativada. Defina ADMIN_TOKEN no .env do backend para habilitar.'
    });
    return;
  }

  const tokenEnviado = req.get('x-admin-token');

  if (tokenEnviado !== ADMIN_TOKEN) {
    res.status(401).json({ error: 'Nao autorizado' });
    return;
  }

  next();
};
