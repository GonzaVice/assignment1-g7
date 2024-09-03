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
let redisClient;

(async () => {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
  });

  redisClient.on('error', (err) => {
    console.error("No se pudo conectar a Redis. Continuando sin Redis...", err);
    redisClient = null; // Si hay un error, no se usará Redis
  });

  await redisClient.connect().catch((err) => {
    console.error("Error al conectar a Redis:", err);
    redisClient = null;
  });
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

// Ejemplo de uso de Redis (si está disponible)
app.get("/cached-data", async (req, res) => {
  if (redisClient) {
    try {
      let data = await redisClient.get('some_key');
      if (data) {
        return res.json({ data: JSON.parse(data) });
      }
    } catch (err) {
      console.error("Error al acceder a Redis:", err);
    }
  }
  // Si Redis no está disponible o no hay datos en la caché
  let data = { message: "Datos calculados o recuperados de la base de datos" };
  if (redisClient) {
    try {
      await redisClient.set('some_key', JSON.stringify(data), {
        EX: 3600 // Expira en 1 hora
      });
    } catch (err) {
      console.error("Error al escribir en Redis:", err);
    }
  }
  return res.json({ data });
});

app.listen(PORT, () => {
  console.log(`Server corriendo en el puerto ${PORT}`);
});
