const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  sales: {
    type: Number,
    required: true,
    min: 0,
  },
});

module.exports = mongoose.model("Sale", SaleSchema);
