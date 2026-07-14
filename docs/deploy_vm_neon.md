# Guia de Deploy: VM Google Cloud + PostgreSQL no Neon

Coloca o site no ar de verdade, com a arquitetura separada:
- **App** (backend Node + front estático) na sua VM do Google Cloud (Oregon).
- **Banco** PostgreSQL no Neon (grátis, separado da VM).

Legenda: 💻 = terminal da VM (via SSH) · 🌐 = navegador · 📝 = editar arquivo

> Pré-requisitos que dependem de você / da Uemura:
> - Acesso SSH à VM (você já tem).
> - Uma conta no Neon (grátis, criar no passo 1).
> - Para receber dinheiro real: CNPJ + credenciais de produção do Mercado Pago
>   (pode subir sem isso primeiro, no PIX simulado).

---

## Passo 1 — Criar o banco no Neon (🌐 NAVEGADOR)

1. Acesse `https://neon.tech` e crie uma conta grátis (login com GitHub serve).
2. Crie um projeto novo (ex: "uemura"). Escolha a região mais próxima disponível.
3. O Neon te dá uma **connection string**, algo como:
   ```
   postgresql://usuario:senha@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Copie e guarde** essa string. É o `DATABASE_URL` de produção.

---

## Passo 2 — Trocar o Prisma para PostgreSQL (📝 no seu PC, commit)

No arquivo `backend/prisma/schema.prisma`, troque o provider:

```prisma
datasource db {
  provider = "postgresql"   // era "sqlite"
  url      = env("DATABASE_URL")
}
```

Commit e push essa mudança. (A `url` já lê do ambiente, não precisa mexer.)

> Nota: SQLite e PostgreSQL têm tipos compatíveis neste schema, então a troca
> é só o provider. Se aparecer erro de tipo no `db push`, me chame.

---

## Passo 3 — Preparar a VM (💻 SSH na VM)

Conecte na VM e instale o que falta (Node, Nginx, pm2, git):

```bash
sudo apt update
sudo apt install -y nginx git
# Node 20+ (se ainda nao tiver):
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
# pm2 (mantem o backend rodando pra sempre):
sudo npm install -g pm2
```

Clone o projeto:

```bash
cd ~
git clone https://github.com/rsc3-pixel/uemura.git
cd uemura
```

---

## Passo 4 — Configurar o backend (💻 SSH na VM)

```bash
cd ~/uemura/backend
npm install
```

Crie o arquivo `.env` de produção:

```bash
nano .env
```

Cole (trocando pelos valores reais):

```env
DATABASE_URL=postgresql://...cole-a-string-do-neon...?sslmode=require
ADMIN_TOKEN=escolha-uma-senha-forte-aqui
CORS_ORIGIN=https://uemurafloresplantas.com.br
PORT=3001
# Só quando tiver Mercado Pago de produção:
# MP_ACCESS_TOKEN=APP_USR-...
# WEBHOOK_URL=https://uemurafloresplantas.com.br/api/webhooks/pagamento
```

Aplique o schema no banco do Neon e compile:

```bash
npm run db:push    # cria as tabelas no Neon
npm run build      # compila para dist/
```

Suba o backend com pm2:

```bash
pm2 start npm --name uemura-api -- start
pm2 save
pm2 startup    # siga a instrução que ele imprimir (faz subir sozinho no boot)
```

Teste: `curl http://localhost:3001/api/status` deve responder OK.

---

## Passo 5 — Construir o front (💻 SSH na VM)

```bash
cd ~/uemura
npm install
npm run build     # gera a pasta dist/ com o site estático
```

O front vai chamar a API no mesmo domínio (via Nginx), então não precisa
de `VITE_API_URL` (fica relativo). Se quiser fixar, crie `.env.local` com
`VITE_API_URL=https://uemurafloresplantas.com.br` antes do build.

---

## Passo 6 — Configurar o Nginx (💻 SSH na VM)

```bash
sudo nano /etc/nginx/sites-available/uemura
```

Cole (troque o `server_name` pelo domínio ou IP da VM):

```nginx
server {
    listen 80;
    server_name uemurafloresplantas.com.br;

    # Front: arquivos estáticos do React
    root /home/SEU_USUARIO/uemura/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API: repassa pro backend Node
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Ative e recarregue:

```bash
sudo ln -s /etc/nginx/sites-available/uemura /etc/nginx/sites-enabled/
sudo nginx -t        # testa a config
sudo systemctl reload nginx
```

Agora o site abre pelo IP da VM (ou domínio, se já apontou o DNS).

---

## Passo 7 — HTTPS grátis (💻 SSH na VM) — só com domínio apontado

Depois que o domínio `uemurafloresplantas.com.br` estiver apontando pro IP da VM:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d uemurafloresplantas.com.br
```

O Certbot configura o HTTPS sozinho e renova automático.

---

## Passo 8 — Firewall da VM (🌐 painel do Google Cloud)

No Google Cloud, garanta que a VM permite tráfego HTTP (80) e HTTPS (443).
Geralmente marcar "Permitir tráfego HTTP/HTTPS" nas configurações da VM basta.

---

## Atualizar o site depois (💻 SSH na VM)

Quando você fizer mudanças e der push no GitHub:

```bash
cd ~/uemura
git pull
cd backend && npm install && npm run build && pm2 restart uemura-api && cd ..
npm install && npm run build
sudo systemctl reload nginx
```

---

## Para receber dinheiro real (quando a Uemura tiver CNPJ)

1. A Uemura tira o **Production Access Token** (`APP_USR-...`) no Mercado Pago Developers.
2. Na VM, edite `backend/.env`: preencha `MP_ACCESS_TOKEN` e `WEBHOOK_URL`.
3. `pm2 restart uemura-api`.
4. No painel do Mercado Pago, cadastre a URL do webhook e ative eventos de `payments`.

Detalhes em `docs/producao_real.md`.

---

## Comandos úteis na VM

| Ação | Comando |
| :--- | :--- |
| Ver se o backend está no ar | `pm2 status` |
| Ver logs do backend | `pm2 logs uemura-api` |
| Reiniciar o backend | `pm2 restart uemura-api` |
| Testar config do Nginx | `sudo nginx -t` |
| Recarregar o Nginx | `sudo systemctl reload nginx` |
