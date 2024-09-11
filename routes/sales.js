const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const Book = require("../models/Book");
const { isElasticSearchAvailable, elasticsearchClient } = require("../app");

// GET all sales
router.get("/", async (req, res) => {
  try {
    const cacheKey = 'allSales';
    let sales = req.redisClient ? await req.redisClient.get(cacheKey) : null;

    if (sales) {
      sales = JSON.parse(sales);
    } else {
      sales = await Sale.find().populate("book");
      if (req.redisClient) {
        await req.redisClient.set(cacheKey, JSON.stringify(sales), {
          EX: 3600 // Expire in 1 hour
        });
      }
    }

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
    if (req.redisClient) {
      await req.redisClient.del(newSale._id);
      await req.redisClient.del('allSales'); // Invalida el caché
    }

    if (await isElasticSearchAvailable()) {
      await elasticsearchClient.index({
        index: 'sales',
        id: newSale._id.toString(),
        body: {
          book: newSale.book,
          year: newSale.year,
          sales: newSale.sales
        },
      });
    }

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
router.get("/:id", getSale, async (req, res) => {
  try {
    const cacheKey = `sale:${res.sale._id}`

    let sale;
    if (req.redisClient) {
      const cachedSale = await req.redisClient.get(cacheKey);
      if (cachedSale) {
        sale = JSON.parse(cachedSale);
      }
    }

  if (!sale) {
    sale = res.sale;

    if (req.redisClient) {
      await req.redisClient.set(cacheKey, JSON.stringify(sale), {
        EX: 3600 // Expire in 1 hour
      });
    }
  }

  res.render("sales/show", { sale: res.sale });
} catch (err) {
  res.status(500).render("error", { message: err.message });
}
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
    if (req.redisClient) {
      await req.redisClient.del(`sale:${req.params.id}`);
      await req.redisClient.del('allSales'); // Invalida el caché 
    }

    if (await isElasticSearchAvailable()) {
      await elasticsearchClient.update({
        index: 'sales',
        id: req.params.id,
        body: {
          doc: {
            book: updates.book,
            year: updates.year,
            sales: updates.sales
          }
        }
      });
    }

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
    if (req.redisClient) {
      await req.redisClient.del(`sale:${req.params.id}`);
      await req.redisClient.del('allSales'); // Invalida el caché de todos los libros
    }

    if (await isElasticSearchAvailable()) {
      await elasticsearchClient.delete({
        index: 'sales',
        id: res.sale._id.toString(),
      });
    }

    res.redirect("/sales");
  } catch (err) {
    console.error("Error deleting the sale:", err);
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
