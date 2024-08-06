const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");

// GET all sales
router.get("/", async (req, res) => {
  try {
    const sales = await Sale.find().populate("book");
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET one sale
router.get("/:id", getSale, (req, res) => {
  res.json(res.sale);
});

// CREATE a sale
router.post("/", async (req, res) => {
  const sale = new Sale({
    book: req.body.bookId,
    year: req.body.year,
    sales: req.body.sales,
  });

  try {
    const newSale = await sale.save();
    res.status(201).json(newSale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE a sale
router.patch("/id", getSale, async (req, res) => {
  if (req.body.bookId != null) {
    res.sale.book = req.body.bookId;
  }
  if (req.body.year != null) {
    res.sale.year = req.body.year;
  }
  if (req.body.sales != null) {
    res.sale.sales = req.body.sales;
  }

  try {
    const updatedSale = await res.sale.save();
    res.json(updatedSale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a sale
router.delete("/:id", getSale, async (req, res) => {
  try {
    await res.sale.remove();
    res.json({ message: "Sale deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function to get sale by ID
async function getSale(req, res, next) {
  let sale;
  try {
    sale = await Sale.findById(req.params.id).populate("author");
    if (sale == null) {
      return res.status(404).json({ message: "Cannot find sale" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.sale = sale;
  next();
}

module.exports = router;
