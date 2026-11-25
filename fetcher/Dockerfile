FROM node:22-alpine
WORKDIR /app

# Aucune dépendance : fetch et http sont inclus dans Node
COPY server.js ./
USER node
EXPOSE 4000
CMD ["node", "server.js"]
