# Ficha de Contexto do Projeto: E-commerce Uemura Flores e Plantas

Este documento serve como um mapa de contexto técnico (Context Box) projetado para que outras ferramentas de Inteligência Artificial (como Cursor, ChatGPT ou Claude) compreendam instantaneamente toda a arquitetura, estrutura de arquivos, regras de negócio e integrações deste projeto e-commerce Full Stack.

---

## 1. Visão Geral da Arquitetura

O e-commerce da **Uemura Flores e Plantas** é uma aplicação Full Stack autossuficiente desenvolvida em TypeScript:

* **Front-End (Client):** Desenvolvido em **React + Vite**, estruturado com **CSS Modules** para estilos isolados, **Framer Motion** para animações fluidas e **Lucide React** para ícones. O gerenciamento de estado global da sacola de compras e favoritos usa React Context.
* **Backend (Servidor):** API REST robusta em **Node.js + Express** executada de forma estável via **tsx watch** para suporte nativo a ESModules.
* **Banco de Dados:** Banco de dados relacional local **SQLite** gerenciado pelo **Prisma ORM**.

---

## 2. Estrutura de Arquivos do Projeto

Os componentes principais do código-fonte estão distribuídos da seguinte forma:

```
c:\Users\CHONGRENATOO\Documents\uemurafloresplantas.com.br
├── backend/                       # Servidor Node.js
│   ├── prisma/
│   │   └── schema.prisma          # Estrutura de tabelas e conexoes
│   ├── src/
│   │   ├── data/
│   │   │   └── seed.ts            # Carga de dados (Produtos, Cupons, Avaliacoes)
│   │   ├── routes/
│   │   │   ├── produtos.ts        # Endpoints de catalogo
│   │   │   ├── pedidos.ts         # Integracao Mercado Pago e Historico
│   │   │   ├── cupons.ts          # Validacao de descontos no servidor
│   │   │   ├── frete.ts           # Regras de Frete Misto e Correios
│   │   │   └── avaliacoes.ts      # Salva reviews pos-entrega
│   │   └── server.ts              # Inicializador e registro das rotas
│   └── package.json
│
├── src/                           # Client React
│   ├── components/
│   │   ├── Header.tsx             # Menu de categorias, busca e acessos
│   │   ├── Cart.tsx               # Sacola, preenchimento ViaCEP e cupons
│   │   ├── OrderHistory.tsx       # Area do cliente, cultivo e simulador logistico
│   │   ├── OrderStatusTracker.tsx # Barra de progresso do rastreamento
│   │   ├── Testimonials.tsx       # Depoimentos dinamicos na Home
│   │   ├── Toast.tsx              # Notificacoes popup em tempo real
│   │   └── FAQ.tsx                # Central de Ajuda interativa
│   ├── context/
│   │   ├── CartContext.tsx        # Contexto de estado da sacola
│   │   └── FavoritesContext.tsx   # Contexto de favoritos
│   ├── App.tsx                    # Orquestrador central e loop de polling
│   └── App.css                    # Estilos globais e hero section
│
├── docs/                          # Documentacoes e manuais comerciais
├── Makefile                       # Automacao de execucao (make dev)
└── package.json                   # Vite Config
```

---

## 3. Modelo de Dados (Prisma Schema)

O arquivo `backend/prisma/schema.prisma` define a estrutura relacional do banco SQLite:

* **Produto:** Armazena dados do catálogo (`id`, `nome`, `preco`, `imagem`, `categoria`, `tamanhoVaso`, `rega`, `iluminacao`, `adubacao`).
* **Pedido:** Dados da venda (`id`, `clienteNome`, `clienteTelefone`, `clienteEndereco`, `total`, `status`, `dataCriacao`). Possui relação 1-para-muitos com `ItemPedido`.
* **ItemPedido:** Tabela de ligação contendo o ID do produto, quantidade comprada e o preço unitário praticado na venda.
* **Cupom:** Guarda cupons promocionais ativos (`codigo`, `descontoPorcentagem`).
* **Avaliacao:** Depoimentos e notas deixadas pelos compradores pós-venda (`id`, `clienteNome`, `nota`, `comentario`, `dataCriacao`).

---

## 4. Endpoints da API (Backend)

O servidor responde em `http://localhost:3001` com as seguintes rotas REST:

* **Produtos:**
  * `GET /api/produtos`: Retorna a listagem de todos os itens do catálogo de plantas.
* **Pedidos:**
  * `POST /api/pedidos`: Cria um novo pedido no SQLite e dispara requisição para a API de Sandbox do Mercado Pago para gerar o PIX Dinâmico com QR Code em Base64. Caso o servidor esteja offline, executa a contingência local e gera os dados de teste locais.
  * `GET /api/pedidos/cliente/:telefone`: Busca todos os pedidos anteriores vinculados ao WhatsApp informado.
  * `GET /api/pedidos/:id`: Retorna o status e os dados de um pedido específico.
  * `POST /api/pedidos/:id/simular-pagamento`: Muda o status do pedido para "Aprovado" de forma manual.
  * `POST /api/pedidos/:id/atualizar-status`: Altera o status do pedido para qualquer etapa da logística (Pendente -> Aprovado -> Preparando -> Em Rota -> Entregue).
* **Cupons:**
  * `POST /api/cupons/validar`: Recebe o código e o subtotal, valida a existência do cupom no banco e retorna os valores recalculados com o desconto aplicado.
* **Frete:**
  * `POST /api/frete`: Recebe o CEP e itens. Se houver plantas vivas, restringe a entrega à Grande São Paulo via Motoboy (R$ 15,00) e bloqueia o restante. Se houver apenas vasos/acessórios, calcula o PAC e SEDEX simulando as tarifas dos Correios para o Brasil.
* **Avaliacoes:**
  * `GET /api/avaliacoes`: Retorna os depoimentos de clientes cadastrados no SQLite.
  * `POST /api/avaliacoes`: Salva uma nova avaliação de 1 a 5 estrelas vinculada a um pedido entregue.
* **Webhooks:**
  * `POST /api/webhooks/pagamento`: Rota pública chamada pelo Mercado Pago para notificar a compensação do PIX em produção, atualizando o pedido no SQLite automaticamente.

---

## 5. Dinâmicas e Loops de Sincronização (Toasts)

* **Polling:** O `App.tsx` executa um loop (`window.setInterval`) a cada 4 segundos que varre os pedidos pendentes guardados no `localStorage` do cliente e consulta o status atual no servidor backend.
* **Alerta Toast:** Se o status no banco de dados SQLite diferir do cache local (ex: mudar de Preparando para "Em Rota"), o React dispara uma notificação Toast na tela (ex: "🛵 O motoboy da Uemura saiu com a sua entrega!").
* **Aprovações Webhook:** No momento em que o pagamento é aprovado (via simulador ou webhook real do Mercado Pago), a tela do carrinho é atualizada automaticamente pela escuta, limpando a sacola de compras e exibindo a mensagem de sucesso.
