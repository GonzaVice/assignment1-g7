FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN useradd -m myuser

USER myuser

EXPOSE 3000

CMD ["node", "app.js"]