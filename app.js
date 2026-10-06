// 1. CONFIGURACIÓN E INSTANCIA DE SUPABASE
const { createClient } = window.supabase;

const SUPABASE_URL = 'https://wgvsfzymktdrsrhdcjoo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MUUt6Qp0NnITrTsYVkIjoQ_F-Zu3v6z';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ⚠️ URL DE TU GOOGLE APPS SCRIPT
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyro2Ja3VFmBQzXMeDab69Zhvfuw1AGUw8iYte0pevOS33WA5xHYslwSfLVRr6VeGMA/exec";

// ELEMENTOS DEL DOM
const contratoInput = document.getElementById('contrato');
const nombreInput = document.getElementById('nombre');
const telefonoInput = document.getElementById('telefono');
const searchStatus = document.getElementById('searchStatus');
const fajaBadge = document.getElementById('fajaBadge');
const btnSubmit = document.getElementById('btnSubmit');
const gestorSelect = document.getElementById('gestor');

let clienteEncontradoNombre = '';
let clienteEncontradoTelefono = '';
let clienteEncontradoMonto = '';

// 2. BUSCAR CONTRATO EN BASE DE DATOS (SUPABASE)
async function buscarContrato(numeroContrato) {
  if (!numeroContrato) return;

  if (searchStatus) searchStatus.innerText = 'Buscando...';
  if (fajaBadge) fajaBadge.style.display = 'none';

  try {
    const { data, error } = await supabaseClient
      .from('cartera_cobros')
      .select('*')
      .eq('Contrato', numeroContrato)
      .maybeSingle();

    if (error) {
      console.error('Error al consultar Supabase:', error);
      if (searchStatus) searchStatus.innerText = 'Error en la búsqueda';
      if (fajaBadge) fajaBadge.style.display = 'none';
      return;
    }

    if (!data) {
      if (searchStatus) searchStatus.innerText = 'Contrato no encontrado';
      if (nombreInput) nombreInput.value = '';
      if (telefonoInput) telefonoInput.value = '';
      clienteEncontradoNombre = '';
      clienteEncontradoTelefono = '';
      clienteEncontradoMonto = '';
      if (fajaBadge) fajaBadge.style.display = 'none';
      return;
    }

    if (searchStatus) searchStatus.innerText = 'Cliente encontrado';

    // MOSTRAR LA FAJA OBTENIDA DE SUPABASE
    const fajaValor = data.Faja || data.faja || '';
    if (fajaBadge && fajaValor) {
      fajaBadge.innerText = fajaValor;
      fajaBadge.style.display = 'inline-block';
    } else if (fajaBadge) {
      fajaBadge.style.display = 'none';
    }

    // Asignamos variables globales
    clienteEncontradoNombre = data.Nombre_Cliente || '';
    clienteEncontradoTelefono = data.Telefono_1 || data.Telefono_2 || '';
    clienteEncontradoMonto = data.Monto || '';

    // Rellenamos las cajas de texto del formulario
    if (nombreInput) nombreInput.value = clienteEncontradoNombre;
    if (telefonoInput) telefonoInput.value = clienteEncontradoTelefono;

  } catch (err) {
    console.error('Error inesperado:', err);
    if (searchStatus) searchStatus.innerText = 'Error inesperado';
    if (fajaBadge) fajaBadge.style.display = 'none';
  }
}

// ESCUCHADORES PARA BÚSQUEDA AUTOMÁTICA
if (contratoInput) {
  contratoInput.addEventListener('change', (e) => {
    buscarContrato(e.target.value.trim());
  });

  contratoInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val.length >= 5) {
      buscarContrato(val);
    }
  });
}

