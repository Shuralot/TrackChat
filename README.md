<!-- Projeto: TrackChat - README gerado automaticamente -->

# TrackChat 🚀

**Queue board, chat e painel em tempo real** — Aplicação construída com Next.js, Socket.IO, PostgreSQL e Docker para gerenciar filas e conversas em tempo real entre agentes e usuários.

![Hero GIF](public/images/hero.gif)

<!-- Badges -->
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Docker Hub](https://img.shields.io/badge/docker-hub-blue.svg)](#)
[![Coverage](https://img.shields.io/badge/coverage---%25-yellowgreen.svg)](#)

---

## 🔎 Sobre

O TrackChat é uma aplicação de chat/queue-board que usa WebSockets para comunicação em tempo real. Ideal para atendimentos, monitoramento de filas e painéis de operação.

## ✨ Principais funcionalidades

- Chat em tempo real entre agentes e usuários via WebSocket (Socket.IO).
- Painel/queue board para monitorar atendimentos ativos e em espera.
- Integração com banco PostgreSQL (via Prisma) para persistência.
- APIs HTTP (Next.js route handlers) e webhooks para integrações (ex.: Chatwoot).
- Containerização com Docker e orquestração via Docker Compose.
- Suporte para deploy em VPS ou plataformas que consumam imagens Docker.

## 🧰 Tecnologias

- Next.js (App Router)
- React + TypeScript
- Socket.IO (WebSocket)
- PostgreSQL + Prisma
- Docker & Docker Compose
- Vite/Node (para serviço de socket separado)
- GitHub Actions (CI)

---

## 📸 Screenshots / GIF

Coloque suas imagens em `public/images/` e atualize os caminhos abaixo.

![Interface principal](public/images/screenshot.png)

> Sugestão: crie `public/images/hero.gif` com um curto tour da interface.

---

## 🚀 Execução local (rápido)

Recomendado: Docker e Docker Compose instalados.

1. Copie o arquivo de env de exemplo:

```bash
cp .env.example .env
```

2. Subir serviços com Docker Compose:

```bash
docker-compose up --build
```

3. Acesse a aplicação em `http://localhost:3000` e o serviço de socket no porto configurado (ex.: `3001`).

Dicas:

- Para rodar apenas o frontend em dev:

```bash
pnpm install
pnpm dev
```

- Para logs do socket service (pasta `socket/`):

```bash
cd socket
pnpm install
pnpm dev
```

---

## ☁️ Deploy em produção (resumo)

1. Build da imagem e push para Docker Hub (exemplo):

```bash
docker build -t <SEU_USUARIO>/trackchat-app:latest .
docker push <SEU_USUARIO>/trackchat-app:latest
```

2. Em seu servidor/VPS ou painel (EasyPanel, RunCloud, etc.) crie um container/serviço usando a imagem.

3. Configure variáveis de ambiente e volumes (dados do Postgres).

4. Use um proxy reverso (Nginx, Traefik) para TLS e roteamento WebSocket.

Observação: se separar o serviço `socket/`, faça build e push também para `trackchat-socket`.

---

## ⚙️ Variáveis de ambiente

Crie um `.env` local com as chaves abaixo (exemplo):

| Nome | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexão com Postgres (Prisma) | `postgresql://user:pass@db:5432/trackchat` |
| `NEXT_PUBLIC_WS_URL` | URL pública do servidor WebSocket | `ws://localhost:3001` |
| `NEXTAUTH_URL` | URL base da aplicação (se usar autenticação) | `http://localhost:3000` |
| `PORT` | Porta do Next.js (dev/prod) | `3000` |
| `SOCKET_PORT` | Porta do servidor socket (se separado) | `3001` |
| `DOCKER_COMPOSE_PROJECT` | (opcional) nome do projeto Docker Compose | `trackchat` |

Variáveis de produção: mantenha `DATABASE_URL`, `NEXT_PUBLIC_WS_URL` e credenciais secretas seguras. Use secrets do Docker / do provedor.

---

## 🗂 Estrutura de pastas (resumida)

```
.
├─ app/                 # Next.js App Router (páginas e API routes)
│  ├─ api/              # Endpoints: messages, webhooks
│  └─ dashboard/        # Interface do painel
├─ components/          # Componentes React (Chat, Header, MessageItem)
├─ lib/                 # Prisma, socket helpers
├─ prisma/              # Schema e migrations
├─ public/images/       # Screenshots e GIFs
├─ socket/              # Serviço Node do Socket (se separado)
└─ docker-compose.yml
```

---

## 🤝 Contribuição

- Abra uma issue para discutir mudanças antes de implementar.
- Faça um fork, crie uma branch `feature/nome-da-funcao` e envie um PR.
- Siga o padrão de commits e escreva mensagens claras.

Checklist para PRs:

- [ ] Código formatado
- [ ] Testes (se aplicável)
- [ ] Descrição do que foi alterado

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## ✉️ Contato

- Autor: Seu Nome — email@exemplo.com
- Issues/PRs: use o repositório GitHub para reportar problemas.

---

Obrigado por usar o TrackChat! ✨
# 🚀 TrackChat — AI Atende

**TrackChat** é uma plataforma interna desenvolvida pela **AI Atende** para **monitoramento e visualização em tempo real das mensagens do Chatwoot**, focada em operações de atendimento humano + IA.

---

## 🧠 Visão Geral

- Recebe mensagens via **Webhook do Chatwoot**
- Persiste dados com **PostgreSQL + Prisma**
- Distribui mensagens em tempo real com **Socket.IO**
- Exibe um **dashboard operacional em tempo real** com **Next.js**

---

## 🧩 Arquitetura

```
Chatwoot
  → Webhook (Next.js API)
  → PostgreSQL (Prisma)
  → Socket Server (Express + Socket.IO)
  → Dashboardem tempo real (Next.js)

```

---

## ✨ Funcionalidades

- 📡 Mensagens em tempo real
- 👥 Agrupamento por conversas e grupos do Chatwoot
- 🔔 Notificação sonora de novas mensagens
- 📊 Indicadores operacionais (não lidas, total, status)
- ⚡ Atualização instantânea sem refresh

---

## 🛠️ Stack

### Frontend

- Next.js (App Router)
- React
- TypeScript
- TailwindCSS
- Zustand
- Socket.IO Client

### Backend

- Next.js API Routes
- Express
- Socket.IO
- Prisma ORM
- PostgreSQL
- Docker

---

## 🗄️ Banco de Dados

Modelado para lidar com **contatos, grupos, conversas e mensagens** do Chatwoot.

**Principais entidades:**

- Contact
- Conversation
- Message
- SenderType (USER | AGENT | BOT)

---

## 🔗 Integração com Chatwoot

- Webhook `message_created`
- Suporte a mensagens de usuários, agentes e bots
- Identificação de grupos (ex: WhatsApp Groups)
- Associação automática entre contato, conversa e mensagens

---

## 📦 Estrutura do Projeto

```
app/
 └─ api/
    ├─ messages
    └─ webhooks/chatwoot

lib/
 ├─ prisma.ts
 └─ socket.ts

store/
 └─ chatStore.ts

prisma/
 └─schema.prisma

src/
 └─index.ts  (SocketServer)

```

---

## ⚙️ Variáveis de Ambiente

```
# Rede
APP_SERVICE_NAME=localhost # Na VPS, mude para o IP ou domínio
PORT_APP=6666
PORT_SOCKET=7777

# Banco
POSTGRES_USER=Batata
POSTGRES_PASSWORD=Batata26
POSTGRES_DB=BatataDB
DATABASE_URL=postgresql://Batata:Batata26@db:5432/BatataDB

# URLs
NEXT_PUBLIC_SOCKET_URL=http://${APP_SERVICE_NAME}:${PORT_SOCKET}
SOCKET_SERVER_INTERNAL_URL=http://socket:4000

```

---

## 🚀 Rodando o Projeto

```
npm install
docker compose up -d
npx prisma generate
npx prisma migrate dev
npm run dev

```

Acesse:

[**http://localhost:3000**](http://localhost:3000/)

---

## 🏢 Sobre a AI Atende

A **AI Atende** desenvolve soluções de **automação, monitoramento e inteligência operacional**, integrando **IA + atendimento humano** em escala.

---

## 📄 Licença

Projeto de uso interno da **AI Atende**.
