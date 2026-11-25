// Conteneur "fetcher" : lit le flux XML d'Apple et le fournit à l'app en JSON
const http = require('node:http');
const { XMLParser } = require('fast-xml-parser');

const FEED_URL =
  process.env.FEED_URL ||
  'http://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/ws/RSS/topsongs/limit=10/xml';
const PORT = process.env.PORT || 4000;
const CACHE_MS = 10 * 60 * 1000; // on n'interroge Apple qu'une fois toutes les 10 minutes

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true, // <im:name> devient "name"
  parseTagValue: false, // un titre comme "12" reste du texte
  htmlEntities: true,
  isArray: (tag) => tag === 'entry' || tag === 'image',
});

let cache = { songs: null, date: 0 };

function parseSongs(xml) {
  // <content> répète les infos en HTML et dépasse la limite de sécurité du parseur
  const cleaned = xml.replace(/<content type="html">[\s\S]*?<\/content>/g, '');
  const entries = parser.parse(cleaned).feed?.entry;
  if (!entries) throw new Error('Flux XML sans chansons');

  return entries.slice(0, 10).map((e, i) => ({
    rank: i + 1,
    title: e.name,
    artist: e.artist?.['#text'] ?? e.artist,
    releaseDate: e.releaseDate?.['#text'],
    image: e.image?.at(-1)?.['#text'], // la plus grande pochette
    url: e.id?.['#text'],
  }));
}

async function getSongs() {
  if (cache.songs && Date.now() - cache.date < CACHE_MS) return cache.songs;

  try {
    const response = await fetch(FEED_URL, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Apple a répondu ${response.status}`);

    const songs = parseSongs(await response.text());
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
