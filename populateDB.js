const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const { Schema } = mongoose;

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/libros_criticas_db', {});

// Definir los esquemas
const AuthorSchema = new Schema(
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
  },
  { timestamps: true }
);

const BookSchema = new Schema(
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
      type: Schema.Types.ObjectId,
      ref: 'Author',
      required: true,
    },
  },
  { timestamps: true }
);

const ReviewSchema = new Schema(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
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

const SaleSchema = new Schema({
  book: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
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

// Crear los modelos
const Author = mongoose.model('Author', AuthorSchema);
const Book = mongoose.model('Book', BookSchema);
const Review = mongoose.model('Review', ReviewSchema);
const Sale = mongoose.model('Sale', SaleSchema);

// Función para crear datos de prueba
const crearDatosDePrueba = async () => {
  try {
    // Crear autores
    const autores = [];
    for (let i = 0; i < 50; i++) {
      const autor = new Author({
        name: faker.person.fullName(),
        dateOfBirth: faker.date.past({years: 60, refDate: new Date(2000, 0, 1)}),
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
        publicationDate: faker.date.past({years: 20}),
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
          year: faker.date.past({years: 10}).getFullYear(),
          sales: Math.floor(Math.random() * 1000),
        });
        ventas.push(venta);
      }
    }
    await Review.insertMany(reseñas);
    await Sale.insertMany(ventas);

    console.log('Datos de prueba creados con éxito');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error al crear datos de prueba:', error);
    mongoose.connection.close();
  }
};

// Ejecutar la función para crear datos de prueba
crearDatosDePrueba();
