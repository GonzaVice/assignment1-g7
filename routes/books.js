const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Author = require("../models/Author");

// GET all books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find().populate("author");
    res.render("books/index", { books });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// GET form to create a new book
router.get("/new", async (req, res) => {
  const authors = await Author.find();
  res.render("books/new", { authors });
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

// GET one book
router.get("/:id", getBook, (req, res) => {
  res.render("books/show", { book: res.book });
});

// GET form to edit a book
router.get("/:id/edit", getBook, async (req, res) => {
  const authors = await Author.find();
  res.render("books/edit", { book: res.book, authors: authors });
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

module.exports = router;
