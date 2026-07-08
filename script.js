const form = document.getElementById('ticketForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const container = document.getElementById('ticketsContainer');

// URL relativa (Vercel la resuelve automáticamente al backend /api)
const API_URL = '/api/tickets';

// Cargar tickets al iniciar la página
document.addEventListener('DOMContentLoaded', cargarTickets);

// Evento al enviar el formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const titulo = document.getElementById('titulo').value;
    const descripcion = document.getElementById('descripcion').value;

    // Estado de carga
    submitBtn.disabled = true;
    btnText.innerText = 'Analizando con IA... ⏳';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo, descripcion })
        });

        if (!response.ok) throw new Error('Error al procesar el ticket');

        // Limpiar formulario y recargar lista
        form.reset();
        await cargarTickets();
    } catch (error) {
        console.error(error);
        alert('Hubo un error al enviar el ticket.');
    } finally {
        // Restaurar botón
        submitBtn.disabled = false;
        btnText.innerText = 'Enviar Ticket a la IA ✨';
    }
});

// Función para obtener y mostrar los tickets
async function cargarTickets() {
    try {
        const response = await fetch(API_URL);
        const tickets = await response.json();
        
        container.innerHTML = ''; // Limpiar contenedor

        if (tickets.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#6B7280;">No hay tickets registrados aún.</p>';
            return;
        }

        tickets.forEach(ticket => {
            // Asignar clase de color según prioridad
            let prioridadClass = ticket.prioridad.toLowerCase();

            const ticketHTML = `
                <div class="ticket-card">
                    <div class="ticket-header">
                        <h3>${ticket.titulo}</h3>
                        <div class="badges">
                            <span class="badge ${prioridadClass}">🚨 ${ticket.prioridad.toUpperCase()}</span>
                            <span class="badge categoria">📁 ${ticket.categoria.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="ticket-desc">
                        <p>${ticket.descripcion}</p>
                    </div>
                    <div class="ia-response">
                        <h4>✨ Diagnóstico & Resolución (IA)</h4>
                        <p>${ticket.respuesta_ia}</p>
                    </div>
                </div>
            `;
            container.innerHTML += ticketHTML;
        });
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Error al cargar el historial de tickets.</p>';
        console.error(error);
    }
}