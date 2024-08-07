const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Book = require("../models/Book");

// GET all reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().populate("book");
    res.render("reviews/index", { reviews });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// GET form to create a new review
router.get("/new", async (req, res) => {
  const books = await Book.find();
  res.render("reviews/new", { books });
});

// POST create a new review
router.post("/", async (req, res) => {
  const review = new Review({
    book: req.body.book,
    review: req.body.review,
    score: req.body.score,
    numberOfUpvotes: 0, // Initialize with 0
  });

  try {
    const newReview = await review.save();
    res.redirect(`/reviews/${newReview._id}`);
  } catch (err) {
    const books = await Book.find();
    res.render("reviews/new", {
      review: review,
      books: books,
      errorMessage: err.message,
    });
  }
});

// GET one review
router.get("/:id", getReview, (req, res) => {
  res.render("reviews/show", { review: res.review });
});

// GET form to edit a review
router.get("/:id/edit", getReview, async (req, res) => {
  const books = await Book.find();
  res.render("reviews/edit", { review: res.review, books: books });
});

// PUT update a review
router.put("/:id", async (req, res) => {
  const updates = {
    book: req.body.book,
    review: req.body.review,
    score: req.body.score,
  };

  try {
    await Review.updateOne({ _id: req.params.id }, updates);
    res.redirect(`/reviews/${req.params.id}`);
  } catch (err) {
    const books = await Book.find();
    res.render("reviews/edit", {
      review: { _id: req.params.id, ...updates },
      books: books,
      errorMessage: err.message,
    });
  }
});

// POST upvote a review
router.post("/:id/upvote", getReview, async (req, res) => {
  try {
    res.review.numberOfUpvotes += 1;
    await res.review.save();
    res.redirect(`/reviews/${res.review._id}`);
  } catch (err) {
    res.status(500).render("error", { message: "Error upvoting the review" });
  }
});

// DELETE a review
router.delete("/:id", getReview, async (req, res) => {
  try {
    await Review.deleteOne({ _id: res.review._id });
    res.redirect("/reviews");
  } catch (err) {
    console.error(err);
    res.status(500).render("error", { message: "Error deleting the review" });
  }
});

// Middleware function to get review by ID
async function getReview(req, res, next) {
  let review;
  try {
    review = await Review.findById(req.params.id).populate("book");
    if (review == null) {
      return res.status(404).render("error", { message: "Cannot find review" });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .render("error", { message: "Error retrieving the review" });
  }

  res.review = review;
  next();
}

module.exports = router;
