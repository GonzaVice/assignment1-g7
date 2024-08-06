// src/App.js
import React from 'react';
import BookTable from './components/BookTable';

function App() {
  const books = [
    {
      name: "Don Quijote de la Mancha",
      summary: "La historia de un hidalgo que pierde la cordura y decide convertirse en caballero andante.",
      dateOfPublication: "1605",
      numberOfSales: 500
    },
    {
      name: "Cien años de soledad",
      summary: "Un relato épico de la familia Buendía en el ficticio pueblo de Macondo.",
      dateOfPublication: "1967",
      numberOfSales: 600
    },
  ];

  return (
    <div className="App">
      <h1>Books Table</h1>
      <BookTable books={books} />
    </div>
  );
}

export default App;