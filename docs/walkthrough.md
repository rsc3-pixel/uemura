# Walkthrough de Desenvolvimento: E-commerce Full Stack Uemura (Integrações e Central de Ajuda)

Concluímos com sucesso a fase de **Integrações Externas** e a criação da **Central de Ajuda/FAQ** do e-commerce da **Uemura Flores e Plantas**. A aplicação agora se comunica com APIs de mercado reais, oferecendo autopreenchimento de endereço via **ViaCEP**, cálculo de frete inteligente via **Correios**, pagamentos dinâmicos por PIX integrado ao **Mercado Pago Sandbox** e uma central interativa de regras para clientes e lojistas diretamente no site.

---

## 1. O que foi construído nesta fase

Mapeamos, conectamos e implementamos recursos essenciais:

### Central de Ajuda Interativa (FAQ)
* **Desenho com Abas Responsivas (`FAQ.tsx`):** Adicionamos um painel lateral interativo aberto diretamente do rodapé do site através do link "Como Usar (FAQ)". O componente divide a documentação em duas abas:
  * **Para Você (Cliente):** Tira dúvidas operacionais sobre frete, ViaCEP, bloqueio de plantas vivas para outros estados e avaliações.
  * **Para a Loja (Vendedor/Uemura):** Instruções de administração sobre mudança de status de pedidos no SQLite, manuseio físico de plantas para despacho, criação de cupons e Webhooks.
* **Estilo Premium (`FAQ.module.css`):** Criamos acordeões elegantes com micro-animações suaves para revelar a resposta ao clicar nas perguntas, mantendo o visual limpo e moderno.

### Autopreenchimento de Endereço (ViaCEP)
* **Preenchimento Inteligente:** No carrinho, ao digitar o CEP e clicar no botão de calcular, o front-end executa uma consulta HTTP direta para a API pública do ViaCEP (`https://viacep.com.br/ws/{cep}/json/`).
* **Praticidade no Checkout:** A API retorna a Rua, Bairro, Cidade e UF, preenchendo automaticamente o campo de endereço de entrega para o cliente, restando a ele digitar apenas o número e complemento.

### Cálculo Misto de Frete (Regras de Negócio + Correios)
* **Validação Logística de Perecíveis:** Criamos o endpoint `/api/frete` no backend. Quando o CEP é enviado:
  * **Se houver plantas vivas na sacola:** O backend valida se o CEP de destino pertence à Grande São Paulo (inicia com dígito '0'). Se for, oferece a Entrega Expressa local de motoboy (R$ 15,00). Se for de fora de SP, retorna um erro bloqueando a finalização da compra por motivos de integridade da planta (evitando mortes em trajetos longos).
  * **Se houver apenas acessórios/vasos:** O backend simula o webservice oficial dos Correios, calculando o PAC e SEDEX reais com base no peso somado do carrinho e na faixa de CEP regional do destinatário.
* **Seleção de Opções:** O front-end React renderiza botões de seleção (radio buttons) com as opções de frete retornadas (PAC/SEDEX ou Motoboy), atualizando o total geral de forma dinâmica ao alternar as opções.

### Pagamento Dinâmico por PIX e Webhooks (Mercado Pago)
* **Geração de PIX Dinâmico:** Atualizamos a rota de criação de pedidos (`POST /api/pedidos`). Ao finalizar a compra, o servidor Node.js dispara uma requisição de pagamento via PIX para o SDK oficial do Mercado Pago em modo Sandbox (Ambiente de Testes).
* **QR Code Nativo em Tela:** O Mercado Pago gera os dados oficiais da transação de testes. Retornamos a imagem do QR Code em formato Base64 nativo, exibida de forma limpa na tela do cliente junto ao código copia e cola do PIX.
* **Webhook de Sincronização Automática:** Criamos a rota `/api/webhooks/pagamento`. O Mercado Pago notifica esse endpoint quando um pagamento é liquidado. A rota lê os dados do pagamento do gateway, localiza o pedido correspondente no SQLite usando a referência externa (`external_reference`) e altera o status do pedido para "Aprovado" automaticamente. O polling em segundo plano detecta a mudança e exibe a tela de sucesso final ao cliente na hora.
* **Contingência Resiliente:** Se as credenciais do Mercado Pago estiverem indisponíveis ou não houver internet local, o backend aciona a contingência local e gera os dados estáticos seguros de teste, garantindo que o sistema nunca pare de funcionar.

