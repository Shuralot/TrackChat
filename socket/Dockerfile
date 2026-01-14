# Dockefile socket
FROM node:20-alpine

WORKDIR /app

# 1️⃣ Instala as dependências
COPY package*.json ./
RUN npm ci

# 2️⃣ Copia o código fonte e o arquivo de configuração do TS
COPY . .

# 3️⃣ Compila o TypeScript para JavaScript (gera a pasta dist)
RUN npm run build

EXPOSE 4000

# 4️⃣ Inicia o servidor usando o arquivo compilado
CMD ["npm", "start"]