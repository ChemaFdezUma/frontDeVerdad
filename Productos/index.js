const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose")
const app = express();


const port = 5001;
app.use(express.json());
app.use(cors({
  origin: 'https://front-elrastro.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

const productoRoutes = require("./routes/productoRoutes.js")
app.use('/productos', productoRoutes);
mongoose.connect(
  "mongodb+srv://grupoWeb:grupoWeb@cluster0.syetq9a.mongodb.net/elRastro").then(()=>
    console.log("Hemos conectado con mongoDB")
  ).catch((error)=>
    console.error(error)
  )

app.get("/",(req,res) =>{
  res.send("Esta es la API")}
)
app.listen(port, console.log("Servidor de Productos escuchando en el puerto ", port))