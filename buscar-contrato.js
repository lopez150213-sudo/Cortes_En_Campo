export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
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
    return res.status(500).json({ error: 'La variable WEB_APP_URL no está configurada' });
  }

  try {
    if (req.method === 'POST') {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      return res.status(200).json(data);
    } 

    // Reenviar parámetros GET
    const queryParams = new URLSearchParams(req.query).toString();
    const finalUrl = queryParams ? `${targetUrl}?${queryParams}` : targetUrl;
    
    const response = await fetch(finalUrl);
    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Error al conectar con la API', details: error.message });
  }
}
