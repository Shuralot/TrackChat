#Dockefile
FROM node:20-alpine
WORKDIR /app

ARG NEXT_PUBLIC_SOCKET_URL
ARG DATABASE_URL

ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
ENV DATABASE_URL=${DATABASE_URL}

COPY package*.json ./
RUN npm install

COPY . .

RUN DATABASE_URL="$DATABASE_URL" npx prisma generate
RUN npm run build

EXPOSE 3000

ENTRYPOINT ["sh", "-c"]
CMD ["npx prisma migrate deploy && npm start"]
