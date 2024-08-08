const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const { Schema } = mongoose;
const connectDB = require("./config/db");

// Exportar modelos
const Author = require("./models/Author");
const Book = require("./models/Book");
const Review = require("./models/Review");
const Sale = require("./models/Sale");

// Connect to MongoDB
connectDB();

// Función para crear datos de prueba
const crearDatosDePrueba = async () => {
  try {
    // Crear autores
    const autores = [];
    for (let i = 0; i < 50; i++) {
      const autor = new Author({
        name: faker.person.fullName(),
        dateOfBirth: faker.date.past({
          years: 60,
          refDate: new Date(2000, 0, 1),
        }),
        countryOfOrigin: faker.location.country(),
        description: faker.lorem.paragraph(),
      });
      autores.push(autor);
    }
    await Author.insertMany(autores);

    // Crear libros
    const libros = [];
    for (let i = 0; i < 300; i++) {
      const autor = autores[Math.floor(Math.random() * autores.length)];
      const libro = new Book({
        name: faker.lorem.words(3),
        summary: faker.lorem.paragraph(),
        publicationDate: faker.date.past({ years: 20 }),
        totalSales: Math.floor(Math.random() * 10000),
        author: autor._id,
      });
      libros.push(libro);
    }
    await Book.insertMany(libros);

    // Crear reseñas y ventas
    const reseñas = [];
    const ventas = [];
    for (const libro of libros) {
      // Crear entre 1 y 10 reseñas por libro
      const numReseñas = Math.floor(Math.random() * 10) + 1;
      for (let i = 0; i < numReseñas; i++) {
        const reseña = new Review({
          book: libro._id,
          review: faker.lorem.sentence(),
          score: Math.floor(Math.random() * 5) + 1,
          numberOfUpvotes: Math.floor(Math.random() * 100),
        });
        reseñas.push(reseña);
      }

      // Crear al menos 5 datos de venta por libro
      for (let i = 0; i < 5; i++) {
        const venta = new Sale({
          book: libro._id,
          year: faker.date.past({ years: 10 }).getFullYear(),
          sales: Math.floor(Math.random() * 1000),
        });
        ventas.push(venta);
      }
    }
    await Review.insertMany(reseñas);
    await Sale.insertMany(ventas);

    console.log("Datos de prueba creados con éxito");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error al crear datos de prueba:", error);
    mongoose.connection.close();
  }
};

// Ejecutar la función para crear datos de prueba
crearDatosDePrueba();
