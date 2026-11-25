// Conteneur "app" : demande les chansons au fetcher et les affiche
const express = require('express');

const app = express();
// Dans Docker, "fetcher" est le nom du service défini dans docker-compose.yml
const FETCHER_URL = process.env.FETCHER_URL || 'http://fetcher:4000';

async function getTopSongs() {
  const response = await fetch(`${FETCHER_URL}/songs`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Le fetcher a répondu ${response.status}`);
  return response.json();
}

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// API JSON
app.get('/api/songs', async (req, res) => {
  try {
    res.json(await getTopSongs());
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: 'Chansons indisponibles' });
  }
});

// Page web
app.get('/', async (req, res) => {
  try {
    const songs = await getTopSongs();
    const lignes = songs
      .map(
        (s) => `<tr>
          <td>${s.rank}</td>
          <td><img src="${escapeHtml(s.image)}" alt="" width="50" height="50"></td>
          <td><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.title)}</a></td>
          <td>${escapeHtml(s.artist)}</td>
        </tr>`
      )
      .join('');
    res.send(`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Top 10 Apple Music</title>
  <style>
    body { font-family: sans-serif; max-width: 720px; margin: 40px auto; padding: 0 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: left; }
    img { border-radius: 6px; display: block; }
  </style>
</head>
<body>
  <h1>Top 10 Apple Music (France)</h1>
  <table>
    <tr><th>#</th><th></th><th>Titre</th><th>Artiste</th></tr>
    ${lignes}
  </table>
</body>
</html>`);
  } catch (err) {
    console.error(err.message);
    res.status(502).send('Chansons indisponibles, réessayez dans un instant.');
  }
});

app.listen(3000, () => console.log('App disponible sur http://localhost:3000'));

// Arrêt rapide avec "docker compose down"
process.on('SIGTERM', () => process.exit(0));
