FROM node:20-alpine

WORKDIR /app

# 1️⃣ Dependências
COPY package*.json ./
RUN npm install

# 2️⃣ Código inteiro
COPY . .

# 3️⃣ Prisma (AGORA no lugar certo)
RUN npx prisma generate

# 4️⃣ Build do Next
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
