const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx--vS5LA_v0jQGn4PYRYNsWGWYkNqPCZtT4S2KYoWj6WZPBfwV9lRqJrtgaCwHgD1m/exec';

const contratoInput = document.getElementById('contrato');
const nombreInput = document.getElementById('nombre');
const fajaInput = document.getElementById('faja');
const searchStatus = document.getElementById('searchStatus');
const btnSubmit = document.getElementById('btnSubmit');

// 1. BUSCAR CONTRATO (Al perder el foco del campo)
contratoInput.addEventListener('blur', async () => {
    const contrato = contratoInput.value.trim();
    if (!contrato) return;

    searchStatus.innerText = 'Buscando cliente...';
    searchStatus.style.color = '#0066cc';
    nombreInput.value = '';
    fajaInput.value = ''; 
    btnSubmit.disabled = true;

    try {
        // Hacemos la petición normal
        const response = await fetch(`${WEB_APP_URL}?contrato=${contrato}`);
        
        // Convertimos a texto primero para burlar el bloqueo estricto de tipo MIME/CORS
        const textData = await response.text();
        const data = JSON.parse(textData);

        if (data.encontrado) {
            nombreInput.value = data.nombre;
            fajaInput.value = data.faja || 'S/F'; 
            searchStatus.innerText = 'Cliente encontrado ✔';
            searchStatus.style.color = '#155724';
            btnSubmit.disabled = false; // Habilitar botón de envío
        } else {
            searchStatus.innerText = 'Contrato no registrado en la base de datos ❌';
            searchStatus.style.color = '#721c24';
        }
    } catch (error) {
        searchStatus.innerText = 'Error al verificar contrato.';
        searchStatus.style.color = '#721c24';
        console.error("Error en la búsqueda:", error);
    }
});

// 2. ENVIAR GESTIÓN A LA PESTAÑA "RECEPCION"
document.getElementById('cutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const msg = document.getElementById('statusMessage');
    
    btnSubmit.disabled = true;
    btnSubmit.innerText = 'Publicando en tiempo real...';
    msg.style.display = 'none';

    // Construimos el paquete de datos (La faja NO se envía al Sheets de destino)
    const payload = {
        contrato: contratoInput.value,
        nombre: nombreInput.value,
        gestor: document.getElementById('gestor').value,
        estado: document.getElementById('estado').value
    };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Volvemos a modo seguro no-cors para evitar fallos de escritura
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        // Al usar no-cors, asumimos éxito si la petición de red se ejecuta sin disparar el catch
        msg.className = 'success';
        msg.innerText = '¡Datos publicados en la hoja de Recepción!';
        msg.style.display = 'block';
        
        // Limpiamos los campos del formulario para la próxima gestión
        document.getElementById('cutForm').reset();
        searchStatus.innerText = '';
        
    } catch (error) {
        msg.className = 'error';
        msg.innerText = 'Error al guardar la gestión. Intente nuevamente.';
        msg.style.display = 'block';
        console.error('Error al enviar:', error);
        btnSubmit.disabled = false;
    } finally {
        btnSubmit.innerText = 'Publicar en Caliente';
    }
});
