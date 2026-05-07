// Server-Sent Events (SSE) manager
// Keeps track of all connected frontend clients
// and broadcasts messages to all of them

const clients = new Set();

// Called when a frontend client connects to /api/notifications/stream
function addClient(res) {
  // Set headers to keep the connection open
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send a heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Add this client to our set
  clients.add(res);

  // Remove client when they disconnect (close browser tab etc.)
  res.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}

// Called when we want to send a notification to ALL connected clients
function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}

module.exports = { addClient, broadcast };
