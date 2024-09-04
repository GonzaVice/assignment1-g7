const express = require("express");
const router = express.Router();
const Author = require("../models/Author");
const Book = require("../models/Book");
const Review = require("../models/Review");
const Sale = require("../models/Sale");
const multer = require("multer");
const path = require("path");

// Configuración de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.IMAGE_UPLOAD_PATH || "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Ruta para subir la imagen del perfil del autor
router.post("/upload", upload.single("profileImage"), async (req, res) => {
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

// Ruta para obtener todos los autores al seleccionar
router.get("/all", async (req, res) => {
  try {
    const authors = await Author.find().select("name");
    res.json(authors);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET all authors
router.get("/", async (req, res) => {
  try {
    const authors = await Author.find();
    res.render("authors/index", { authors });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// GET form to create a new author
router.get("/new", (req, res) => {
  res.render("authors/new");
});

// GET authors statistics
router.get("/stats", async (req, res) => {
  try {
    const authors = await Author.find();
    const authorStats = await Promise.all(
      authors.map(async (author) => {
        const books = await Book.find({ author: author._id });
        const bookIds = books.map((book) => book._id);

        const numBooks = books.length;

        const reviews = await Review.find({ book: { $in: bookIds } });
        const avgScore =
          reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.score, 0) /
              reviews.length
            : 0;

        const sales = await Sale.find({ book: { $in: bookIds } });
        const totalSales = sales.reduce((sum, sale) => sum + sale.sales, 0);

        return {
          _id: author._id,
          name: author.name,
          numBooks,
          avgScore: avgScore.toFixed(2),
          totalSales,
        };
      })
    );

    res.render("authors/stats", { authorStats });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// POST create a new author
router.post("/", async (req, res) => {
  const author = new Author({
    name: req.body.name,
    dateOfBirth: req.body.dateOfBirth,
    countryOfOrigin: req.body.countryOfOrigin,
    description: req.body.description,
  });

  try {
    const newAuthor = await author.save();
    res.redirect(`/authors/${newAuthor._id}`);
  } catch (err) {
    res.render("authors/new", { author: author, errorMessage: err.message });
  }
});

// GET one author
router.get("/:id", getAuthor, (req, res) => {
  res.render("authors/show", { author: res.author });
});

// GET form to edit an author
router.get("/:id/edit", getAuthor, (req, res) => {
  res.render("authors/edit", { author: res.author });
});

// PUT update an author
router.put("/:id", async (req, res) => {
  const updates = {
    name: req.body.name,
    dateOfBirth: req.body.dateOfBirth,
    countryOfOrigin: req.body.countryOfOrigin,
    description: req.body.description,
  };

  try {
    await Author.updateOne({ _id: req.params.id }, updates);
    res.redirect(`/authors/${req.params.id}`);
  } catch (err) {
    res.render("authors/edit", {
      author: { _id: req.params.id, ...updates },
      errorMessage: err.message,
    });
  }
});

// DELETE an author
router.delete("/:id", getAuthor, async (req, res) => {
  try {
    await Author.deleteOne({ _id: res.author._id });
    res.redirect("/authors");
  } catch (err) {
    console.error(err);
    res.status(500).render("error", { message: "Error deleting the author" });
  }
});

// Middleware function to get author by ID
async function getAuthor(req, res, next) {
  let author;
  try {
    author = await Author.findById(req.params.id);
    if (author == null) {
      return res.status(404).render("error", { message: "Cannot find author" });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .render("error", { message: "Error retrieving the author" });
  }

  res.author = author;
  next();
}

module.exports = router;
