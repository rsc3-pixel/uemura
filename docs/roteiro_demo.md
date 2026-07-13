# Roteiro da Demo — Uemura Flores e Plantas

Guia para apresentar o novo site ao vivo para o dono da Uemura.
Fale a linguagem da floricultura, não de programador.

---

## ANTES DE COMEÇAR (faça sozinho, 5 min antes)

1. **Abra o terminal no VS Code** e rode:
   ```
   make dev
   ```
   Espere aparecer:
   - `Servidor Uemura rodando em http://localhost:3001` (o motor)
   - `Local: http://localhost:5173/` (o site)

2. **Abra o Chrome em** `http://localhost:5173` e dê um **Ctrl+Shift+R** (recarrega limpo).

3. **Comece do zero:** carrinho vazio, nenhum painel aberto, na página inicial.

4. **REGRA DE OURO:** depois que subir, **não mexa em nenhum arquivo do projeto**
   durante a demo. Salvar um arquivo reinicia o motor e pode travar na sua frente.

### Dados que você vai usar
- **CEP de São Paulo:** `01310100` (digite SÓ números, sem hífen)
- **CEP de outro estado:** `54440130` (Recife, para mostrar o SEDEX)
- **Cupom de desconto:** `PLANTAS15` (dá 15% de desconto)
- **Produtos bons de buscar:** "Jibóia" (R$ 140), "Tomate" (R$ 34)

---

## O ROTEIRO (siga a ordem)

A história é: **olha que bonito → é fácil comprar → você acompanha a entrega.**

### Cena 1 — A vitrine (30 seg)
- Mostre a página inicial. Deixe ele ver o visual: fotos, o verde, o layout limpo.
- **Fale:** "Esse é o novo site. Abre bonito, rápido, e funciona igual no celular e no computador."
- Passe o mouse nas categorias no topo (Flores e Plantas, Vasos, Acessórios).

### Cena 2 — Buscar e adicionar (1 min)
- Use a **busca** no topo. Digite "jibóia". Mostre que acha na hora.
- Clique no produto e **adicione à sacola**.
- Adicione um "tomate" também.
- **Fale:** "O cliente acha a planta, clica, e já vai pra sacola. Sem complicação."

### Cena 3 — Frete inteligente (2 min) — O PONTO FORTE
- Abra a **sacola**.
- Digite o CEP `01310100` e calcule o frete.
- **Aparece o motoboy, mesmo dia, R$ 15.**
- **Fale:** "Como tem planta viva na sacola e o endereço é aqui na Grande São Paulo,
  o sistema já oferece nosso motoboy, entrega no mesmo dia."

- Agora **troque o CEP** para `54440130` (Recife) e calcule de novo.
- **Aparece o SEDEX, com aviso "Envio na próxima segunda + 2 a 4 dias".**
- **Fale:** "Se o cliente é de outro estado, o sistema manda por SEDEX, o mais rápido,
  e avisa que a planta sai na segunda pra não ficar parada no fim de semana. O site
  cuida da planta sozinho."

> Esse é o momento de ouro. Mostra que o site entende o negócio de plantas.

- Aplique o cupom `PLANTAS15` para mostrar o desconto de 15%.

### Cena 4 — Pagamento por PIX (1 min)
- Preencha nome, telefone e endereço.
- Finalize. **Aparece o QR Code do PIX na tela.**
- **Fale:** "O cliente paga por PIX na hora, direto no site. Sem aquele formulário
  chato de cartão dentro de outra janela, que é o que trava as vendas hoje."

### Cena 5 — Acompanhar a entrega (2 min) — O FINAL
- Vá em **Área do Cliente**.
- Digite o telefone. **Aparece um código de acesso na tela.** Digite o código e entre.
- **Fale:** "O cliente acessa as compras dele com um código de segurança, igual banco.
  Os dados ficam protegidos."
- Abra o pedido e mostre o **rastreamento**. Use os botões para avançar:
  Aprovado → Preparando → Em Rota → Entregue.
- **A cada clique aparece uma notificação.** Mostre isso.
- **Fale:** "Olha, o cliente é avisado na hora que a planta saiu pra entrega."
- Com o pedido "Entregue", mostre que ele pode **avaliar a planta** e que vem o
  **guia de cuidados** (rega, luz, adubo).
- **Fale:** "Depois de receber, o cliente avalia e ainda tem o manual de como cuidar
  da planta. Isso faz ele voltar a comprar."

---

## SE ALGO TRAVAR (plano B)

- **Site não carrega:** dê Ctrl+Shift+R. Se persistir, no terminal aperte Ctrl+C
  e rode `make dev` de novo.
- **Um botão dá erro:** o motor pode ter caído. Reinicie com `make dev`.
- **Nunca abra o código na frente dele.** Se travar de vez, diga com naturalidade
  "deixa eu reiniciar rapidinho" e suba de novo. Leva 10 segundos.

---

## LEMBRETES IMPORTANTES

- Digite o CEP **só com números** (`01310100`), nunca com hífen.
- Os prazos e preços de frete são **estimativas realistas** por enquanto. Quando a
  Uemura tiver contrato com os Correios, viram os valores oficiais.
- Ensaie a demo inteira **uma vez sozinho antes**, cronometrando. Dá uns 6-7 minutos.
