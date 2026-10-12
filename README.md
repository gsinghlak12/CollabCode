# Collaborative Monaco Editor

A real-time collaborative code editor built with **React**, **Vite**, **@monaco-editor/react**, **Yjs**, **y-websocket**, and **y-monaco**.

## Features

- **Full-Screen Monaco Editor**: Full VS Code-style editor experience with syntax highlighting, auto-completion, minimap, and customizable themes (`vs-dark`, `light`, `hc-black`).
- **Conflict-Free Real-Time Collaboration**: Powered by **Yjs** CRDT (Conflict-free Replicated Data Type) engine for high-speed, mathematically guaranteed convergence.
- **Shared Cursors & Presence**: Visual multi-cursor tracking with colored selection highlights and remote collaborator name tags rendered directly inside Monaco using **y-monaco** and Yjs Awareness protocol.
- **Flexible WebSocket Provider**: Connects to a local WebSocket relay server (`ws://localhost:1234`), a public demo server (`wss://demos.yjs.dev/ws`), or custom endpoints.
- **Cross-Tab Synchronization**: Works instantly across browser tabs on the same origin via `BroadcastChannel` even without a running remote server.
- **Room Management & Link Sharing**: Join custom rooms using the `?room=<roomId>` URL query parameter, and easily copy shareable invite links with one click.
- **Customizable Collaborator Profiles**: Persistent user profiles with random identity generation, color assignment, and inline rename capability.
- **Multi-Language Support**: Switch on-the-fly between TypeScript, JavaScript, Python, HTML, CSS, JSON, Markdown, Rust, and SQL.

---

## Getting Started

### 1. Start the Local WebSocket Server
In one terminal, start the local Yjs WebSocket relay server (runs on `localhost:1234`):

```bash
npm run server
```

### 2. Start the Vite Development Server
In another terminal, start the Vite dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Testing Multi-Cursor Collaboration

1. Open the app at [http://localhost:5173](http://localhost:5173).
2. Open the exact same link in a **second browser window, tab, or incognito window**.
3. Move your cursor or type in either window — you will see:
   - Real-time text changes synced instantly without conflicts.
   - Remote cursor line and animated cursor head.
   - Collaborator name tag hovering above the remote cursor.
   - Selection highlighting in the peer's assigned color.
   - Collaborator avatar chips updating in real-time in the top toolbar.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                      Monaco Editor                     │
│                (@monaco-editor/react)                  │
└──────────────────────────▲─────────────────────────────┘
                           │ (MonacoBinding)
┌──────────────────────────▼─────────────────────────────┐
│                         y-monaco                       │
│      (Binds Y.Text to Monaco TextModel & Awareness)    │
└──────────────────────────▲─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                          Yjs                           │
│     (Y.Doc, Y.Text 'monaco', Conflict-Free CRDT)       │
└──────────────────────────▲─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                      y-websocket                       │
│    (WebsocketProvider: ws://localhost:1234 + BC)       │
└────────────────────────────────────────────────────────┘
```

- **`src/components/CollaborativeEditor.tsx`**: Initializes `Y.Doc`, `WebsocketProvider`, and binds them to Monaco via `MonacoBinding`.
- **`src/components/Toolbar.tsx`**: Handles room switching, server selection, collaborator badges, language/theme selectors, and user identity.
- **`src/utils/user.ts`**: Manages collaborator colors, identities, and dynamic CSS rule generation for `.yRemoteSelection-${clientId}` and `.yRemoteSelectionHead-${clientId}`.

---

## Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run server`: Starts the local Yjs WebSocket relay server on `ws://localhost:1234`.
- `npm run build`: Type-checks and builds the project for production (`tsc -b && vite build`).
- `npm run preview`: Locally previews the production build.
