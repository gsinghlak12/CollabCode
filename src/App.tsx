import { useState, useEffect } from 'react';
import { CollaborativeEditor } from './components/CollaborativeEditor';
import { Toolbar } from './components/Toolbar';
import { HelpModal } from './components/HelpModal';
import { UserProfile, ConnectionStatus } from './types';
import { getOrCreateUserProfile, saveUserProfile } from './utils/user';
import './App.css';

function getInitialRoom(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && roomParam.trim()) {
      return roomParam.trim();
    }
  } catch {
    // fallback
  }
  return 'collab-monaco-room';
}

function App() {
  const [room, setRoom] = useState<string>(getInitialRoom);
  const [serverUrl, setServerUrl] = useState<string>('ws://localhost:1234');
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [user, setUser] = useState<UserProfile>(getOrCreateUserProfile);
  const [collaborators, setCollaborators] = useState<
    Array<{ clientId: number; user: UserProfile; isSelf: boolean }>
  >([]);
  const [language, setLanguage] = useState<string>('typescript');
  const [theme, setTheme] = useState<string>('vs-dark');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Sync room in URL query parameter without full reload
  const handleRoomChange = (newRoom: string) => {
    setRoom(newRoom);
    try {
      const url = new URL(window.location.href);
      if (newRoom && newRoom !== 'collab-monaco-room') {
        url.searchParams.set('room', newRoom);
      } else {
        url.searchParams.delete('room');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  const handleUserChange = (updated: UserProfile) => {
    setUser(updated);
    saveUserProfile(updated);
  };

  // Keyboard shortcut (Escape to close modal, ? for help)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHelpOpen) {
        setIsHelpOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpOpen]);

  return (
    <div className="app-container">
      <Toolbar
        room={room}
        onRoomChange={handleRoomChange}
        serverUrl={serverUrl}
        onServerUrlChange={setServerUrl}
        status={status}
        collaborators={collaborators}
        currentUser={user}
        onUserChange={handleUserChange}
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeChange={setTheme}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main className="editor-wrapper">
        <CollaborativeEditor
          key={`${serverUrl}-${room}`}
          room={room}
          serverUrl={serverUrl}
          user={user}
          language={language}
          theme={theme}
          onStatusChange={setStatus}
          onCollaboratorsChange={setCollaborators}
        />
      </main>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        room={room}
      />
    </div>
  );
}

export default App;
