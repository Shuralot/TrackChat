FROM node:20-alpine
WORKDIR /app

# Crucial: Declarar o ARG para o Next.js ler no build
ARG NEXT_PUBLIC_SOCKET_URL

COPY package*.json ./
RUN npm install
COPY . .

# Injetamos a variável no ambiente de build
RUN DATABASE_URL="postgresql://docker:docker@localhost:5432/docker" npx prisma generate

# Aqui o Next.js usará o ARG declarado acima
RUN npm run build

EXPOSE 3000
CMD npx prisma migrate deploy && npm start