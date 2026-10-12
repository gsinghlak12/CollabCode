import React, { useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import type { editor as monacoEditor } from 'monaco-editor';
import { UserProfile, ConnectionStatus } from '../types';
import { updateCursorStyles } from '../utils/user';

interface CollaborativeEditorProps {
  room: string;
  serverUrl: string;
  user: UserProfile;
  language: string;
  theme: string;
  onStatusChange?: (status: ConnectionStatus) => void;
  onCollaboratorsChange?: (collaborators: Array<{ clientId: number; user: UserProfile; isSelf: boolean }>) => void;
}

const getStarterCode = (userName: string) => `// 🚀 Welcome to the Collaborative Monaco Editor!
// Powered by Vite, React, @monaco-editor/react, Yjs, y-websocket & y-monaco.

// 👥 Collaborative features:
// 1. Open this link in another tab or send it to a teammate.
// 2. Edits sync in real-time with CRDT conflict resolution.
// 3. Move your cursor to see live remote cursors with colored name tags!

interface Developer {
  name: string;
  role: string;
  online: boolean;
}

const currentDev: Developer = {
  name: "${userName.replace(/"/g, '')}",
  role: "Collaborative Coder",
  online: true,
};

function startPairProgramming(dev: Developer) {
  console.log(\`✨ \${dev.name} connected to real-time session.\`);
  return { status: "Active", timestamp: new Date().toISOString() };
}

startPairProgramming(currentDev);
`;

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  room,
  serverUrl,
  user,
  language,
  theme,
  onStatusChange,
  onCollaboratorsChange,
}) => {
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  // Setup Yjs and Monaco binding when editor is mounted or connection parameters change
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    // Clean up any previous session
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (docRef.current) {
      docRef.current.destroy();
      docRef.current = null;
    }

    onStatusChange?.('connecting');

    // 1. Initialize Yjs Doc
    const doc = new Y.Doc();
    docRef.current = doc;

    // 2. Initialize y-websocket provider
    const provider = new WebsocketProvider(serverUrl, room, doc);
    providerRef.current = provider;

    // Set local awareness profile (name and color for cursor)
    provider.awareness.setLocalStateField('user', user);

    // Listen to connection status events
    const handleStatus = (event: { status: 'connected' | 'connecting' | 'disconnected' }) => {
      onStatusChange?.(event.status);
    };
    provider.on('status', handleStatus);

    // Listen to awareness changes (remote cursors & active collaborators)
    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates();
      updateCursorStyles(states as Map<number, { user?: UserProfile }>);

      const collaborators: Array<{ clientId: number; user: UserProfile; isSelf: boolean }> = [];
      states.forEach((state, clientId) => {
        if (state.user) {
          collaborators.push({
            clientId,
            user: state.user as UserProfile,
            isSelf: clientId === doc.clientID,
          });
        }
      });

      onCollaboratorsChange?.(collaborators);
    };

    provider.awareness.on('change', handleAwarenessChange);
    handleAwarenessChange();

    // 3. Bind Yjs text type to Monaco editor model using y-monaco
    const ytext = doc.getText('monaco');
    const binding = new MonacoBinding(
      ytext,
      model,
      new Set([editor]),
      provider.awareness
    );
    bindingRef.current = binding;

    // Provide default code if the document is brand new/empty
    const checkInitialContent = () => {
      if (ytext.toString().trim() === '') {
        ytext.insert(0, getStarterCode(user.name));
      }
    };

    provider.once('sync', (isSynced: boolean) => {
      if (isSynced && ytext.toString().trim() === '') {
        ytext.insert(0, getStarterCode(user.name));
      }
    });

    const timer = setTimeout(checkInitialContent, 400);

    return () => {
      clearTimeout(timer);
      provider.off('status', handleStatus);
      provider.awareness.off('change', handleAwarenessChange);
      binding.destroy();
      provider.destroy();
      doc.destroy();
      bindingRef.current = null;
      providerRef.current = null;
      docRef.current = null;
    };
  }, [room, serverUrl]);

  // Update user profile in awareness when user state changes
  useEffect(() => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField('user', user);
    }
  }, [user]);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    // Trigger re-render / connection setup by forcing an update
    const model = editor.getModel();
    if (!model) return;

    // Initial setup if not already performed
    if (!docRef.current) {
      const doc = new Y.Doc();
      docRef.current = doc;

      const provider = new WebsocketProvider(serverUrl, room, doc);
      providerRef.current = provider;

      provider.awareness.setLocalStateField('user', user);

      const handleStatus = (event: { status: 'connected' | 'connecting' | 'disconnected' }) => {
        onStatusChange?.(event.status);
      };
      provider.on('status', handleStatus);

      const handleAwarenessChange = () => {
        const states = provider.awareness.getStates();
        updateCursorStyles(states as Map<number, { user?: UserProfile }>);

        const collaborators: Array<{ clientId: number; user: UserProfile; isSelf: boolean }> = [];
        states.forEach((state, clientId) => {
          if (state.user) {
            collaborators.push({
              clientId,
              user: state.user as UserProfile,
              isSelf: clientId === doc.clientID,
            });
          }
        });

        onCollaboratorsChange?.(collaborators);
      };

      provider.awareness.on('change', handleAwarenessChange);
      handleAwarenessChange();

      const ytext = doc.getText('monaco');
      const binding = new MonacoBinding(
        ytext,
        model,
        new Set([editor]),
        provider.awareness
      );
      bindingRef.current = binding;

      const checkInitialContent = () => {
        if (ytext.toString().trim() === '') {
          ytext.insert(0, getStarterCode(user.name));
        }
      };

      provider.once('sync', (isSynced: boolean) => {
        if (isSynced && ytext.toString().trim() === '') {
          ytext.insert(0, getStarterCode(user.name));
        }
      });

      setTimeout(checkInitialContent, 400);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Editor
        height="100%"
        width="100%"
        language={language}
        theme={theme}
        onMount={handleEditorDidMount}
        options={{
          automaticLayout: true,
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
          fontLigatures: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderWhitespace: 'selection',
          tabSize: 2,
          wordWrap: 'on',
        }}
      />
    </div>
  );
};
