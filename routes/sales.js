const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const Book = require("../models/Book");

// GET all sales
router.get("/", async (req, res) => {
  try {
    const sales = await Sale.find().populate("book");
    res.render("sales/index", { sales });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// GET form to create a new sale
router.get("/new", async (req, res) => {
  const books = await Book.find();
  res.render("sales/new", { books });
});

// POST create a new sale
router.post("/", async (req, res) => {
  const sale = new Sale({
    book: req.body.book,
    year: req.body.year,
    sales: req.body.sales,
  });

  try {
    const newSale = await sale.save();
    res.redirect(`/sales/${newSale._id}`);
  } catch (err) {
    const books = await Book.find();
    res.render("sales/new", {
      sale: sale,
      books: books,
      errorMessage: err.message,
    });
  }
});

// GET one sale
router.get("/:id", getSale, (req, res) => {
  res.render("sales/show", { sale: res.sale });
});

// GET form to edit a sale
router.get("/:id/edit", getSale, async (req, res) => {
  const books = await Book.find();
  res.render("sales/edit", { sale: res.sale, books: books });
});

// PUT update a sale
router.put("/:id", async (req, res) => {
  const updates = {
    book: req.body.book,
    year: req.body.year,
    sales: req.body.sales,
  };

  try {
    await Sale.updateOne({ _id: req.params.id }, updates);
    res.redirect(`/sales/${req.params.id}`);
  } catch (err) {
    const books = await Book.find();
    res.render("sales/edit", {
      sale: { _id: req.params.id, ...updates },
      books: books,
      errorMessage: err.message,
    });
  }
});

// DELETE a sale
router.delete("/:id", getSale, async (req, res) => {
  try {
    await Sale.deleteOne({ _id: res.sale._id });
    res.redirect("/sales");
  } catch (err) {
    console.error(err);
    res.status(500).render("error", { message: "Error deleting the sale" });
  }
});

// Middleware function to get sale by ID
async function getSale(req, res, next) {
  let sale;
  try {
    sale = await Sale.findById(req.params.id).populate("book");
    if (sale == null) {
      return res.status(404).render("error", { message: "Cannot find sale" });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .render("error", { message: "Error retrieving the sale" });
  }

  res.sale = sale;
  next();
}

module.exports = router;
