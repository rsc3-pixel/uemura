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
│   │   ├── config/
│   │   │   └── mercadopago.ts     # Cliente MP lido do ambiente (sem chave no codigo)
│   │   ├── data/
│   │   │   └── seed.ts            # Carga de dados (Produtos, Cupons, Avaliacoes)
│   │   ├── middleware/
│   │   │   └── admin.ts           # Exige x-admin-token nas rotas de status
│   │   ├── services/
│   │   │   └── frete.ts           # Regras de frete (usadas por cotacao e pedido)
│   │   ├── routes/
│   │   │   ├── produtos.ts        # Endpoints de catalogo
│   │   │   ├── pedidos.ts         # Criacao de pedido, PIX e recalculo seguro
│   │   │   ├── cupons.ts          # Validacao de cupom para exibicao na sacola
│   │   │   ├── frete.ts           # Rota de cotacao (delega para services/frete.ts)
│   │   │   └── avaliacoes.ts      # Reviews validados contra pedido entregue
│   │   └── server.ts              # Inicializador, CORS por ambiente e rotas
│   └── package.json
│
├── src/                           # Client React
│   ├── components/
│   │   ├── Header.tsx             # Menu de categorias, busca e acessos
│   │   ├── Cart.tsx               # Sacola, preenchimento ViaCEP e cupons
│   │   ├── OrderHistory.tsx       # Area do cliente, cultivo e simulador logistico
│   │   ├── OrderStatusTracker.tsx # Barra de progresso do rastreamento
│   │   ├── Testimonials.tsx       # Depoimentos dinamicos na Home
│   │   ├── Toast.tsx              # Componente visual das notificacoes
│   │   └── FAQ.tsx                # Central de Ajuda interativa
│   ├── context/
│   │   ├── CartContext.tsx        # Contexto de estado da sacola
│   │   ├── FavoritesContext.tsx   # Contexto de favoritos
│   │   └── ToastContext.tsx       # Contexto global de notificacoes Toast
│   ├── config.ts                  # URL da API (VITE_API_URL)
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

O servidor responde na URL definida por `VITE_API_URL` (padrão `http://localhost:3001` em desenvolvimento) com as seguintes rotas REST:

**Princípio de segurança:** o cliente envia apenas *intenções* (qual cupom, qual opção de frete, quais produtos). Todo valor em dinheiro (preço, desconto, frete) é derivado do banco e das regras no servidor. Valores enviados no corpo da requisição são ignorados.

* **Produtos:**
  * `GET /api/produtos`: Retorna a listagem de todos os itens do catálogo de plantas.
* **Pedidos:**
  * `POST /api/pedidos`: Cria um novo pedido. Recebe `cep`, `freteId` (id da opção escolhida) e `cupomCodigo` (código, não a porcentagem). O servidor recalcula preço, frete e desconto a partir do banco, gera o PIX Dinâmico no Mercado Pago (ou a contingência local se offline) e grava no SQLite.
  * `GET /api/pedidos/cliente/:telefone`: Busca pedidos vinculados ao telefone. **Não retorna endereço nem telefone** (mitigação LGPD); só nome, itens, total e status.
  * `GET /api/pedidos/:id`: Retorna o status e os dados de um pedido específico.
  * `POST /api/pedidos/:id/simular-pagamento`: **Rota administrativa** (exige header `x-admin-token`). Muda o status para "Aprovado". Desativada se `ADMIN_TOKEN` não estiver definido.
  * `POST /api/pedidos/:id/atualizar-status`: **Rota administrativa** (exige header `x-admin-token`). Avança o status na esteira logística (Pendente -> Aprovado -> Preparando -> Em Rota -> Entregue).
* **Cupons:**
  * `POST /api/cupons/validar`: Recebe o código e o subtotal, valida o cupom no banco e retorna os valores para exibição na sacola. A validação definitiva do desconto acontece de novo na criação do pedido.
* **Frete:**
  * `POST /api/frete`: Cotação exibida na sacola. Recebe CEP e itens. Se houver plantas vivas, restringe a entrega à Grande São Paulo via Motoboy (R$ 15,00). Só vasos/acessórios liberam PAC/SEDEX. A lógica vive em `services/frete.ts`, reaproveitada na criação do pedido (que usa a categoria do banco, não a enviada pelo cliente).
* **Avaliacoes:**
  * `GET /api/avaliacoes`: Retorna os depoimentos de clientes cadastrados no SQLite.
  * `POST /api/avaliacoes`: Salva uma avaliação de 1 a 5 estrelas. O servidor exige `pedidoId` e só aceita se o pedido existe, está "Entregue" e contém o produto avaliado.
* **Webhooks:**
  * `POST /api/webhooks/pagamento`: Rota pública chamada pelo Mercado Pago para notificar a compensação do PIX em produção, atualizando o pedido no SQLite automaticamente.

---

## 5. Dinâmicas e Loops de Sincronização (Toasts)

* **Polling:** O `App.tsx` monta um `window.setInterval` de 4 segundos (uma única vez, no mount) que varre os pedidos guardados no `localStorage` e consulta o status atual no backend. O cache de status fica num `useRef`, para ler e escrever sem recriar o intervalo a cada ciclo.
* **Alerta Toast:** Se o status no SQLite diferir do cache local (ex: mudar de Preparando para "Em Rota"), dispara uma notificação Toast. O sistema de Toast é global (`ToastContext`), acessível por qualquer componente via `useToast()`, o que substituiu os antigos `alert()` do projeto.
* **Aprovações Webhook:** No momento em que o pagamento é aprovado (via simulador ou webhook real do Mercado Pago), a tela do carrinho é atualizada automaticamente pela escuta, limpando a sacola de compras e exibindo a mensagem de sucesso.
