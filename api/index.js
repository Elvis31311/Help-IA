const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ticketRoutes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());

// Controlar que no se dupliquen conexiones a MongoDB en Vercel
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log("💾 ✅ MongoDB Conectado exitosamente.");
  } catch (err) {
    console.error("❌ Error al conectar con MongoDB:", err.message);
  }
};

// Conectar a la base de datos antes de procesar cualquier petición
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Acoplar las rutas bajo el prefijo /api
app.use('/api', ticketRoutes);

// Exportar la app para que Vercel la maneje
module.exports = app;