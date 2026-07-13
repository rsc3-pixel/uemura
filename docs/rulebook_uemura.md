# Rulebook e Diagnóstico Técnico: E-commerce Uemura

Este documento apresenta uma análise crítica do estado atual do e-commerce da **Uemura Flores e Plantas** e define o **Rulebook (Manual de Regras de Negócio e Operação)** tanto para o **Usuário Final (Cliente)** quanto para o **Vendedor (Equipe da Uemura)**.

---

## Parte 1: Diagnóstico Técnico e Estado Atual

A arquitetura Full Stack desenvolvida é altamente performática e resiliente. Abaixo pontuamos o estado atual e as sugestões de melhorias futuras para evolução do produto:

### O que temos hoje:
1. **Resiliência de Integração:** O fluxo de pagamento PIX e cálculo de frete possui redundância dupla. Se o Mercado Pago ou os Correios apresentarem instabilidade na rede, o site entra em contingência imediata, gerando o PIX de simulação e garantindo que o cliente complete a experiência sem travamentos.
2. **Validação de Negócios Centralizada:** Cupons de desconto e cálculos financeiros são efetuados no backend Node.js, impedindo manipulações maliciosas de preços pelo console do navegador do cliente.
3. **Sincronização em Tempo Real:** O uso de loops de sincronização (polling) no React com alertas visuais (Toasts) mantém o cliente informado sobre o status logístico do pedido no segundo exato em que ele muda no banco de dados.

### Pontos de Melhoria Futura (Evolução do Produto):
* **Painel Administrativo Isolado:** No momento, os botões de simulação e alteração de status estão inseridos de forma didática no próprio histórico de pedidos do cliente (para facilitar a visualização do portfólio de estudos). Em produção, esses botões devem ser removidos e movidos para uma rota de administração protegida por login e senha (ex: `/admin`), exclusiva para a equipe da loja.
* **Autenticação por Código Único (Passwordless):** A consulta ao histórico de pedidos é baseada no número de telefone informado. Para produção, pode-se integrar um serviço de envio de código numérico via WhatsApp (ex: Twilio ou Z-API) para autenticar o cliente com segurança e praticidade, sem exigir senhas complexas.
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
