FROM node:22-alpine
WORKDIR /app

# Dépendances d'abord pour profiter du cache Docker
COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
USER node
EXPOSE 4000
CMD ["node", "server.js"]
