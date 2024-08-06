const express = require("express");
const router = express.Router();
const Review = require("../models/Review");

// GET all reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().populate("book");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET one review
router.get("/:id", getReview, (req, res) => {
  res.json(res.review);
});

// CREATE a review
router.post("/", async (req, res) => {
  const review = new Review({
    book: req.body.bookId,
    reviewText: req.body.reviewText,
    score: req.body.score,
    upVotes: req.body.upVotes,
  });

  try {
    const newReview = await review.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE a review
router.patch("/id", getReview, async (req, res) => {
  if (req.body.bookId != null) {
    res.review.book = req.body.bookId;
  }
  if (req.body.reviewText != null) {
    res.review.reviewText = req.body.reviewText;
  }
  if (req.body.score != null) {
    res.review.score = req.body.score;
  }
  if (req.body.upVotes != null) {
    res.review.upVotes = req.body.upVotes;
  }

  try {
    const updatedReview = await res.review.save();
    res.json(updatedReview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a review
router.delete("/:id", getReview, async (req, res) => {
  try {
    await res.review.remove();
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function to get review by ID
async function getReview(req, res, next) {
  let review;
  try {
    review = await Review.findById(req.params.id).populate("author");
    if (review == null) {
      return res.status(404).json({ message: "Cannot find review" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.review = review;
  next();
}

module.exports = router;
