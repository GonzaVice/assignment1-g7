const express = require("express");
const router = express.Router();
const Book = require("../models/Book");

// GET all books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find().populate("author");
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET one book
router.get("/:id", getBook, (req, res) => {
  res.json(res.book);
});

// CREATE a book
router.post("/", async (req, res) => {
  const book = new Book({
    name: req.body.name,
    summary: req.body.summary,
    publicationDate: req.body.publicationDate,
    totalSales: req.body.totalSales,
    author: req.body.authorId,
  });

  try {
    const newBook = await book.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE a book
router.patch("/:id", getBook, async (req, res) => {
  if (req.body.name != null) {
    res.book.name = req.body.name;
  }
  if (req.body.summary != null) {
    res.book.summary = req.body.summary;
  }
  if (req.body.publicationDate != null) {
    res.book.publicationDate = req.body.publicationDate;
  }
  if (req.body.totalSales != null) {
    res.book.totalSales = req.body.totalSales;
  }
  if (req.body.authorId != null) {
    res.book.author = req.body.authorId;
  }

  try {
    const updatedBook = await res.book.save();
    res.json(updatedBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a book
router.delete("/:id", getBook, async (req, res) => {
  try {
    await res.book.remove();
    res.json({ message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function to get book by ID
async function getBook(req, res, next) {
  let book;
  try {
    book = await Book.findById(req.params.id).populate("author");
    if (book == null) {
      return res.status(404).json({ message: "Cannot find book" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.book = book;
  next();
}

module.exports = router;
