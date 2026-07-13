import { Router, Request, Response } from 'express';
import { gerarCodigo, verificarCodigo } from '../services/auth.js';

const router = Router();

// Em modo demo (sem integracao real de WhatsApp), o codigo volta na resposta para
// o cliente conseguir prosseguir. Defina WHATSAPP_INTEGRACAO=on quando houver envio
// real, para parar de expor o codigo.
const EXPOR_CODIGO = process.env.WHATSAPP_INTEGRACAO !== 'on';

// POST /api/auth/solicitar-codigo: gera um codigo para o telefone informado
router.post('/solicitar-codigo', (req: Request, res: Response) => {
  const { telefone } = req.body;

  if (!telefone || String(telefone).replace(/\D/g, '').length < 10) {
    res.status(400).json({ error: 'Telefone invalido. Informe DDD + numero.' });
    return;
  }

  const codigo = gerarCodigo(telefone, Date.now());
  console.log(`[auth] Codigo gerado para ${telefone}: ${codigo}`);

  res.json({
    message: 'Codigo gerado. Em producao ele seria enviado por WhatsApp.',
    ...(EXPOR_CODIGO ? { codigoDemo: codigo } : {})
  });
});

// POST /api/auth/verificar-codigo: troca o codigo por um token de sessao
router.post('/verificar-codigo', (req: Request, res: Response) => {
  const { telefone, codigo } = req.body;

  if (!telefone || !codigo) {
    res.status(400).json({ error: 'Telefone e codigo sao obrigatorios' });
    return;
  }

  const token = verificarCodigo(telefone, codigo, Date.now());

  if (!token) {
    res.status(401).json({ error: 'Codigo invalido ou expirado' });
    return;
  }

  res.json({ token });
});

export default router;
