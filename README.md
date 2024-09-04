# Software Architecture Group 7 Assignment 1

## How to launch the Web App (locally):

### 1. You have to need those installed in your PC:

a) Node.js (with npm)

b) MongoDB (with a database for book review models)

### 2. Clone the repository

```
git init
git clone https://github.com/GonzaVice/assignment1-g7.git
```

### 3. Install express, mongoose, dotenv, ejs, method-override, faker-js y multer

```
npm i express mongoose dotenv ejs method-override @faker-js/faker
```

### 4. Create .env file for MongoDB credentials

Example: (with host = 'localhost:27017' and database = 'libros_criticas_db')

```
MONGODB_URI=mongodb://localhost:27017/libros_criticas_db
PORT=3000
IMAGE_UPLOAD_PATH=uploads/
```

### 5. Populate database

```
node populateDB.js
```

### 6. Execute the web app

```
node app.js
```

### 7. Access the web app with [localhost:3000](http://localhost:3000/)

## How to launch the Web App (Docker):

### 1. Clone the repository

```
git init
git clone https://github.com/GonzaVice/assignment1-g7.git
```

### 2. Run docker containers

Build containers:

```
docker-compose build
```

Run containers:

```
docker-compose up
```

### 3. Access the web app with [localhost:3000](http://localhost:3000/)
