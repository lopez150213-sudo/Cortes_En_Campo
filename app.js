const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyApWyy_QREForRFZKDXKYZQfYUOavnzQvOsAIM3_WsDv-3y-vd5T89Hc6P7l5ZaHo/exec';

const contratoInput = document.getElementById('contrato');
const nombreInput = document.getElementById('nombre');
const telefonoInput = document.getElementById('telefono');
const searchStatus = document.getElementById('searchStatus');
const btnSubmit = document.getElementById('btnSubmit');
const gestorSelect = document.getElementById('gestor');

// Variables en memoria para evitar fallos si el formulario se limpia
let clienteEncontradoNombre = '';
let clienteEncontradoTelefono = '';

// 1. BUSCAR CONTRATO EN BASE DE DATOS
contratoInput.addEventListener('blur', async () => {
    const contrato = contratoInput.value.trim();
    if (!contrato) return;

    searchStatus.innerText = 'Buscando cliente...';
    searchStatus.style.color = '#0066cc';
    nombreInput.value = '';
    telefonoInput.value = ''; 
    clienteEncontradoNombre = '';
    clienteEncontradoTelefono = '';
    btnSubmit.disabled = true;

    try {
        const response = await fetch(`${WEB_APP_URL}?contrato=${contrato}`);
        const textData = await response.text();
        const data = JSON.parse(textData);

        if (data.encontrado) {
            // Guardamos directamente en memoria
            clienteEncontradoNombre = (data.nombre || '').trim();
            clienteEncontradoTelefono = (data.telefono || '').trim();

            nombreInput.value = clienteEncontradoNombre;
            telefonoInput.value = clienteEncontradoTelefono; 
            
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

// 2. REGISTRAR EN RECEPCIÓN Y NOTIFICAR POR WHATSAPP
document.getElementById('cutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const msg = document.getElementById('statusMessage');
    
    // Prioridad a la variable guardada en memoria, o lectura directa del DOM como respaldo
    const nombreVal = clienteEncontradoNombre || nombreInput.value.trim();
    const telCliente = clienteEncontradoTelefono || telefonoInput.value.trim();
    const contratoVal = contratoInput.value.trim();
    const estadoVal = document.getElementById('estado').value;

    // Obtener gestor y su número asignado
    const selectedGestorOption = gestorSelect.options[gestorSelect.selectedIndex];
    const nombreGestor = selectedGestorOption.value;
    const telGestor = selectedGestorOption.getAttribute('data-telefono');

    btnSubmit.disabled = true;
    btnSubmit.innerText = 'Procesando gestión...';
    msg.style.display = 'none';

    const payload = {
        contrato: contratoVal,
        nombre: nombreVal,
        gestor: nombreGestor,
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

        // CONSTRUCCIÓN DEL MENSAJE DE WHATSAPP
        if (telCliente) {
            let numLimpio = telCliente.replace(/\D/g, '');
            if (!numLimpio.startsWith('505')) {
                numLimpio = '505' + numLimpio;
            }

            const saludo = nombreVal ? `Estimado/a *${nombreVal}*` : 'Estimado Cliente';

            const mensaje = `${saludo}, le informamos que su servicio fue suspendido por falta de pago. Le invitamos a cancelar su factura en AMPM, SuperExpress, Agentes Banpro, RapiBac, Telepago 18001524, Nuestro Portal Web https://portal.telecablegranada.com/ , Western, Sucursal o Gestor de cliente (${nombreGestor}: ${telGestor}).\n\nSi ya realizó su pago, enviar el comprobante a este número o a Atención al Cliente al 82573189.`;
            
            const urlWa = `https://api.whatsapp.com/send?phone=${numLimpio}&text=${encodeURIComponent(mensaje)}`;
            window.open(urlWa, '_blank');
        } else {
            alert('El cliente no tiene un teléfono registrado para enviar WhatsApp.');
        }

        // Limpiar formulario y variables tras abrir la ventana
        document.getElementById('cutForm').reset();
        searchStatus.innerText = '';
        clienteEncontradoNombre = '';
        clienteEncontradoTelefono = '';
        
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
