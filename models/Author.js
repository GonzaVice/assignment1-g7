const mongoose = require("mongoose");

const AuthorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    countryOfOrigin: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    profileImage: {
      type: String, // Ruta de la imagen del perfil
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Author", AuthorSchema);
