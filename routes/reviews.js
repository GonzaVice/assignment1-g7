const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Book = require("../models/Book");

// Middleware para verificar disponibilidad de Redis
const checkRedisAvailable = (req, res, next) => {
  if (req.redisClient) {
    console.warn("Redis está disponible.");
  }
  next();
};

// Utiliza el middleware
router.use(checkRedisAvailable);

// GET all reviews
router.get("/", async (req, res) => {
  try {
    const cacheKey = 'allReviews';
    let reviews = req.redisClient ? await req.redisClient.get(cacheKey) : null;

    if (reviews) {
      reviews = JSON.parse(reviews);
    } else {
      reviews = await Review.find().populate('book');
      if (req.redisClient) {
        await req.redisClient.set(cacheKey, JSON.stringify(reviews), {
          EX: 3600 // Expire in 1 hour
        })
      }
    }

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
    if (req.redisClient) {
      await req.redisClient.del(newReview._id);
      await req.redisClient.del('allReviews'); // Invalida el caché 
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
router.get("/:id", getReview, async (req, res) => {
  try {
    const cacheKey = `review:${res.review._id}`;

    let review;
    if (req.redisClient) {
      // Intenta obtener reseña del cache
      const cachedReview = await req.redisClient.get(cacheKey);
      if (cachedReview) {
        review = JSON.parse(cachedReview);
      }
    }

  if (!review) {
    review = res.review;

    if (req.redisClient) {
      // Guarda la review en cache
      await req.redisClient.set(cacheKey, JSON.stringify(book), {
        EX: 3600
      })
    }
  }

    res.render("reviews/show", { review })
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
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
    if (req.redisClient) {
      await req.redisClient.del(`review:${req.params.id}`);
      await req.redisClient.del('allReviews'); // Invalida el caché
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
    res.redirect(`/reviews/${res.review._id}`);
  } catch (err) {
    res.status(500).render("error", { message: "Error upvoting the review" });
  }
});

// DELETE a review
router.delete("/:id", getReview, async (req, res) => {
  try {
    await Review.deleteOne({ _id: res.review._id });
    if (req.redisClient) {
      await req.redisClient.del(`review:${req.params.id}`);
      await req.redisClient.del('allReviews'); // Invalida el caché
    }
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
