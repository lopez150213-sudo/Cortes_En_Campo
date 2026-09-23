export default async function handler(req, res) {
  // Habilitar CORS para recibir peticiones desde tu sitio
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Obtener la URL oculta desde la Variable de Entorno
  const targetUrl = process.env.WEB_APP_URL;

  if (!targetUrl) {
    return res.status(500).json({ error: 'La variable WEB_APP_URL no está configurada' });
  }

  try {
    // Si viene una petición POST (al enviar formulario)
    if (req.method === 'POST') {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      return res.status(200).json(data);
    } 

    // Si viene una petición GET (al buscar contrato)
    const queryString = new URLSearchParams(req.query).toString();
    const response = await fetch(`${targetUrl}?${queryString}`);
    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Error al conectar con la API', details: error.message });
  }
}
