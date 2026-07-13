# Dossiê de Análise e Proposta de Repaginação: Uemura Flores e Plantas

Este documento apresenta uma análise técnica e estética detalhada do site atual da **Uemura Flores e Plantas** (https://www.uemurafloreseplantas.com.br/), identificando gargalos na experiência do usuário (UX), problemas de SEO, limitações técnicas e propostas práticas para uma repaginação moderna e de alta conversão.

---

## 1. Visão Geral e Tecnologia Atual

O site foi desenvolvido sobre a plataforma brasileira **Boxloja**, utilizando um template básico adaptado (desenvolvido por Vanessa Pereira). A plataforma em si atende a requisitos básicos de e-commerce, mas a implementação atual apresenta tecnologias obsoletas que prejudicam a velocidade, a segurança e a experiência do usuário.

### Ficha Técnica do Site Atual

| Item | Tecnologia / Situação | Impacto / Risco |
| :--- | :--- | :--- |
| **Plataforma** | Boxloja (Loja Virtual Standard) | Customização visual restrita e checkout engessado. |
| **Biblioteca JS** | jQuery 1.7.2 (Lançada em 2012) | Versão extremamente antiga com vulnerabilidades conhecidas de segurança (XSS). |
| **Visualizador de Imagens** | prettyPhoto 3.1.5 | Plugin desatualizado com brechas de segurança documentadas. |
| **Estrutura de Checkout** | Iframe externo no Carrinho | Reduz drasticamente a conversão e quebra a responsividade no mobile. |
| **SEO Básico** | Metadados vazios ou ausentes | Baixo ranqueamento orgânico no Google para buscas de plantas em SP. |

---

## 2. Análise de Pontos Críticos e Gargalos

### 2.1. Experiência de Compra e o Carrinho (Iframe)
O maior gargalo de conversão do site atual está na página de carrinho. O checkout é carregado dentro de um `<iframe>` que aponta para a URL externa da plataforma.
* **Problema de UX:** A barra de rolagem dupla (da página e do iframe) confunde o usuário em telas menores. O preenchimento de dados de endereço e cartão de crédito em um iframe é desconfortável e gera desconfiança de segurança.
* **Problema Mobile:** Em dispositivos móveis, iframes frequentemente não redimensionam corretamente, cortando botões importantes como "Finalizar Compra".

### 2.2. Design, Layout e Estética (Aparência Datada)
O layout atual transmite a sensação de um site construído no início da década de 2010.
* **Cores e Contraste:** O esquema de cores e o uso excessivo de gradientes e bordas pesadas deixam a interface poluída.
* **Imagens de Produtos:** A galeria de produtos usa imagens com formatos inconsistentes (algumas com fundo branco, outras com fotos reais no local). A falta de padronização visual empobrece o catálogo.
* **Slideshow Vazio:** O código-fonte revela uma lista de slideshow (`rslides`) vazia na página inicial, indicando que banners promocionais importantes podem não estar sendo exibidos ou estão quebrados.

### 2.3. Navegação e Menus
* **Menus Suspensos de Categorias:** O menu de categorias exige cliques para abrir subcategorias, o que torna a navegação truncada no desktop. O comportamento esperado pelo usuário moderno é um menu expansível sob hover (passar o mouse) de forma suave.
* **Busca Interna:** O sistema de busca é muito simples e não possui autocompletar inteligente (busca preditiva), algo essencial para floriculturas com nomes científicos complexos.

### 2.4. SEO (Otimização para Mecanismos de Busca)
A loja perde muito tráfego orgânico (gratuito) do Google devido à falta de otimização básica:
* A tag `<meta name="description">` e as tags do Open Graph (`og:image`, `og:description`) estão totalmente vazias.
* As URLs do catálogo usam IDs numéricos misturados ao texto, como `/pagina/755b4/flores-diversas` e `/210947/tomate-pote-14-cm`, o que reduz a relevância das palavras-chave para o algoritmo do Google.

---

## 3. Proposta de Repaginação (Redesign)

Para reposicionar a Uemura Flores e Plantas como uma marca premium, moderna e confiável, sugerimos duas abordagens de implementação.

### Opção A: Migração para uma Plataforma Moderna
Migrar a operação para plataformas mais flexíveis e com ecossistemas ricos de design e frete (como **Shopify** ou **Nuvemshop**).

* **Vantagens:**
  * Checkout nativo em uma única página (One-Page Checkout) otimizado para celulares.
  * Integrações diretas de frete local expresso (moto-entrega para flores em SP).
  * Painel de gerenciamento moderno e relatórios de vendas eficientes.
  * Templates modernos com design fluido, limpo e responsivo.

### Opção B: Redesenho do Front-End mantendo a Boxloja (Nossa abordagem selecionada)
Reescrever completamente o tema front-end da loja utilizando os recursos permitidos pela Boxloja de forma manual e limpa.

* **Diretrizes para o novo Front-End:**
  * **Abordagem Mobile-First:** Todo o layout deve ser desenhado prioritariamente para o celular, simplificando o menu de categorias em um menu lateral limpo.
  * **Aesthetics Premium:** Utilizar uma paleta de cores natural, com tons de verde oliva macio, areia e off-white, valorizando as fotos coloridas das plantas.
  * **Tipografia Atual:** Substituir a fonte padrão por famílias tipográficas modernas como Inter ou Outfit via Google Fonts.
  * **Remoção de Código Antigo:** Substituir o jQuery antigo e plugins como prettyPhoto por soluções nativas modernas (JavaScript Vanilla moderno, CSS Grid e Flexbox).

---

## 4. Estrutura Proposta para a Nova Interface (UX Wireframe)

Abaixo apresentamos a hierarquia visual ideal para a nova página inicial, focando na conversão e na beleza natural dos produtos:

```mermaid
graph TD
    A[Topo: Barra de Avisos - Frete Gratis SP / Cupom] --> B[Cabecalho: Logo Centralizado + Busca Preditiva + Carrinho Icone]
    B --> C[Menu de Navegacao: Flores de Corte | Vasos | Acessorios | Novidades]
    C --> D[Banner Principal: Fotos ambientadas de alta qualidade de plantas em casa]
    D --> E[Faixa de Diferenciais: Entrega no mesmo dia | Suporte Whatsapp | Embalagem para presente]
    E --> F[Carrossel de Destaques: Colecoes da Estacao]
    F --> G[Grid de Produtos: Mobile-First, com fotos padronizadas e botao Adicionar Rapido]
    G --> H[Rodape: Atendimento, Redes Sociais, Politicas e Selos de Seguranca]
```

---

## 5. Próximos Passos Recomendados

1. **Definição de Plataforma:** Avaliar junto ao cliente a viabilidade de migração de plataforma (para Nuvemshop ou Shopify) visando eliminar o problema de checkout em iframe.
2. **Identidade Visual:** Definir a paleta de cores e tipografia premium para o catálogo de plantas.
3. **Fotografia:** Criar um guia simples para padronização das fotos dos produtos (fundo limpo ou iluminação natural).
4. **Prototipagem:** Desenhar o layout da home e da página de produto em formato responsivo.
