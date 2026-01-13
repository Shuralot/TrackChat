FROM node:20-alpine

WORKDIR /app

# 1️⃣ Recebe a URL do socket no momento do build (Essencial para Next.js)
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

# 2️⃣ Instala dependências
COPY package*.json ./
RUN npm ci

# 3️⃣ Prepara o Prisma (Gera o client antes do build do código)
COPY prisma ./prisma/
RUN npx prisma generate

# 4️⃣ Copia o código e gera o build de produção
COPY . .
RUN npm run build

EXPOSE 3000

# 5️⃣ Sincroniza o banco e inicia o servidor
# O 'db push' garante que as tabelas existam na sua VPS
CMD ["sh", "-c", "npx prisma db push && npm start"]