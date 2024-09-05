const express = require("express");
const methodOverride = require("method-override");
const path = require("path");
const connectDB = require("./config/db");
const redis = require("redis");

const multer = require("multer");
const Author = require("./models/Author");
const Book = require("./models/Book");
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


// Configurar Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(bull, process.env.IMAGE_UPLOAD_PATH || "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configure method-override
app.use(methodOverride("_method"));

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/authors", require("./routes/authors"));
app.use("/books", require("./routes/books"));
app.use("/reviews", require("./routes/reviews"));
app.use("/sales", require("./routes/sales"));

// Ruta para renderizar la vista de subida de imágenes
app.get("/upload-image", (req, res) => {
  res.render("upload-image");
});

// Ruta para subir la imagen del perfil del autor
app.post("/authors/upload", upload.single("profileImage"), async (req, res) => {
  try {
    const author = await Author.findById(req.body.authorId);
    if (!author) {
      return res.status(404).send("Autor no encontrado");
    }
    author.profileImage = req.file.path;
    await author.save();
    res.send("Imagen del perfil subida con éxito");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Ruta para subir la imagen de la portada del libro
app.post("/books/upload", upload.single("coverImage"), async (req, res) => {
  try {
    const book = await Book.findById(req.body.bookId);
    if (!book) {
      return res.status(404).send("Libro no encontrado");
    }
    book.coverImage = req.file.path;
    await book.save();
    res.send("Imagen de la portada subida con éxito");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.render("home");
});

app.listen(PORT, () => {
  console.log(`Server corriendo en el puerto ${PORT}`);
});

module.exports = { redisClient };