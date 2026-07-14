# Guia de Comandos para Ensaiar a Demo

Dois tipos de passo aqui:
- 🖥️ **TERMINAL** = você digita no terminal do VS Code
- 🌐 **NAVEGADOR** = você faz no Chrome, com o mouse

---

## PARTE 1 — Ligar tudo (🖥️ TERMINAL)

Abra um terminal no VS Code, na pasta do projeto, e rode:

```
make dev
```

Espere aparecer estas duas linhas (pode levar uns 10 segundos):
```
Servidor Uemura rodando em http://localhost:3001
Local:   http://localhost:5173/
```

Quando aparecerem, está no ar. **Deixe esse terminal aberto e não mexa nele.**

> Se der erro `porta já em uso` (EADDRINUSE), veja a PARTE 4 (desligar) primeiro,
> depois rode `make dev` de novo.

---

## PARTE 2 — Abrir o site (🌐 NAVEGADOR)

1. Abra o Chrome.
2. Vá em: `http://localhost:5173`
3. Aperte **Ctrl + Shift + R** (recarrega limpo, importante).

Você deve ver a home verde com "Tradição e Beleza no Verde" e os produtos.

---

## PARTE 3 — O ensaio (🌐 NAVEGADOR)

Faça na ordem, sem fechar o carrinho no meio.

### Passo 1 — Adicionar produtos
- Role até os produtos.
- Clique em **Adicionar** em uma ou duas plantas (ex: o Tomate cereja).

### Passo 2 — Abrir a sacola
- Clique no ícone da **sacola** (canto superior direito, o último ícone).

### Passo 3 — Frete de São Paulo
- No campo CEP, digite: `01310100`  (SÓ números, sem hífen)
- Clique no botão do caminhãozinho.
- **Deve aparecer:** Entrega Expressa Uemura (Motoboy) — R$ 15,00.

### Passo 4 — Frete de outro estado (o momento-ouro)
- Apague e digite: `54440130`  (Recife)
- Clique no caminhãozinho.
- **Deve aparecer:** Correios SEDEX — "Envio na próxima segunda + 2 a 4 dias".
- (Volte pro CEP de SP `01310100` para seguir a compra com o motoboy.)

### Passo 5 — Cupom de desconto
- No campo de cupom, digite: `PLANTAS15`
- Clique no botão do cupom.
- **Deve aparecer:** "Cupom PLANTAS15 aplicado (15% de desconto)" e a linha de desconto.

### Passo 6 — Finalizar e pagar
- Clique em **Finalizar Compra**.
- Preencha Nome, Telefone e E-mail.
- Clique em **Confirmar Pedido**.
- **Deve aparecer:** o QR Code do PIX na tela.

### Passo 7 — Acompanhar a entrega
- Feche a sacola e clique no ícone de **pessoa / Área do Cliente**.
- Digite o telefone que você usou no Passo 6.
- **Aparece um código na tela** (é o login por segurança). Digite esse código.
- Abra o pedido e use os botões para avançar:
  Confirmar Pago → Preparando → Em Rota → Entregue.
- A cada clique, aparece uma **notificação** no canto. Com "Entregue", libera a
  **avaliação** e o **guia de cuidados** da planta.

---

## PARTE 4 — Desligar tudo (🖥️ TERMINAL)

Quando terminar o ensaio:

- No terminal do `make dev`, aperte **Ctrl + C**.

Se algum servidor continuar preso na porta (o site ainda abre depois do Ctrl+C),
rode isto em outro terminal para forçar o encerramento:

```
make kill
```

Ele mostra "Portas 3001 e 5173 liberadas." quando termina.

---

## Se travar durante o ensaio

- **Site não carrega / botão não responde:** Ctrl+Shift+R no navegador.
- **Ainda travado:** no terminal, Ctrl+C, depois `make dev` de novo (10 seg).
- **Erro no frete:** confira que digitou o CEP **só com números**.
- **NUNCA edite arquivos do projeto durante a demo** — salvar reinicia o motor.

---

## Dados prontos para usar

| Item | Valor |
| :--- | :--- |
| CEP São Paulo | `01310100` |
| CEP outro estado | `54440130` |
| Cupom (15% off) | `PLANTAS15` |
| Cupom (10% off) | `UEMURA10` |
| Produtos bons | Tomate (R$ 34), Jibóia (R$ 140) |
