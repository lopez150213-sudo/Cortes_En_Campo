const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw-lh0tK8-Ik9hAtpxhbzQ3R_RkXXOlSw-C7GUTToet8KZrtIy2f9R7UolfmegIqy7q/exec';

const contratoInput = document.getElementById('contrato');
const nombreInput = document.getElementById('nombre');
const telefonoInput = document.getElementById('telefono');
const searchStatus = document.getElementById('searchStatus');
const btnSubmit = document.getElementById('btnSubmit');

// 1. BUSCAR CONTRATO Y OBTENER NOMBRE Y TELÉFONO
contratoInput.addEventListener('blur', async () => {
    const contrato = contratoInput.value.trim();
    if (!contrato) return;

    searchStatus.innerText = 'Buscando cliente...';
    searchStatus.style.color = '#0066cc';
    nombreInput.value = '';
    telefonoInput.value = ''; 
    btnSubmit.disabled = true;

    try {
        const response = await fetch(`${WEB_APP_URL}?contrato=${contrato}`);
        const textData = await response.text();
        const data = JSON.parse(textData);

        if (data.encontrado) {
            nombreInput.value = data.nombre || '';
            telefonoInput.value = data.telefono || ''; 
            searchStatus.innerText = 'Cliente encontrado ✔';
            searchStatus.style.color = '#155724';
            btnSubmit.disabled = false;
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

// 2. ENVIAR A RECEPCIÓN Y ABRIR WHATSAPP AUTOMÁTICAMENTE
document.getElementById('cutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const msg = document.getElementById('statusMessage');
    const telRaw = telefonoInput.value.trim();
    const nombreVal = nombreInput.value;
    const contratoVal = contratoInput.value;
    const estadoVal = document.getElementById('estado').value;

    btnSubmit.disabled = true;
    btnSubmit.innerText = 'Procesando gestión...';
    msg.style.display = 'none';

    const payload = {
        contrato: contratoVal,
        nombre: nombreVal,
        gestor: document.getElementById('gestor').value,
        estado: estadoVal
    };

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        msg.className = 'success';
        msg.innerText = '¡Registro guardado exitosamente!';
        msg.style.display = 'block';

        // LÓGICA DE ENVÍO DE WHATSAPP
        if (telRaw) {
            let numLimpio = telRaw.replace(/\D/g, '');
            if (!numLimpio.startsWith('505')) {
                numLimpio = '505' + numLimpio;
            }

            const mensaje = `Estimado/a *${nombreVal}*, le informamos que su servicio contrato *${contratoVal}* ha sido suspendido (${estadoVal}). Para reconectar su servicio, por favor cancele su factura pendiente en nuestros puntos de pago autorizados.`;
            
            const urlWa = `https://api.whatsapp.com/send?phone=${numLimpio}&text=${encodeURIComponent(mensaje)}`;
            window.open(urlWa, '_blank');
        } else {
            alert('El cliente no tiene un teléfono registrado para enviar WhatsApp.');
        }

        // Limpiar formulario
        document.getElementById('cutForm').reset();
        searchStatus.innerText = '';
        
    } catch (error) {
        msg.className = 'error';
        msg.innerText = 'Error al guardar la gestión. Intente nuevamente.';
        msg.style.display = 'block';
        console.error('Error al enviar:', error);
        btnSubmit.disabled = false;
    } finally {
        btnSubmit.innerText = 'Enviar y Notificar por WhatsApp';
    }
});
