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
let redisClient;

(async () => {
  const redisURL = process.env.REDIS_URL;

  if (redisURL) {
    try {
      redisClient = redis.createClient({
        url: redisURL,
      });

      redisClient.on("error", async (err) => {
        console.error(
          "No se pudo conectar a Redis. Continuando sin Redis...",
          err
        );
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

// Ejemplo de uso de Redis (si está disponible) para el modelo Book
app.get("/book/:id", async (req, res) => {
  const bookId = req.params.id;

  if (redisClient) {
    try {
      let cachedBook = await redisClient.get(`book_${bookId}`);
      if (cachedBook) {
        return res.json({ data: JSON.parse(cachedBook) });
      }
    } catch (err) {
      console.error("Error al acceder a Redis:", err);
    }
  }

  try {
    // Si Redis no está disponible o no hay datos en la caché, se recuperan los datos de MongoDB
    let book = await Book.findById(bookId).populate("author").exec();
    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    // Guardar los datos en Redis con una expiración de 1 hora
    if (redisClient) {
      try {
        await redisClient.set(`book_${bookId}`, JSON.stringify(book), {
          EX: 3600, // Expira en 1 hora
        });
      } catch (err) {
        console.error("Error al escribir en Redis:", err);
      }
    }

    return res.json({ data: book });
  } catch (err) {
    console.error("Error al recuperar el libro de la base de datos:", err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Ejemplo de uso de Redis (si está disponible) para el modelo Author
app.get("/author/:id", async (req, res) => {
  const authorId = req.params.id;

  if (redisClient) {
    try {
      let cachedAuthor = await redisClient.get(`author_${authorId}`);
      if (cachedAuthor) {
        return res.json({ data: JSON.parse(cachedAuthor) });
      }
    } catch (err) {
      console.error("Error al acceder a Redis:", err);
    }
  }

  try {
    // Si Redis no está disponible o no hay datos en la caché, se recuperan los datos de MongoDB
    let author = await Author.findById(authorId).populate("books").exec();
    if (!author) {
      return res.status(404).json({ message: "Autor no encontrado" });
    }

    // Guardar los datos en Redis con una expiración de 1 hora
    if (redisClient) {
      try {
        await redisClient.set(`author_${authorId}`, JSON.stringify(author), {
          EX: 3600, // Expira en 1 hora
        });
      } catch (err) {
        console.error("Error al escribir en Redis:", err);
      }
    }

    return res.json({ data: author });
  } catch (err) {
    console.error("Error al recuperar el autor de la base de datos:", err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Ejemplo de uso de Redis (si está disponible) para el modelo Review
app.get("/review/:id", async (req, res) => {
  const reviewId = req.params.id;

  if (redisClient) {
    try {
      let cachedReview = await redisClient.get(`review_${reviewId}`);
      if (cachedReview) {
        return res.json({ data: JSON.parse(cachedReview) });
      }
    } catch (err) {
      console.error("Error al acceder a Redis:", err);
    }
  }

  try {
    // Si Redis no está disponible o no hay datos en la caché, se recuperan los datos de MongoDB
    let review = await Review.findById(reviewId).populate("book").exec();
    if (!review) {
      return res.status(404).json({ message: "Reseña no encontrada" });
    }

    // Guardar los datos en Redis con una expiración de 1 hora
    if (redisClient) {
      try {
        await redisClient.set(`review_${reviewId}`, JSON.stringify(review), {
          EX: 3600, // Expira en 1 hora
        });
      } catch (err) {
        console.error("Error al escribir en Redis:", err);
      }
    }

    return res.json({ data: review });
  } catch (err) {
    console.error("Error al recuperar la reseña de la base de datos:", err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Ejemplo de uso de Redis (si está disponible) para el modelo Sale
app.get("/sale/:id", async (req, res) => {
  const saleId = req.params.id;

  if (redisClient) {
    try {
      let cachedSale = await redisClient.get(`sale_${saleId}`);
      if (cachedSale) {
        return res.json({ data: JSON.parse(cachedSale) });
      }
    } catch (err) {
      console.error("Error al acceder a Redis:", err);
    }
  }

  try {
    // Si Redis no está disponible o no hay datos en la caché, se recuperan los datos de MongoDB
    let sale = await Sale.findById(saleId).populate("book").exec();
    if (!sale) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Guardar los datos en Redis con una expiración de 1 hora
    if (redisClient) {
      try {
        await redisClient.set(`sale_${saleId}`, JSON.stringify(sale), {
          EX: 3600, // Expira en 1 hora
        });
      } catch (err) {
        console.error("Error al escribir en Redis:", err);
      }
    }

    return res.json({ data: sale });
  } catch (err) {
    console.error("Error al recuperar la venta de la base de datos:", err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`Server corriendo en el puerto ${PORT}`);
});
