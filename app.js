const express = require("express");
const methodOverride = require("method-override"); //Es para hacer PUT del CRUD
const path = require("path");
const connectDB = require("./config/db");
require("dotenv").config();

global.__basedir = __dirname;

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Configure method-override
app.use(methodOverride("_method"));

// NUEVO: Set view engine
app.set("view engine", "ejs"); // Ese es para las vistas estilo HTML para Express
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/authors", require("./routes/authors"));
app.use("/books", require("./routes/books"));
app.use("/reviews", require("./routes/reviews"));
app.use("/sales", require("./routes/sales"));

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server corriendo en el puerto ${PORT}`);
});
