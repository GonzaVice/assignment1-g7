const express = require("express");
const router = express.Router();
const Author = require("../models/Author");

// GET all authors
router.get("/", async (req, res) => {
  try {
    const authors = await Author.find();
    res.json(authors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET one author
router.get("/:id", getAuthor, (req, res) => {
  res.json(res.author);
});

// CREATE an author
router.post("/", async (req, res) => {
  const author = new Author({
    name: req.body.name,
    dateOfBirth: req.body.dateOfBirth,
    countryOfOrigin: req.body.countryOfOrigin,
    description: req.body.description,
  });

  try {
    const newAuthor = await author.save();
    res.status(201).json(newAuthor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE an author
router.patch("/:id", getAuthor, async (req, res) => {
  if (req.body.name != null) {
    res.author.name = req.body.name;
  }
  if (req.body.dateOfBirth != null) {
    res.author.dateOfBirth = req.body.dateOfBirth;
  }
  if (req.body.countryOfOrigin != null) {
    res.author.countryOfOrigin = req.body.countryOfOrigin;
  }
  if (req.body.description != null) {
    res.author.description = req.body.description;
  }

  try {
    const updatedAuthor = await res.author.save();
    res.json(updatedAuthor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE an author
router.delete("/:id", getAuthor, async (req, res) => {
  try {
    await res.author.remove();
    res.json({ message: "Author deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function to get author by ID
async function getAuthor(req, res, next) {
  let author;
  try {
    author = await Author.findById(req.params.id);
    if (author == null) {
      return res.status(404).json({ message: "Cannot find author" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.author = author;
  next();
}

module.exports = router;
