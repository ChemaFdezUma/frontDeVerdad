
const express = require('express');
const cloudinary = require('cloudinary');
const cors = require("cors");
const app = express();
require("dotenv").config({ path: "./config.env" });

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const port = 5006;
app.use(express.json());
app.use(cors({
  origin: 'https://el-rastro-nine.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Configuración de Cloudinary
cloudinary.config({ 
  cloud_name: 'dj8csnofh', 
  api_key: '597548295124334', 
  api_secret: 'pLabEZCvj0zgN9yfWAJM1IvUmxA' 
});

const cloudinaryroutes = require("./routes/cloudinaryroutes.js")
app.use('/cloudinary', cloudinaryroutes);

app.get("/",(req,res) =>{
    res.send("Esta es la API de Cloudinary")}
)

app.listen(port, () => {
  console.log(`Servidor Cloudinary en ejecución en el puerto ${port}`);
});
