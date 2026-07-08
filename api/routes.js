const express = require('express');
const router = express.Router();
const Ticket = require('./models/Ticket');

// Ruta para CREAR un ticket con IA y Trello
router.post('/tickets', async (req, res) => {
  try {
    const { titulo, descripcion } = req.body;
    if (!titulo || !descripcion) {
      return res.status(400).json({ error: "Faltan campos obligatorios (titulo y descripcion)." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // 📡 LLAMADA A GEMINI 1.5 FLASH (IA Real)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const prompt = `Actúa como un ingeniero de soporte técnico de TI para el Instituto Cenestur.
    Analiza detalladamente el siguiente ticket y responde EXCLUSIVAMENTE con un objeto JSON plano. 
    No agregues texto extra, saludos ni bloques de código markdown como \`\`\`json. Devuelve solo el JSON limpio con esta estructura exacta:
    {
      "prioridad": "Baja" o "Media" o "Alta",
      "categoria": "Hardware" o "Software" o "Redes" o "Accesos",
      "sugerencia": "Una respuesta técnica, analítica y cordial adaptada al problema del usuario con 2 o 3 pasos claros."
    }

    Ticket a analizar:
    Asunto: ${titulo}
    Descripción: ${descripcion}`;

    const responseIA = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const dataIA = await responseIA.json();

    if (dataIA.error) {
      throw new Error(`Google API Error: ${dataIA.error.message}`);
    }

    // Extraer y limpiar el texto que devuelve la IA
    let responseText = dataIA.candidates[0].content.parts[0].text.trim();
    if (responseText.includes("```")) {
      responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    console.log("🤖 IA Real Respondió:", responseText);
    const resultadoIA = JSON.parse(responseText);

    // 2. GUARDAR EL TICKET EN MONGODB ATLAS
    const nuevoTicket = new Ticket({
      titulo,
      descripcion,
      prioridad: resultadoIA.prioridad || 'Media',
      categoria: resultadoIA.categoria || 'Software',
      respuesta_ia: resultadoIA.sugerencia || 'Procesando soporte...'
    });

    await nuevoTicket.save();

    // 3. ENVIAR A TRELLO AUTOMÁTICAMENTE
    try {
      let idListDestino = process.env.TRELLO_LIST_MEDIA;
      if (nuevoTicket.prioridad === 'Baja') idListDestino = process.env.TRELLO_LIST_BAJA;
      if (nuevoTicket.prioridad === 'Alta') idListDestino = process.env.TRELLO_LIST_ALTA;

      const params = new URLSearchParams({
        idList: idListDestino,
        key: process.env.TRELLO_KEY || '',
        token: process.env.TRELLO_TOKEN || '',
        name: `[${nuevoTicket.categoria}] ${nuevoTicket.titulo}`,
        desc: `Descripción del usuario:\n${nuevoTicket.descripcion}\n\n🤖 Diagnóstico de Gemini 2.0:\n${nuevoTicket.respuesta_ia}`
      });

      await fetch(`https://api.trello.com/1/cards?${params.toString()}`, { method: 'POST' });
      console.log(`📋 Tarjeta creada en Trello con éxito.`);
    } catch (trelloError) {
      console.error('⚠️ Error al enviar a Trello:', trelloError.message);
    }
    
    // Devolver el ticket guardado al Frontend
    res.status(201).json(nuevoTicket);

  } catch (error) {
    console.error("❌ Error en la ruta /tickets:", error);
    res.status(500).json({ error: "Error al procesar el ticket con la IA.", detalles: error.message });
  }
});

// Ruta para OBTENER todos los tickets (para tus gráficos de barras/pastel)
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los tickets." });
  }
});

module.exports = router;