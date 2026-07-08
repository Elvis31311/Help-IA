const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  prioridad: { type: String, default: 'Media' },
  categoria: { type: String, default: 'Software' },
  respuesta_ia: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);