# Uemura Flores e Plantas

E-commerce full stack para a floricultura Uemura Flores e Plantas, construído como
repaginação do site legado da loja (plataforma Boxloja, jQuery 1.7.2 e checkout em
iframe). O diagnóstico que originou o projeto está em [`Dossie_AnaliseUemura.md`](Dossie_AnaliseUemura.md).

## Stack

**Front-end:** React 19, Vite, TypeScript, CSS Modules, Framer Motion, Lucide React.
Estado global da sacola e dos favoritos via React Context.

**Back-end:** Node.js, Express, Prisma ORM, SQLite. Integração com Mercado Pago para
geração de PIX dinâmico, com contingência local quando o gateway está indisponível.

## Rodando o projeto

Requer Node.js 20+ e `make`.

```bash
make install    # instala dependências do front e do backend
make db-push    # cria o banco SQLite e roda o seed de produtos
make dev        # sobe front (5173) e backend (3001) em paralelo
```

Sem `make`, os mesmos passos manualmente:

```bash
npm install && cd backend && npm install && cd ..
cd backend && npx prisma db push && cd ..
npm run dev              # terminal 1
cd backend && npm run dev  # terminal 2
```

## Variáveis de ambiente

O backend lê o token do Mercado Pago do ambiente. Copie o exemplo e preencha:

```bash
cp backend/.env.example backend/.env
```

Sem `MP_ACCESS_TOKEN` o servidor sobe normalmente e cai na contingência local,
gerando um PIX simulado. Nenhuma credencial fica versionada no repositório.

## Regras de negócio principais

**Restrição de entrega de plantas vivas.** Se a sacola contém qualquer planta viva, a
entrega fica limitada à Grande São Paulo, via motoboy (R$ 15). Vasos e acessórios sozinhos
liberam PAC e SEDEX para todo o Brasil. Implementado em [`backend/src/routes/frete.ts`](backend/src/routes/frete.ts).

**Cupons validados no servidor.** O desconto é recalculado no backend e incide apenas
sobre os produtos, nunca sobre o frete, o que impede manipulação de preços pelo console
do navegador.

**Avaliação só após entrega.** O formulário de review é liberado apenas quando o pedido
atinge o status `Entregue`, garantindo depoimentos legítimos.

O conjunto completo de regras, para cliente e para a equipe da loja, está em
[`docs/rulebook_uemura.md`](docs/rulebook_uemura.md).

## Documentação

| Arquivo | Conteúdo |
| :--- | :--- |
| [`docs/projeto_consolidado.md`](docs/projeto_consolidado.md) | Arquitetura, modelo de dados e todos os endpoints da API |
| [`docs/rulebook_uemura.md`](docs/rulebook_uemura.md) | Regras de negócio do cliente e do vendedor |
| [`docs/producao_real.md`](docs/producao_real.md) | Passos para sair do sandbox e ir para produção |
| [`docs/walkthrough.md`](docs/walkthrough.md) | Passo a passo de uso do sistema |
| [`docs/proposta_comercial.md`](docs/proposta_comercial.md) | Proposta comercial apresentada ao cliente |
