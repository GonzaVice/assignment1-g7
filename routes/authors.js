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
