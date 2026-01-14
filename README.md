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
EXTERNAL_HOST=localhost # Na VPS, mude para o IP ou domínio
PORT_APP=6666
PORT_SOCKET=7777

# Banco
POSTGRES_USER=Batata
POSTGRES_PASSWORD=Batata26
POSTGRES_DB=BatataDB
DATABASE_URL=postgresql://Batata:Batata26@db:5432/BatataDB

# URLs
NEXT_PUBLIC_SOCKET_URL=http://${EXTERNAL_HOST}:${PORT_SOCKET}
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
