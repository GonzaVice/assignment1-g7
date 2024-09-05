const express = require("express");
const methodOverride = require("method-override");
const path = require("path");
const connectDB = require("./config/db");
const redis = require("redis");
require("dotenv").config();

global.__basedir = __dirname;

const app = express();

// Connect to MongoDB
connectDB();

// Configuración de Redis
let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({ url: process.env.REDIS_URL });

    // Verifica la conexión
    await redisClient.connect();
    console.log("Redis connected successfully.");
  } catch (err) {
    console.error("Redis connection error:", err);
    redisClient = null; // Desactiva el cliente Redis si no se puede conectar
    await redisClient.quit(); // Cierra la conexión con Redis
  }
};

connectRedis();

const redisMiddleware = (req, res, next) => {
  req.redisClient = redisClient;
  next();
};

app.use(redisMiddleware);


(async () => {
  const redisURL = process.env.REDIS_URL;

  if (redisURL) {
    try {
      redisClient = redis.createClient({
        url: redisURL
      });

      redisClient.on('error', async (err) => {
        console.error("No se pudo conectar a Redis. Continuando sin Redis...", err);
        await redisClient.quit(); // Cierra la conexión con Redis
        redisClient = null; // Desactiva el uso de Redis
      });

      await redisClient.connect();
      console.log("Conectado a Redis");
    } catch (err) {
      console.error("Error al conectar a Redis:", err);
      if (redisClient) {
        await redisClient.quit(); // Asegúrate de cerrar la conexión si algo falla
        redisClient = null;
      }
    }
  } else {
    console.warn("REDIS_URL no está definido. Continuando sin Redis...");
    redisClient = null;
  }
})();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Configure method-override
app.use(methodOverride("_method"));

// NUEVO: Set view engine
app.set("view engine", "ejs");
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

module.exports = { redisClient };