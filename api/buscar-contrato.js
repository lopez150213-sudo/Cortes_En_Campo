export default async function handler(req, res) {
  // Encabezados CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl = process.env.WEB_APP_URL;

  if (!targetUrl) {
    return res.status(500).json({ error: 'La variable WEB_APP_URL no está configurada en Vercel' });
  }

  try {
    // PETICIÓN POST (Guardar registro)
    if (req.method === 'POST') {
      const bodyData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: bodyData,
        redirect: 'follow', // Necesario para Google Apps Script
      });

      const textData = await response.text();
      
      try {
        const data = JSON.parse(textData);
        return res.status(200).json(data);
      } catch (e) {
        return res.status(200).send(textData);
      }
    } 

    // PETICIÓN GET (Buscar contrato o consultar historial)
    const queryParams = new URLSearchParams(req.query).toString();
    const finalUrl = queryParams ? `${targetUrl}?${queryParams}` : targetUrl;
    
    const response = await fetch(finalUrl, {
      method: 'GET',
      redirect: 'follow', // Evita el error 500 al seguir la redirección
    });
    
    const textData = await response.text();

    try {
      const data = JSON.parse(textData);
      return res.status(200).json(data);
    } catch (e) {
      return res.status(200).send(textData);
    }

  } catch (error) {
    return res.status(500).json({ error: 'Error al conectar con Google Script', details: error.message });
  }
}