const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });
const rooms = new Map();

wss.on('connection', (ws, req) => {
  const room = new URL(req.url, 'http://localhost').searchParams.get('room');
  if (!room) return ws.close(1008, 'room required');

  if (!rooms.has(room)) rooms.set(room, new Set());
  const members = rooms.get(room);
  members.add(ws);

  ws.isAlive = true;
  ws.on('pong', () => (ws.isAlive = true));

  ws.on('message', (data, isBinary) => {
    for (const peer of members) {
      if (peer !== ws && peer.readyState === 1) peer.send(data, { binary: isBinary });
    }
  });

  ws.on('close', () => {
    members.delete(ws);
    if (members.size === 0) rooms.delete(room);
  });
  ws.on('error', () => {});
});

setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

console.log('HT relay jalan di port', PORT);
