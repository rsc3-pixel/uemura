# Guia de Implantação: Produção Real Sem Simuladores (Mocks)

Este guia prático detalha os passos necessários para desativar os ambientes de testes e colocar o e-commerce da **Uemura Flores e Plantas** em produção oficial no ar, aceitando vendas e fretes reais.

---

## 1. Migração de Pagamentos (Mercado Pago de Produção)

Atualmente, o site gera PIX de homologação usando chaves de Sandbox. Para transacionar dinheiro real:

### Passos de Configuração:
1. **Cadastro Oficial:** A Uemura precisa criar ou utilizar a conta jurídica deles no portal do Mercado Pago.
2. **Obtenção de Credenciais:** Acessar o site do [Mercado Pago Developers](https://developers.mercadopago.com/) com a conta logada.
3. **Formulário de Homologação:** Preencher a solicitação de ativação de credenciais de produção (exige CNPJ, dados de faturamento e informações básicas do negócio).
4. **Coleta de Chaves:** No menu de credenciais de produção, copiar o **Production Access Token** (que inicia com `APP_USR-`).
5. **Configuração de Variáveis de Ambiente:** Substituir o token fixo no backend por variáveis de ambiente.
   * Crie um arquivo `.env` na pasta do backend:
     ```env
     MP_ACCESS_TOKEN=APP_USR-COLOQUE-AQUI-SUA-CHAVE-DE-PRODUCAO
     ```
   * O arquivo `pedidos.ts` lerá automaticamente a chave real do ambiente via `process.env.MP_ACCESS_TOKEN`.

---

## 2. Configuração do Webhook Oficial (HTTPS)

O Mercado Pago precisa notificar o servidor da Uemura quando o cliente pagar o PIX. 

### Passos de Configuração:
1. **Hospedagem do Servidor:** O backend Node.js precisa ser publicado em um servidor de nuvem com endereço público e criptografia HTTPS ativa (ex: Render, Fly.io, AWS ou DigitalOcean).
2. **Ajuste da URL de Retorno:** No arquivo `pedidos.ts`, alterar o parâmetro `notification_url` para apontar para o domínio público da Uemura:
   ```typescript
   notification_url: 'https://api.uemurafloresplantas.com.br/api/webhooks/pagamento'
   ```
3. **Liberação no Painel do MP:** Acessar o menu de Notificações Webhook no painel do Mercado Pago Developers, cadastrar a mesma URL acima e marcar a opção de escutar eventos de `payments` (pagamentos).

---

## 3. Conexão Oficial com a API dos Correios

No momento, o site calcula preços reais baseados em dados tabelados por regiões do Brasil de forma independente. Para usar a API direta dos Correios conectada ao contrato da Uemura:

### Passos de Configuração:
1. **Contrato Corporativo:** A Uemura precisa ter um contrato corporativo ativo no **Portal Correios Fácil** (o que garante descontos no frete).
2. **Acesso ao Sigep Web / API REST:** Obter as chaves de integração (Usuário, Senha e Código de Acesso à API REST dos Correios).
3. **Substituição do Serviço:** No arquivo `frete.ts`, substituir a lógica de estimativa pela requisição HTTP oficial à API de Preços e Prazos dos Correios, enviando o Token OAuth2 obtido na autenticação deles e o código de serviço de entrega contratado (ex: SEDEX Faturado, PAC Faturado).

---

## 4. Infraestrutura de Servidor e Banco de Dados (Produção)

Para suportar alto fluxo de acessos simultâneos e backups automáticos garantindo a segurança dos dados:

### Passos de Configuração:
1. **Migração do Banco (SQLite para PostgreSQL/MySQL):** O banco SQLite (em arquivo local) é ótimo para desenvolvimento, mas para produção deve-se migrar para um banco gerenciado de nuvem como **PostgreSQL**.
   * No Prisma, basta alterar a linha no arquivo `schema.prisma`:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }
     ```
   * Rodar o comando `npx prisma db push` apontando para o banco de dados PostgreSQL na nuvem para criar a estrutura idêntica na hora.
2. **Hospedagem do Front-End:** Publicar a pasta compilada `dist/` do React em plataformas de CDN gratuitas e ultra-rápidas como **Vercel** ou **Netlify**.
3. **Domínio:** Apontar as configurações de DNS do domínio oficial `uemurafloresplantas.com.br` para os servidores da Vercel (Front) e da hospedagem do Backend.
