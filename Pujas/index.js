const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose")
const axios = require("axios");
require("dotenv").config({ path: "./config.env" });
const app = express();
const {revisarPujas } = require("./pujasScheduler.js");


const port = 5003;
app.use(express.json());
app.use(cors());

const pujaRoutes = require("./routes/pujaRoutes.js")
app.use('/pujas', pujaRoutes);
mongoose.connect(
  "mongodb+srv://grupoWeb:grupoWeb@cluster0.syetq9a.mongodb.net/elRastro").then(()=>
    console.log("Hemos conectado con mongoDB")
  ).catch((error)=>
    console.error(error)
  );

const intervalo = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
setInterval(revisarPujas, intervalo);

app.get("/",(req,res) =>{
  res.send("Esta es la API")}
)
app.listen(port, console.log("Servidor de Pujas escuchando en el puerto ", port))