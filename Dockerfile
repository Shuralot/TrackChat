FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Gera os artefatos do Prisma (não precisa de DB_URL)
RUN npx prisma generate

# Faz o build do Next.js
RUN npm run build

EXPOSE 3000

# O segredo está aqui: A migração roda AO INICIAR o container
CMD npx prisma migrate deploy && npm start