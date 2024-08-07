const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    review: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    numberOfUpvotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", ReviewSchema);
