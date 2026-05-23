FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
COPY keys ./keys

EXPOSE 5000

CMD ["node", "src/server.js"]