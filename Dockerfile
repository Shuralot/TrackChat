FROM node:20-alpine
WORKDIR /app

ARG NEXT_PUBLIC_SOCKET_URL

COPY package*.json ./
RUN npm install

COPY . .

RUN DATABASE_URL="postgresql://docker:docker@localhost:5432/docker" npx prisma generate
RUN npm run build

EXPOSE 3000

ENTRYPOINT ["sh", "-c"]
CMD ["npx prisma migrate deploy && npm start"]
