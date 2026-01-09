# socket/Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
# garante typings do ws
RUN npm install --save-dev @types/ws
COPY . .

RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
