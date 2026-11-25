// Conteneur "fetcher" : récupère le Top 10 chez Apple et le fournit à l'app
const http = require('node:http');

const FEED_URL =
  process.env.FEED_URL ||
  'https://rss.marketingtools.apple.com/api/v2/fr/music/most-played/10/songs.json';
const PORT = process.env.PORT || 4000;
const CACHE_MS = 10 * 60 * 1000; // on n'interroge Apple qu'une fois toutes les 10 minutes

let cache = { songs: null, date: 0 };

async function getSongs() {
  if (cache.songs && Date.now() - cache.date < CACHE_MS) return cache.songs;

  try {
    const response = await fetch(FEED_URL, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Apple a répondu ${response.status}`);
    const { feed } = await response.json();

    const songs = feed.results.slice(0, 10).map((s, i) => ({
      rank: i + 1,
      title: s.name,
      artist: s.artistName,
      releaseDate: s.releaseDate,
      image: s.artworkUrl100,
      url: s.url,
    }));
    cache = { songs, date: Date.now() };
    return songs;
  } catch (err) {
    console.error('Erreur Apple :', err.message);
    if (cache.songs) return cache.songs; // on garde l'ancienne liste en secours
    throw err;
  }
}

http
  .createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };

    if (req.url !== '/songs') return send(404, { error: 'Route inconnue' });

    try {
      send(200, await getSongs());
    } catch {
      send(502, { error: 'Impossible de contacter Apple' });
    }
  })
  .listen(PORT, () => console.log(`Fetcher disponible sur le port ${PORT}`));

process.on('SIGTERM', () => process.exit(0));
