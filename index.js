import axios from "axios";
import ejs from "ejs";
import express from "express";
import pg from "pg";

const APP = express();
const PORT = 3000;
const db = new pg.Client({
  user: "postgres",
  password: "postgres",
  host: "localhost",
  port: 5432,
  database: "library",
});

// /$key/$value-$size.jpg
// key can be any one of ISBN, OCLC, LCCN, OLID and ID (case-insensitive)
// value is the value of the chosen key
// size can be one of S, M and L for small, medium and large respectively.
const API_URL = "https://covers.openlibrary.org/b";

db.connect();

APP.use(express.urlencoded({ extended: true }));
APP.use(express.static("public"));

// Create Book
APP.post("/new-book", async (req, res) => {
  try {
    await db.query(
      "INSERT INTO books (title, short_description, isbn) VALUES ($1, $2, $3)",
      [req.body.title, req.body.description, req.body.isbn]
    );
    res.redirect("/");
  } catch (e) {
    console.log(e);
  }
});

// Read Books | Home Page
APP.get("/", async (req, res) => {
  res.render("index.ejs", {
    bookList: await getBooks(),
  });
});

// Update Book
// APP.post("/");

// Delete Book
APP.post("/delete/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM books WHERE books.id = $1", [req.params.id]);
    res.redirect("/");
  } catch (e) {
    console.log(e);
  }
});

// New Book Page
APP.get("/post", (req, res) => {
  res.render("add.ejs");
});

APP.get("/write-review/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  res.render("review.ejs", {
    id: id,
  });
});

APP.get("/show", (req, res) => {
  res.redirect("/");
});

APP.post("/search", async (req, res) => {
  const title = req.body.book;
  var newList = [];

  try {
    const result = await db.query(
      "SELECT * FROM books LEFT JOIN reviews ON books.id = reviews.book_id WHERE title LIKE '%' || $1 || '%'",
      [title]
    );

    result.rows.forEach((book) => {
      newList.push(book);
    });

    res.render("index.ejs", {
      bookList: newList,
    });
  } catch (e) {
    console.log(e);
  }
});

APP.post("/new-review/:id", async (req, res) => {
  const date = new Date();
  const time = date.getDate();

  const id = parseInt(req.params.id);

  try {
    await db.query(
      "INSERT INTO reviews (review, rating, read_start, read_end, time_added, book_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [req.body.review, req.body.rating, req.body.start, req.body.end, time, id]
    );
    res.redirect("/");
  } catch (e) {
    console.log(e);
  }
});

APP.get("/read/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const books = await getBooks();

  const chosenBook = books.find((book) => {
    return book.id == id;
  });

  res.render("review-page.ejs", {
    book: chosenBook,
    id: id,
  });
});

APP.listen(PORT, () => {
  console.log("Starting...");
});

async function getBooks() {
  let bookList = [];

  try {
    let result = await db.query(
      "SELECT * FROM books LEFT JOIN reviews ON books.id = reviews.book_id ORDER BY books.id ASC"
    );

    result.rows.forEach((book) => {
      bookList.push(book);
    });

    return bookList;
  } catch (e) {
    console.log(e);
  }
}