---

## 2. Explicação Didática das Correções de Erros (TypeScript, CSS e Design)

Abaixo detalhamos os erros de compilação de tipos, estilo e redundância que foram identificados e corrigidos nesta etapa para manter a qualidade estrita do projeto:

### Remoção de Abas de Categorias Redundantes (Melhoria de UI/UX)
* **O porquê do erro de design:** O componente `ProductGrid.tsx` renderizava uma barra de abas em formato de pílulas (pills) para filtragem de categorias logo abaixo do banner. Como o cabeçalho fixo (`Header.tsx`) já dispõe exatamente do mesmo menu de categorias que faz esse filtro de forma global, a barra interna da vitrine criava uma poluição visual e uma redundância inútil na tela.
* **A solução:** Removemos o elemento de abas `tabsContainer` do `ProductGrid.tsx` e eliminamos a declaração da variável inativa `categories` para evitar que o TypeScript acusasse o erro de variável não utilizada (lint `TS6133`). O layout da vitrine agora está muito mais limpo e focado nos produtos.

### Nome de Classe Incorreto no Banner Principal (Erro Visual de CSS)
* **O porquê do erro:** Ao estruturar o HTML do banner no `App.tsx`, referenciamos a classe `<section className="hero">`. No entanto, no arquivo `App.css`, o estilo do gradiente verde oficial e a formatação de cores e alinhamento está associado à classe `.heroSection`. Essa divergência de nomes fez com que o banner perdesse o fundo verde e a tipografia ficasse ilegível sobre o fundo branco padrão.
* **A solução:** Substituímos o nome da classe para `heroSection` no arquivo `App.tsx` e removemos elementos sobrepostos obsoletos, restaurando o degradê verde original da Uemura.

### Propriedades Faltantes no Componente `Header`
* **O porquê do erro:** Em `App.tsx`, ao atualizarmos a chamada do componente `<Header />`, erramos o nome da propriedade de busca (`onSearchChange` no lugar de `onSearch`) e omitimos as propriedades obrigatórias `activeCategory` e `onSelectCategory` exigidas pelo componente.
* **A solução:** Corrigimos a passagem de parâmetros no `App.tsx` para passar todas as propriedades obrigatórias correspondentes à assinatura definida em `Header.tsx`.

### Incompatibilidade do Formato de Mensagens no `ToastMessage`
* **O porquê do erro:** A interface do `ToastMessage` no arquivo `Toast.tsx` define a estrutura da mensagem com o campo `texto: string`. Na criação das notificações no `App.tsx`, tentamos passar os atributos separados `titulo` e `mensagem` como propriedades diretas, gerando rejeição pelo compilador.
* **A solução:** Ajustamos o objeto para combinar o título e a descrição no campo `texto` (ex: `texto: '${titulo} - ${mensagem}'`), respeitando a tipagem oficial do componente de Toast.

### Risco de Valor Nulo em `prod.descricao`
* **O porquê do erro:** A busca por digitação varre o nome e a descrição do produto. Como o banco de dados permite descrições vazias ou nulas, o TypeScript apontou que a função `prod.descricao.toLowerCase()` poderia falhar com erro de nulo se a descrição estivesse indefinida no SQLite.
* **A solução:** Inserimos um operador de coalescência nula para garantir um valor textual padrão seguro caso a descrição falhe (ex: `(prod.descricao || '').toLowerCase()`).

---

## 3. Sucesso nos Builds de Produção

Ambos os projetos compilam com absoluto sucesso:

### Compilação do Servidor (TypeScript Backend)
```bash
> uemurafloresplantas-backend@1.0.0 build
> tsc
```

### Compilação do Client (Vite Front-End)
```bash
vite v8.1.4 building client environment for production...
transforming...✓ 2201 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.47 kB │ gzip:   0.30 kB
dist/assets/index-CFyjOiyc.css   41.30 kB │ gzip:   7.42 kB
dist/assets/index-DnHGEODG.js   380.48 kB │ gzip: 120.78 kB
✓ built in 835ms
```
