import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import produtosRouter from './routes/produtos.js';
import pedidosRouter from './routes/pedidos.js';
import cuponsRouter from './routes/cupons.js';
import avaliacoesRouter from './routes/avaliacoes.js';
import freteRouter from './routes/frete.js';
import webhooksRouter from './routes/webhooks.js';
import { popularBancoSeVazio } from './data/seed.js';

export const prisma = new PrismaClient();

// Inicializa a semente de dados no banco SQLite
popularBancoSeVazio();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*' // Permite chamadas de qualquer origem no ambiente local de testes
}));

app.use(express.json());

// Registro de Rotas da API
app.use('/api/produtos', produtosRouter);
app.use('/api/pedidos', pedidosRouter);
app.use('/api/cupons', cuponsRouter);
app.use('/api/avaliacoes', avaliacoesRouter);
app.use('/api/frete', freteRouter);
app.use('/api/webhooks', webhooksRouter);

// Rota de Status do Servidor
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor Uemura rodando com sucesso!' });
});

app.listen(PORT, () => {
  console.log(`Servidor Uemura rodando em http://localhost:${PORT}`);
});
