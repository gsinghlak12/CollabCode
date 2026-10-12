import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, room }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>👥 Collaborative Monaco Editor Guide</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <section className="modal-section">
            <h4>1. How to Test Multi-Cursor Collaboration</h4>
            <p>
              Open this same page in a <strong>new browser tab or private window</strong>:
            </p>
            <div className="code-box">
              <code>{`${window.location.origin}?room=${room}`}</code>
            </div>
            <p>
              As you type and move your cursor in either tab, you will immediately see the other user's
              <strong> live cursor, name tag, and real-time text edits</strong>!
            </p>
          </section>

          <section className="modal-section">
            <h4>2. How the Tech Stack Works</h4>
            <ul>
              <li>
                <strong>@monaco-editor/react:</strong> Renders the full-screen VS Code Monaco Editor in React.
              </li>
              <li>
                <strong>Yjs:</strong> A high-performance Conflict-free Replicated Data Type (CRDT) engine ensuring
                eventual consistency without merge conflicts.
              </li>
              <li>
                <strong>y-websocket:</strong> Manages real-time communication over WebSockets with automatic fallback to
                browser <code>BroadcastChannel</code> for instant local cross-tab sync.
              </li>
              <li>
                <strong>y-monaco:</strong> Binds the Yjs shared text structure to the Monaco Editor model and shares
                cursor positions and selections via Yjs Awareness protocol.
              </li>
            </ul>
          </section>

          <section className="modal-section">
            <h4>3. Running the Local WebSocket Server</h4>
            <p>To run your own local Yjs WebSocket relay server on port 1234, run:</p>
            <div className="code-box">
              <code>npm run server</code>
            </div>
            <p className="note">
              Default preset connects to <code>ws://localhost:1234</code>. You can also select the Public Demo server in
              the toolbar dropdown.
            </p>
          </section>
        </div>

        <div className="modal-footer">
          <button className="toolbar-btn primary" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
