const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose")
require("dotenv").config({ path: "./config.env" });
const app = express();
const axios = require("axios");


const port = 5002;
app.use(express.json());
app.use(cors());

const usuarioRouter = require("./routes/usuarioRoutes.js")
app.use('/usuarios', usuarioRouter);
mongoose.connect(
  "mongodb+srv://grupoWeb:grupoWeb@cluster0.syetq9a.mongodb.net/elRastro").then(()=>
    console.log("Hemos conectado con mongoDB")
  ).catch((error)=>
    console.error(error)
  )

app.get("/",(req,res) =>{
  res.send("Esta es la API")}
)
app.listen(port, console.log("Servidor de Usuarios escuchando en el puerto ", port))