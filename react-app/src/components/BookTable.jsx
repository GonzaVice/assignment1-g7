import React from 'react';
import './BookTable.css';

function BookTable({ books }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Summary</th>
          <th>Date of Publication</th>
          <th>Number of Sales</th>
        </tr>
      </thead>
      <tbody>
        {books.map((book, index) => (
          <tr key={index}>
            <td>{book.name}</td>
            <td>{book.summary}</td>
            <td>{book.dateOfPublication}</td>
            <td>{book.numberOfSales}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default BookTable;
