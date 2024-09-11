const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Book = require("../models/Book");
const { isElasticSearchAvailable, elasticsearchClient } = require("../app");

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
    
    if (await isElasticSearchAvailable()) {
      await elasticsearchClient.index({
        index: 'reviews',
        id: newReview._id.toString(),
        body: {
          book: newReview.book,
          review: newReview.review,
          score: newReview.score,
          numberOfUpvotes: newReview.numberOfUpvotes
        },
      });
    }

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

    if (await isElasticSearchAvailable()) {
      await elasticsearchClient.update({
        index: 'reviews',
        id: req.params.id,
        body: {
          doc: {
            book: updates.book,
            review: updates.review,
            score: updates.score
          }
        }
      });
    }

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

    // Verificar si Elasticsearch está disponible y luego actualizar el contador de upvotes en Elasticsearch
    if (await isElasticSearchAvailable()) {
      await elasticsearchClient.update({
        index: 'reviews',
        id: res.review._id.toString(),
        body: {
          doc: {
            numberOfUpvotes: res.review.numberOfUpvotes
          }
        }
      });
    }

    res.redirect(`/reviews/${res.review._id}`);
  } catch (err) {
    console.error("Error upvoting the review:", err);
    res.status(500).render("error", { message: "Error upvoting the review" });
  }
});

// DELETE a review
router.delete("/:id", getReview, async (req, res) => {
  try {
    await Review.deleteOne({ _id: res.review._id });

    if (await isElasticSearchAvailable()) {
      await elasticsearchClient.delete({
        index: 'reviews',
        id: res.review._id.toString(),
      });
    }

    res.redirect("/reviews");
  } catch (err) {
    console.error("Error deleting the review:", err);
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
