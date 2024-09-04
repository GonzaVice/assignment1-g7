const express = require("express");
const methodOverride = require("method-override"); //Es para hacer PUT y DELETE del CRUD
const path = require("path");
const connectDB = require("./config/db");
const { Client } = require("@elastic/elasticsearch");
require("dotenv").config();

global.__basedir = __dirname;

const app = express();

// Connect to MongoDB
connectDB();

// ElasticSearch
const elasticsearchClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

const isElasticSearchAvailable = async () => {
  try {
    const health = await elasticsearchClient.cluster.health();
    return health.status !== "red";
  } catch (error) {
    console.error("Elasticsearch no está disponible:", error);
    return false;
  }
};

module.exports = { elasticsearchClient, isElasticSearchAvailable };

// Importar modelos
const Author = require("./models/Author");
const Book = require("./models/Book");
const Review = require("./models/Review");
const Sale = require("./models/Sale");

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
  res.render("home");
});

app.listen(PORT, () => {
  console.log(`Server corriendo en el puerto ${PORT}`);
});
