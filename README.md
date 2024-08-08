# Software Architecture Group 7 Assignment 1

## How to launch the Web App:

### 1. You have to need those installed in your PC:

a) Node.js (with npm)

b) MongoDB (with a database for book review models)

### 2. Clone the repository

```
git init
git clone https://github.com/GonzaVice/assignment1-g7.git
```

### 3. Install express, mongoose, dotenv, ejs, method-override y faker-js

```
npm i express mongoose dotenv ejs method-override @faker-js/faker
```

### 4. Create .env file for MongoDB credentials

Example: (with host = 'localhost:27017' and database = 'libros_criticas_db')

```
MONGODB_URI=mongodb://localhost:27017/libros_criticas_db
PORT=3000
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
