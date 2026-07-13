# Rulebook e Diagnóstico Técnico: E-commerce Uemura

Este documento apresenta uma análise crítica do estado atual do e-commerce da **Uemura Flores e Plantas** e define o **Rulebook (Manual de Regras de Negócio e Operação)** tanto para o **Usuário Final (Cliente)** quanto para o **Vendedor (Equipe da Uemura)**.

---

## Parte 1: Diagnóstico Técnico e Estado Atual

A arquitetura Full Stack desenvolvida é altamente performática e resiliente. Abaixo pontuamos o estado atual e as sugestões de melhorias futuras para evolução do produto:

### O que temos hoje:
1. **Resiliência de Integração:** O fluxo de pagamento PIX e cálculo de frete possui redundância dupla. Se o Mercado Pago ou os Correios apresentarem instabilidade na rede, o site entra em contingência imediata, gerando o PIX de simulação e garantindo que o cliente complete a experiência sem travamentos.
2. **Valores Calculados no Servidor:** Preço, desconto e frete são sempre derivados do banco e das regras no backend. O cliente envia apenas intenções (qual cupom, qual opção de frete), nunca valores. Enviar `desconto: 100` pelo console não tem efeito, o servidor ignora e recalcula. A restrição de planta viva também usa a categoria do banco, não a informada no request.
3. **Rotas de Status Protegidas:** Aprovar pagamento e avançar a entrega exigem um header `x-admin-token`. Sem `ADMIN_TOKEN` no ambiente, essas rotas ficam desativadas, o padrão seguro para produção.
4. **Avaliações Verificadas:** O backend só grava uma avaliação se o pedido informado existe, está "Entregue" e contém o produto avaliado. A trava não é apenas visual.
5. **Sincronização em Tempo Real:** Polling no React com notificações Toast globais mantém o cliente informado sobre o status logístico no momento em que ele muda no banco.

### Pontos de Melhoria Futura (Evolução do Produto):
* **Painel Administrativo Isolado:** As rotas de status já exigem token, mas os botões de simulação ainda aparecem, de forma didática, no histórico do próprio cliente. Em produção, eles devem ser removidos e movidos para uma rota `/admin` com login próprio. Nota: o `VITE_ADMIN_TOKEN` do front fica visível no bundle, então serve só ao demo local, não é proteção real de produção.
* **Autenticação por Código Único (Passwordless):** Já implementada. A consulta ao histórico exige login: o cliente informa o telefone, recebe um código de 6 dígitos e o digita para obter um token de sessão (30 min). A rota de histórico só responde a quem tem token válido para aquele telefone (`backend/src/routes/auth.ts` e `services/auth.ts`). Falta apenas o envio real do código: hoje ele volta na resposta em modo demo; em produção, ligar `WHATSAPP_INTEGRACAO=on` e integrar Twilio/Z-API. O store de códigos é em memória (Map); com múltiplas instâncias, migrar para Redis.
* **Envio de Mensagens Logísticas Automatizadas:** Configurar disparos automáticos de mensagens de texto no WhatsApp do cliente informando o código PIX copia e cola e alertando quando o pedido sair para entrega.

---

## Parte 2: Rulebook do Usuário (Jornada do Cliente)

Este conjunto de diretrizes dita como o sistema se comporta para o comprador durante a navegação e compra:

### 1. Regra de Digitação de CEP e Autocompletar
* Ao digitar um CEP válido de 8 números e clicar em calcular frete, os dados de Rua, Bairro e Cidade correspondentes serão preenchidos de forma automática na tela.
* O cliente deve preencher manualmente apenas o número do imóvel e complementos adicionais.

### 2. Regra de Restrição Biológica de Envio de Plantas
* O cliente pode comprar vasos e acessórios de qualquer localidade do Brasil, recebendo opções de frete via Correios (PAC/SEDEX).
* Se houver qualquer planta viva na sacola de compras, a entrega estará disponível unicamente para a Grande São Paulo. CEPs de fora dessa região metropolitana serão rejeitados com aviso educativo de integridade ecológica da planta.

### 3. Regra de Cupom de Desconto
* O cliente só pode aplicar cupons de desconto antes de finalizar o pedido.
* O desconto incidirá exclusivamente sobre o valor dos produtos na sacola, não aplicando desconto sobre a taxa de frete.

### 4. Regra de Avaliação e Dicas de Cultivo
* As dicas personalizadas de rega, adubação e iluminação do produto ficam liberadas para consulta na Área do Cliente assim que o pedido é registrado.
* O formulário de avaliações por estrelas e comentários só é desbloqueado após o status do pedido ser atualizado no banco de dados para **Entregue**, garantindo a legitimidade dos depoimentos exibidos no site.

---

## Parte 3: Rulebook do Vendedor (Operação de Vendas e Back-office)

Este conjunto de regras orienta a equipe interna da Uemura sobre o manuseio técnico do sistema e a logística física de entrega:

### 1. Fluxo Obrigatório de Status de Pedido
Os pedidos devem seguir rigorosamente a sequência de status abaixo no banco de dados para disparar os eventos corretos no site:
1. **Pendente:** Status inicial de criação. Aguardando a notificação automática de pagamento do Mercado Pago (ou simulação manual).
2. **Aprovado:** O pagamento foi confirmado. O site remove o QR Code da tela do cliente e avisa que o pedido foi pago. A equipe deve iniciar a separação física.
3. **Preparando:** Indica que a planta está sendo selecionada e embalada na estufa da Uemura.
4. **Em Rota:** O motoboy ou motorista coletou o pacote e saiu para entrega. Isso dispara o Toast em tempo real no site do cliente.
5. **Entregue:** O motorista confirmou a entrega em mãos. Isso libera o formulário de avaliação do produto para o cliente.

### 2. Regra Logística de Embalagem e Despacho de Plantas Vivas
* As plantas vivas selecionadas na estufa nunca devem ser enviadas em caixas lacradas.
* Devem ser embaladas em suportes verticais abertos (ex: sacolas de fundo largo ou berços de papelão abertos por cima) para garantir que a planta respire, receba luz e não seja virada de cabeça para baixo durante o trajeto.
* A rega pré-envio deve ser moderada para evitar solo seco ou excessivamente encharcado que possa danificar o veículo do entregador.

### 3. Gestão e Cadastro de Novos Itens no Banco de Dados
* Ao cadastrar um novo produto no banco de dados (SQLite/PostgreSQL), a equipe de vendas deve obrigatoriamente preencher os campos de informações de cultivo:
  * **Rega:** Quantidade e frequência de água ideal (ex: "Molhar 2 vezes por semana").
  * **Iluminação:** Necessidade de luz (ex: "Meia-sombra, evitar sol direto").
  * **Adubação:** Tipo de nutriente e intervalo (ex: "Adubar a cada 3 meses com NPK 10-10-10").
* O preenchimento correto garante que o cliente tenha acesso ao manual de cuidados no seu histórico pós-venda, reduzindo taxas de devolução por morte da planta.
