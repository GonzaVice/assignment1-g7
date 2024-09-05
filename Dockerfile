FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p /app/uploads && chmod 777 /app/uploads

RUN useradd -m myuser

USER myuser

EXPOSE 3000

CMD ["node", "app.js"]