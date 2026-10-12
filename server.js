import http from 'http';
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as map from 'lib0/map';

const host = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '1234', 10);

const messageSync = 0;
const messageAwareness = 1;

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;

/**
 * @type {Map<string, WSSharedDoc>}
 */
const docs = new Map();

/**
 * Send a message to a WebSocket client.
 */
const send = (doc, conn, m) => {
  if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
    closeConn(doc, conn);
    return;
  }
  try {
    conn.send(m, (err) => {
      if (err != null) closeConn(doc, conn);
    });
  } catch (e) {
    closeConn(doc, conn);
  }
};

/**
 * Update handler for broadcasting document updates.
 */
const updateHandler = (update, origin, doc) => {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeUpdate(encoder, update);
  const message = encoding.toUint8Array(encoder);
  doc.conns.forEach((_, conn) => send(doc, conn, message));
};

/**
 * Shared Y.Doc for a room.
 */
class WSSharedDoc extends Y.Doc {
  constructor(name) {
    super({ gc: true });
    this.name = name;
    this.conns = new Map();
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);

    const awarenessChangeHandler = ({ added, updated, removed }, conn) => {
      const changedClients = added.concat(updated, removed);
      if (conn !== null) {
        const connControlledIDs = this.conns.get(conn);
        if (connControlledIDs !== undefined) {
          added.forEach((clientID) => connControlledIDs.add(clientID));
          removed.forEach((clientID) => connControlledIDs.delete(clientID));
        }
      }
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );
      const buff = encoding.toUint8Array(encoder);
      this.conns.forEach((_, c) => {
        send(this, c, buff);
      });
    };

    this.awareness.on('update', awarenessChangeHandler);
    this.on('update', updateHandler);
  }
}

/**
 * Retrieve or create a shared document.
 */
const getYDoc = (docname) =>
  map.setIfUndefined(docs, docname, () => {
    const doc = new WSSharedDoc(docname);
    docs.set(docname, doc);
    return doc;
  });

/**
 * Close connection and clean up awareness.
 */
const closeConn = (doc, conn) => {
  if (doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn);
    doc.conns.delete(conn);
    if (controlledIds) {
      awarenessProtocol.removeAwarenessStates(
        doc.awareness,
        Array.from(controlledIds),
        null
      );
    }
    if (doc.conns.size === 0) {
      doc.destroy();
      docs.delete(doc.name);
    }
  }
  try {
    conn.close();
  } catch {
    // ignore
  }
};

/**
 * Handle incoming WebSocket messages.
 */
const messageListener = (conn, doc, message) => {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);
    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn);
        if (encoding.length(encoder) > 1) {
          send(doc, conn, encoding.toUint8Array(encoder));
        }
        break;
      case messageAwareness:
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
    }
  } catch (err) {
    console.error('Error handling Yjs message:', err);
    doc.emit('error', [err]);
  }
};

/**
 * Setup WebSocket connection for a client.
 */
const setupWSConnection = (conn, req) => {
  conn.binaryType = 'arraybuffer';
  const url = req.url || '/';
  const docName = url.slice(1).split('?')[0] || 'default';

  const doc = getYDoc(docName);
  doc.conns.set(conn, new Set());

  conn.on('message', (message) => {
    messageListener(conn, doc, new Uint8Array(message));
  });

  // Heartbeat ping/pong to detect dead connections
  let pongReceived = true;
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConn(doc, conn);
      }
      clearInterval(pingInterval);
    } else if (doc.conns.has(conn)) {
      pongReceived = false;
      try {
        conn.ping();
      } catch {
        closeConn(doc, conn);
        clearInterval(pingInterval);
      }
    }
  }, 30000);

  conn.on('close', () => {
    closeConn(doc, conn);
    clearInterval(pingInterval);
  });

  conn.on('pong', () => {
    pongReceived = true;
  });

  // Send Sync Step 1 to new client
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc);
  send(doc, conn, encoding.toUint8Array(encoder));

  // Send current Awareness state to new client
  const awarenessStates = doc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, messageAwareness);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        doc.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    send(doc, conn, encoding.toUint8Array(awarenessEncoder));
  }
};

// Create HTTP server and attach WebSocket Server
const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Yjs WebSocket Server is running.');
});

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', setupWSConnection);

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

server.listen(port, host, () => {
  console.log(`🚀 Yjs WebSocket server running at ws://${host}:${port}`);
});
