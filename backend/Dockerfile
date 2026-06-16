FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache wget

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY lib/ ./lib/
COPY data/ ./data/

RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server.js"]
