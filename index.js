import express from "express";
import bodyParser from "body-parser";
import axios from "axios"
import pg from "pg"

const app = express()
const PORT = 3000

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "capstoneLibrary",
  password: "rafa1503",
  port: 5432,
})

db.connect()


app.get("/", async (req,res) => {

    let booksPerMonth = {}
    let error = null;

    try{
        const result = await db.query("SELECT * FROM books")
        const data = result.rows
    
        data.forEach(book => {
        console.log(book)

        const chave = book.date_read.toISOString().substring(0, 7); // como pegar os 7 primeiros caracteres de uma string
         
        if (booksPerMonth[chave]) {
            // se a chave já existe
            booksPerMonth[chave].push(book);

        } else {
            // se a chave não existe ainda
            booksPerMonth[chave] = [book] //[book] -> cria uma array com book dentro
        }
        });

    } catch (err){
        console.log(err)
        error = "Não foi possível carregar os livros"
    }
    res.render("index.ejs", {
        libraryName: "Digital Library",
        groupedBooks: booksPerMonth,
        error 
    }
     )
})

//Leva para o forms de cadastro de um novo livro
app.get("/books/new", (req,res) => {
    res.render("new-book.ejs")
})

//Forms que cadastra novo livro
//Receber os dados do formulário, validar (se necessário), inserir no banco e redirecionar o usuário.
app.post("/books/new", async (req,res) => {
    const { title, author, isbn, rating, date_read, notes } = req.body
    try{
        await db.query("INSERT INTO books (title, author, isbn, rating, date_read, notes) VALUES ($1,$2,$3,$4,$5,$6)", [title, author, isbn, rating, date_read, notes])

        res.redirect("/")
    } catch (err) {
        console.log(err)
        res.status(500).send("Erro ao cadastrar o livro.");
    }
    
})

//Mostrar a página de edição.
app.get("/books/:id/edit", async (req,res) => {
     const id = parseInt(req.params.id)
    
    const result = await db.query("SELECT * FROM books WHERE id=$1", [id])
    const book = result.rows[0]

    if (!book) {
    return res.status(404).send("Livro inexistente");
    }
    res.render("edit-book.ejs", {
        book
    })
})

app.get("/books/:id", async (req,res) => {
    const id = parseInt(req.params.id)
    
    const result = await db.query("SELECT * FROM books WHERE id=$1", [id])
    const book = result.rows[0]

    if (!book) {
    return res.status(404).send("Livro inexistente");
    }

    res.render("book-details.ejs", {
        book
    }) 
})


//Salvar as alterações.
app.post("/books/edit", async (req,res) => {
    const {  title, author, isbn, rating, date_read, notes } = req.body
    const id = parseInt(req.body.bookId)

    await db.query("UPDATE books SET title=$1, author=$2, isbn=$3, rating=$4, date_read=$5, notes=$6 WHERE id = $7", [title, author, isbn, rating, date_read, notes, id])

    res.redirect(`/books/${id}`); //O navegador faz um novo GET, busca os dados atualizados e renderiza a página.

})

app.post("/books/delete", async (req,res) => {
    const id = parseInt(req.body.bookId)

    try {
        await db.query("DELETE FROM books WHERE id=$1",[id])

        res.redirect("/")
    } catch (err) {
        console.log(err)
        res.status(500).send("Erro ao deletar livro")
    }
})


app.listen(PORT, async () => {
    console.log(`Running on port ${PORT}`)
})