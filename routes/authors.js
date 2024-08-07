const express = require("express");
const router = express.Router();
const Author = require("../models/Author");

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

// PUT  update an author
router.put("/:id", getAuthor, async (req, res) => {
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
    res.redirect(`/authors/${updatedAuthor._id}`);
  } catch (err) {
    res.render("authors/edit", {
      author: res.author,
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
