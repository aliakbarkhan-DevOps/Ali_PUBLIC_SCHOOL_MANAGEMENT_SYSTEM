FROM node:18.19-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install && npm cache clean --force
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 3002
CMD ["npm", "run", "dev"]
