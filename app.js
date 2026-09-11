const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwDy8_hfzxB16rabEErqqmRG7wUUts9IxiQ2MubcBUZqnvXu_fI72gT_2mLmv4btuXe/exec';

const contratoInput = document.getElementById('contrato');
const nombreInput = document.getElementById('nombre');
const telefonoInput = document.getElementById('telefono');
const searchStatus = document.getElementById('searchStatus');
const btnSubmit = document.getElementById('btnSubmit');
const gestorSelect = document.getElementById('gestor');

let clienteEncontradoNombre = '';
let clienteEncontradoTelefono = '';
let clienteEncontradoMonto = '';

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
    clienteEncontradoMonto = '';
    btnSubmit.disabled = true;

    try {
        const response = await fetch(`${WEB_APP_URL}?contrato=${contrato}`);
        const textData = await response.text();
        const data = JSON.parse(textData);

        if (data.encontrado) {
            clienteEncontradoNombre = (data.nombre || '').trim();
            clienteEncontradoTelefono = (data.telefono || '').trim();
            clienteEncontradoMonto = (data.monto || '').trim();

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
    
    const nombreVal = clienteEncontradoNombre || nombreInput.value.trim();
    const telCliente = clienteEncontradoTelefono || telefonoInput.value.trim();
    const montoVal = clienteEncontradoMonto;
    const contratoVal = contratoInput.value.trim();
    const estadoVal = document.getElementById('estado').value;

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

        if (telCliente) {
            let numLimpio = telCliente.replace(/\D/g, '');
            if (!numLimpio.startsWith('505')) {
                numLimpio = '505' + numLimpio;
            }

          const saludo = nombreVal ? `Estimado/a *${nombreVal}*` : 'Estimado Cliente';
const textoMonto = montoVal ? ` por un monto pendiente de C$ ${montoVal}` : '';
const textoContrato = contratoVal ? ` (Contrato N°: *${contratoVal}*)` : '';

const mensaje = `${saludo}, le informamos que su servicio${textoContrato} fue suspendido por falta de pago${textoMonto}. Le invitamos a cancelar su factura en AMPM, SuperExpress, Agentes Banpro, RapiBac, Telepago 18001524, Nuestro Portal Web https://pago.telecablegranada.com/ , Western, Sucursal o Gestor de cliente (${nombreGestor}: ${telGestor}).\n\nSi ya realizó su pago, enviar el comprobante a este número o a Atención al Cliente al 82573189.`;
            const urlWa = `https://api.whatsapp.com/send?phone=${numLimpio}&text=${encodeURIComponent(mensaje)}`;
            window.location.href = urlWa;
        } else {
            alert('El cliente no tiene un teléfono registrado para enviar WhatsApp.');
        }

        document.getElementById('cutForm').reset();
        searchStatus.innerText = '';
        clienteEncontradoNombre = '';
        clienteEncontradoTelefono = '';
        clienteEncontradoMonto = '';
        
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


// 3. EVENTO PARA VER TODOS LOS CORTES REGISTRADOS EN "RECEPCION"
const btnVerCortes = document.getElementById('btnVerCortes');
if (btnVerCortes) {
    btnVerCortes.addEventListener('click', async () => {
        const container = document.getElementById('tablaCortesContainer');
        const tbody = document.getElementById('tbodyCortes');
        tbody.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center;">Cargando cortes...</td></tr>';
        container.style.display = 'block';

        try {
            const response = await fetch(`${WEB_APP_URL}?action=obtenerCortes`);
            const textData = await response.text();
            const data = JSON.parse(textData);

            if (data.exito && data.cortes.length > 0) {
                tbody.innerHTML = '';
                data.cortes.reverse().forEach(c => { // .reverse() para mostrar los más recientes primero
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="padding: 8px;">${c.fecha}</td>
                        <td style="padding: 8px;">${c.contrato}</td>
                        <td style="padding: 8px;">${c.nombre}</td>
                        <td style="padding: 8px;">${c.gestor}</td>
                        <td style="padding: 8px; font-weight: bold;">${c.estado}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center;">No hay cortes registrados.</td></tr>';
            }
        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center; color: red;">Error al obtener datos.</td></tr>';
            console.error('Error al consultar cortes:', error);
        }
    });
}