// 3. REGISTRAR EN GOOGLE SHEETS Y NOTIFICAR POR WHATSAPP
const cutForm = document.getElementById('cutForm');
if (cutForm) {
  cutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const msg = document.getElementById('statusMessage');
    
    const nombreVal = clienteEncontradoNombre || (nombreInput ? nombreInput.value.trim() : '');
    const telCliente = clienteEncontradoTelefono || (telefonoInput ? telefonoInput.value.trim() : '');
    const montoVal = clienteEncontradoMonto;
    const contratoVal = contratoInput ? contratoInput.value.trim() : '';
    const estadoVal = document.getElementById('estado') ? document.getElementById('estado').value : '';

    const selectedGestorOption = gestorSelect ? gestorSelect.options[gestorSelect.selectedIndex] : null;
    const nombreGestor = selectedGestorOption ? selectedGestorOption.value : '';
    const telGestor = selectedGestorOption ? selectedGestorOption.getAttribute('data-telefono') || '' : '';

    if (!nombreGestor || nombreGestor === '' || nombreGestor === 'Seleccione un gestor') {
      alert('Por favor, seleccione un gestor en campo.');
      return;
    }

    if (!telCliente) {
      alert('El cliente no tiene un teléfono registrado para enviar WhatsApp.');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerText = 'Procesando gestión...';
    if (msg) msg.style.display = 'none';

    // Construcción del número y mensaje
    let numLimpio = telCliente.replace(/\D/g, '');
    if (!numLimpio.startsWith('505')) {
      numLimpio = '505' + numLimpio;
    }

    const saludo = nombreVal ? `Estimado/a *${nombreVal}*` : 'Estimado Cliente';
    const textoMonto = montoVal ? ` por un monto pendiente de C$ ${montoVal}` : '';
    const textoContrato = contratoVal ? ` (Contrato N°: *${contratoVal}*)` : '';

    const mensaje = `${saludo}, le informamos que su servicio${textoContrato} fue suspendido por falta de pago${textoMonto}. Le invitamos a cancelar su factura en AMPM, SuperExpress, Agentes Banpro, RapiBac, Telepago 18001524, Nuestro Portal Web https://pago.telecablegranada.com/ , Western, Sucursal o Gestor de cliente (${nombreGestor}: ${telGestor}).\n\nSi ya realizó su pago, enviar el comprobante a este número o a Atención al Cliente al 82573189.`;
    
    // Usamos el formato universal wa.me que abre nativamente la app
    const urlWa = `https://wa.me/${numLimpio}?text=${encodeURIComponent(mensaje)}`;

    const payload = {
      fecha: new Date().toLocaleString('es-NI'),
      contrato: contratoVal,
      nombre: nombreVal,
      telefono: telCliente,
      gestor: nombreGestor,
      estado: estadoVal
    };

    // 1. GUARDAR EN GOOGLE SHEETS
    try {
      if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("TU_SCRIPT_ID")) {
        // Ejecutamos la petición de guardado
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
    } catch (error) {
      console.error('Error al guardar en Google Sheets:', error);
    }

    // 2. REHABILITAR Y LIMPIAR EL FORMULARIO
    btnSubmit.disabled = false;
    btnSubmit.innerText = 'Enviar y Notificar por WhatsApp';

    cutForm.reset();
    if (searchStatus) searchStatus.innerText = '';
    if (fajaBadge) fajaBadge.style.display = 'none';
    clienteEncontradoNombre = '';
    clienteEncontradoTelefono = '';
    clienteEncontradoMonto = '';

    // 3. ABRIR WHATSAPP
    // En móviles usamos location.href para evitar que el navegador bloquee la ventana emergente
    window.location.href = urlWa;
  });
}

// 4. VER TODOS LOS CORTES REGISTRADOS DESDE GOOGLE SHEETS
const btnVerCortes = document.getElementById('btnVerCortes');
if (btnVerCortes) {
  btnVerCortes.addEventListener('click', async () => {
    const container = document.getElementById('tablaCortesContainer');
    const tbody = document.getElementById('tbodyCortes');
    if (!tbody || !container) return;

    tbody.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center;">Cargando cortes...</td></tr>';
    container.style.display = 'block';

    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=obtenerCortes`);
      const data = await response.json();

      if (data.exito && data.cortes && data.cortes.length > 0) {
        tbody.innerHTML = '';
        data.cortes.reverse().forEach(c => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="padding: 8px;">${c.fecha || ''}</td>
            <td style="padding: 8px;">${c.contrato || ''}</td>
            <td style="padding: 8px;">${c.nombre || ''}</td>
            <td style="padding: 8px;">${c.gestor || ''}</td>
            <td style="padding: 8px; font-weight: bold;">${c.estado || ''}</td>
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