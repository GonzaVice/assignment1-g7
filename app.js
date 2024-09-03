const express = require("express");
const redis = require('redis');
const methodOverride = require("method-override"); //Es para hacer PUT y DELETE del CRUD
const path = require("path");
const connectDB = require("./config/db");
require("dotenv").config();

global.__basedir = __dirname;

const app = express();

// Intenta conectarte a Redis
let redisClient;
try {
    redisClient = redis.createClient({
        url: 'redis://localhost:6379', // Cambia la URL si usas otro host/puerto
    });

    redisClient.on('error', (err) => {
        console.error('Error connecting to Redis:', err);
        redisClient = null; // Desactiva Redis si no se puede conectar
    });

    redisClient.connect();
} catch (error) {
    console.error('Redis not available:', error);
    redisClient = null; // Redis no está disponible
}

// Middleware de ejemplo que usa Redis (si está disponible)
app.use(async (req, res, next) => {
    if (redisClient) {
        try {
            // Intenta acceder a Redis
            await redisClient.set('key', 'value');
            const value = await redisClient.get('key');
            console.log('Redis value:', value);
        } catch (err) {
            console.error('Error using Redis:', err);
        }
    } else {
        console.log('Skipping Redis since it is not available.');
    }
    next();
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Configure method-override
app.use(methodOverride("_method"));

// NUEVO: Set view engine
app.set("view engine", "ejs"); // Ese es para las vistas estilo HTML para Express
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/authors", require("./routes/authors"));
app.use("/books", require("./routes/books"));
app.use("/reviews", require("./routes/reviews"));
app.use("/sales", require("./routes/sales"));

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.render("home");
});

app.listen(PORT, () => {
  console.log(`Server corriendo en el puerto ${PORT}`);
});
