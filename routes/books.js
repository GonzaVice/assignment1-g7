const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Author = require("../models/Author");
const Review = require("../models/Review");
const Sale = require("../models/Sale");

// Middleware para verificar disponibilidad de Redis
const checkRedisAvailable = (req, res, next) => {
  if (req.redisClient) {
    console.warn("Redis está disponible.");
  }
  next();
};

// Utiliza el middleware
router.use(checkRedisAvailable);

// GET form to create a new book
router.get("/new", async (req, res) => {
  const authors = await Author.find();
  res.render("books/new", { authors });
});

// GET all books
router.get("/", async (req, res) => {
  try {
    const cacheKey = 'allBooks';
    let books = req.redisClient ? await req.redisClient.get(cacheKey) : null;

    if (books) {
      books = JSON.parse(books);
    } else {
      books = await Book.find().populate("author");
      if (req.redisClient) {
        await req.redisClient.set(cacheKey, JSON.stringify(books), {
          EX: 3600 // Expire in 1 hour
        });
      }
    }

    res.render("books/index", { books });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// GET one book
router.get("/:id", getBook, async (req, res) => {
  try {
    const cacheKey = `book:${res.book._id}`;

    let book;
    if (req.redisClient) {
      // Intenta obtener el libro del caché
      const cachedBook = await req.redisClient.get(cacheKey);
      if (cachedBook) {
        book = JSON.parse(cachedBook);
      }
    }

    if (!book) {
      // Si no está en caché, usa el libro de la respuesta
      book = res.book;

      if (req.redisClient) {
        // Guarda el libro en caché
        await req.redisClient.set(cacheKey, JSON.stringify(book), {
          EX: 3600 // Expire in 1 hour
        });
      }
    }

    res.render("books/show", { book });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});


// POST create a new book
router.post("/", async (req, res) => {
  const book = new Book({
    name: req.body.name,
    summary: req.body.summary,
    publicationDate: req.body.publicationDate,
    totalSales: req.body.totalSales,
    author: req.body.author,
  });

  try {
    const newBook = await book.save();
    if (req.redisClient) {
      await req.redisClient.del(newBook._id);
      await req.redisClient.del('allBooks'); // Invalida el caché de todos los libros
    }
    res.redirect(`/books/${newBook._id}`);
  } catch (err) {
    const authors = await Author.find();
    res.render("books/new", {
      book: book,
      authors: authors,
      errorMessage: err.message,
    });
  }
});

// PUT update a book
router.put("/:id", async (req, res) => {
  const updates = {
    name: req.body.name,
    summary: req.body.summary,
    publicationDate: req.body.publicationDate,
    totalSales: req.body.totalSales,
    author: req.body.author,
  };

  try {
    await Book.updateOne({ _id: req.params.id }, updates);
    if (req.redisClient) {
      await req.redisClient.del(`book:${req.params.id}`);
      await req.redisClient.del('allBooks'); // Invalida el caché de todos los libros
    }
    res.redirect(`/books/${req.params.id}`);
  } catch (err) {
    const authors = await Author.find();
    res.render("books/edit", {
      book: { _id: req.params.id, ...updates },
      authors: authors,
      errorMessage: err.message,
    });
  }
});

// DELETE a book
router.delete("/:id", getBook, async (req, res) => {

  try {
    await Book.deleteOne({ _id: res.book._id });
    if (req.redisClient) {
      await req.redisClient.del(`book:${req.params.id}`);
      await req.redisClient.del('allBooks'); // Invalida el caché de todos los libros
    }
    res.redirect("/books");
  } catch (err) {
    console.error(err);
    res.status(500).render("error", { message: "Error deleting the book" });
  }
});

// Middleware function to get book by ID
async function getBook(req, res, next) {
  let book;
  try {
    book = await Book.findById(req.params.id).populate("author");
    if (book == null) {
      return res.status(404).render("error", { message: "Cannot find book" });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .render("error", { message: "Error retrieving the book" });
  }

  res.book = book;
  next();
}

// GET top 10 rated books
router.get("/top-rated", async (req, res) => {
  try {
    const topBooks = await Book.aggregate([
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "book",
          as: "reviews",
        },
      },
      {
        $addFields: {
          averageScore: { $avg: "$reviews.score" },
          reviewCount: { $size: "$reviews" },
        },
      },
      {
        $sort: { averageScore: -1, reviewCount: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "authors",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $project: {
          name: 1,
          author: 1,
          averageScore: 1,
          reviews: {
            review: 1,
            score: 1,
            numberOfUpvotes: 1,
          },
        },
      },
    ]);

    for (let book of topBooks) {
      // Obtener la reseña más popular con la puntuación más alta
      book.highestRatedReview = await Review.findOne({ book: book._id })
        .sort({ score: -1, numberOfUpvotes: -1 })
        .limit(1);

      // Obtener la reseña más popular con la puntuación más baja
      book.lowestRatedReview = await Review.findOne({ book: book._id })
        .sort({ score: 1, numberOfUpvotes: -1 })
        .limit(1);
    }

    res.render("books/top-rated", { topBooks });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// GET top 50 selling books
router.get("/top-selling", async (req, res) => {
  try {
    const topBooks = await Book.aggregate([
      {
        $lookup: {
          from: "sales",
          localField: "_id",
          foreignField: "book",
          as: "sales",
        },
      },
      {
        $addFields: {
          totalSales: { $sum: "$sales.sales" },
        },
      },
      {
        $sort: { totalSales: -1 },
      },
      {
        $limit: 50,
      },
      {
        $lookup: {
          from: "authors",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
    ]);

    for (let book of topBooks) {
      // Calcular ventas totales del autor
      const authorSales = await Book.aggregate([
        { $match: { author: book.author._id } },
        {
          $lookup: {
            from: "sales",
            localField: "_id",
            foreignField: "book",
            as: "sales",
          },
        },
        {
          $unwind: "$sales",
        },
        {
          $group: {
            _id: "$author",
            totalSales: { $sum: "$sales.sales" },
          },
        },
      ]);
      book.authorTotalSales = authorSales[0] ? authorSales[0].totalSales : 0;

      // Verificar si el libro estuvo en el top 5 de ventas el año de su publicación
      const publicationYear = book.publicationDate.getFullYear();
      const topSellingBooksOfYear = await Sale.aggregate([
        { $match: { year: publicationYear } },
        { $group: { _id: "$book", totalSales: { $sum: "$sales" } } },
        { $sort: { totalSales: -1 } },
        { $limit: 5 },
      ]);

      book.inTopFiveOnPublicationYear = topSellingBooksOfYear.some((topBook) =>
        topBook._id.equals(book._id)
      );
    }

    res.render("books/top-selling", { topBooks });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// GET busqueda
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Número de resultados por página
    const skip = (page - 1) * limit;

    if (!query) {
      return res.render("books/search", {
        books: [],
        query: "",
        currentPage: 1,
        totalPages: 1,
      });
    }

    // Creamos un array de palabras de búsqueda
    const searchWords = query.split(" ").filter((word) => word.length > 0);

    // Creamos una expresión regular para cada palabra
    const regexPatterns = searchWords.map((word) => new RegExp(word, "i"));

    // Buscamos libros que contengan cualquiera de las palabras en su descripción
    const books = await Book.find({ summary: { $in: regexPatterns } })
      .populate("author", "name")
      .skip(skip)
      .limit(limit)
      .exec();

    // Contamos el total de resultados para la paginación
    const total = await Book.countDocuments({
      summary: { $in: regexPatterns },
    });

    const totalPages = Math.ceil(total / limit);

    res.render("books/search", {
      books,
      query,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en la búsqueda de libros");
  }
});

// GET form to edit a book
router.get("/:id/edit", getBook, async (req, res) => {
  const authors = await Author.find();
  res.render("books/edit", { book: res.book, authors: authors });
});


// Middleware function to get book by ID
async function getBook(req, res, next) {
  let book;
  try {
    book = await Book.findById(req.params.id).populate("author");
    if (book == null) {
      return res.status(404).render("error", { message: "Cannot find book" });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .render("error", { message: "Error retrieving the book" });
  }

  res.book = book;
  next();
}

module.exports = router;
