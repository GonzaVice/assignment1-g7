const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    publicationDate: {
      type: Date,
      required: true,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
    },
    coverImage: {
      type: String, // Ruta de la imagen de la portada
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", BookSchema);
