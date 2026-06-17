// CONFIGURACIÓN: Reemplazá esto por tu URL de ejecución de Google Apps Script (Debe terminar en /exec)
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxz8Yy_-zZFIxpEpjdBk595GjNuQ0OnrdbxeDv70macDAwsUkZaypyJ5sAc_WIGRo1i/exec';

document.getElementById('cutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btnSubmit');
    const msg = document.getElementById('statusMessage');
    
    // Estado de carga
    btn.disabled = true;
    btn.innerText = 'Publicando en tiempo real...';
    msg.style.display = 'none';

    // Captura de datos del formulario 
    const payload = {
        contrato: document.getElementById('contrato').value,
        nombre: document.getElementById('nombre').value,
        gestor: document.getElementById('gestor').value,
        estado: document.getElementById('estado').value
    };

    try {
        // Petición POST asíncrona hacia Google Sheets
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Evita restricciones CORS del navegador
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // Respuesta exitosa visual
        msg.className = 'success';
        msg.innerText = '¡Datos publicados en la hoja!';
        msg.style.display = 'block';
        
        // Limpiar campos de texto para la siguiente gestión
        document.getElementById('contrato').value = '';
        document.getElementById('nombre').value = '';
        
    } catch (error) {
        msg.className = 'error';
        msg.innerText = 'Error de conexión. Intente nuevamente.';
        msg.style.display = 'block';
        console.error('Error al enviar:', error);
    } finally {
        // Restablecer botón
        btn.disabled = false;
        btn.innerText = 'Publicar en Caliente';
    }
});
