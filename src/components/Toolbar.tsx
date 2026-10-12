import React, { useState } from 'react';
import { UserProfile, ConnectionStatus } from '../types';

interface ToolbarProps {
  room: string;
  onRoomChange: (newRoom: string) => void;
  serverUrl: string;
  onServerUrlChange: (newUrl: string) => void;
  status: ConnectionStatus;
  collaborators: Array<{ clientId: number; user: UserProfile; isSelf: boolean }>;
  currentUser: UserProfile;
  onUserChange: (updated: UserProfile) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
  onOpenHelp: () => void;
}

const LANGUAGES = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'rust', label: 'Rust' },
  { id: 'sql', label: 'SQL' },
];

const PRESET_SERVERS = [
  { label: 'Local Server (ws://localhost:1234)', value: 'ws://localhost:1234' },
  { label: 'Public Demo (wss://demos.yjs.dev/ws)', value: 'wss://demos.yjs.dev/ws' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  room,
  onRoomChange,
  serverUrl,
  onServerUrlChange,
  status,
  collaborators,
  currentUser,
  onUserChange,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  onOpenHelp,
}) => {
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userNameInput, setUserNameInput] = useState(currentUser.name);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', room);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUserSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (userNameInput.trim()) {
      onUserChange({ ...currentUser, name: userNameInput.trim() });
      setIsEditingUser(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#10B981'; // Green
      case 'connecting':
        return '#F59E0B'; // Yellow/Amber
      case 'disconnected':
      default:
        return '#EF4444'; // Red
    }
  };

  return (
    <header className="toolbar-container">
      {/* Brand / Logo */}
      <div className="toolbar-section toolbar-brand">
        <div className="logo-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </div>
        <span className="brand-title">CollabCode</span>
      </div>

      {/* Room and Server Config */}
      <div className="toolbar-section toolbar-room-config">
        <div className="input-group">
          <label htmlFor="room-input">Room:</label>
          <input
            id="room-input"
            type="text"
            className="toolbar-input"
            value={room}
            onChange={(e) => onRoomChange(e.target.value)}
            placeholder="Room ID"
          />
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleCopyLink}
            title="Copy shareable link with room parameter"
          >
            {copied ? '✓ Copied' : '🔗 Share'}
          </button>
        </div>

        <div className="input-group">
          <label htmlFor="server-select">Server:</label>
          <select
            id="server-select"
            className="toolbar-select"
            value={serverUrl}
            onChange={(e) => onServerUrlChange(e.target.value)}
          >
            {PRESET_SERVERS.map((srv) => (
              <option key={srv.value} value={srv.value}>
                {srv.label}
              </option>
            ))}
          </select>
        </div>

        {/* Connection Status Badge */}
        <div
          className="status-badge"
          title={`Status: ${status}\nServer: ${serverUrl}\nNote: Cross-tab sync operates via BroadcastChannel even when disconnected from remote server.`}
        >
          <span className="status-dot" style={{ backgroundColor: getStatusColor() }} />
          <span className="status-text">
            {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Offline / Broadcast'}
          </span>
        </div>
      </div>

      {/* Center/Right: Language and Theme */}
      <div className="toolbar-section toolbar-editor-settings">
        <div className="input-group">
          <label htmlFor="lang-select">Lang:</label>
          <select
            id="lang-select"
            className="toolbar-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="theme-select">Theme:</label>
          <select
            id="theme-select"
            className="toolbar-select"
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
          >
            <option value="vs-dark">Dark</option>
            <option value="light">Light</option>
            <option value="hc-black">High Contrast</option>
          </select>
        </div>
      </div>

      {/* Collaborators & User Profile */}
      <div className="toolbar-section toolbar-collaborators">
        <div className="collaborators-avatars" title="Active collaborators in this room">
          {collaborators.map((c) => (
            <div
              key={c.clientId}
              className={`collaborator-avatar ${c.isSelf ? 'is-self' : ''}`}
              style={{ backgroundColor: c.user.color }}
              title={`${c.user.name}${c.isSelf ? ' (You)' : ''}`}
            >
              {c.user.name.charAt(0).toUpperCase()}
            </div>
          ))}
          <span className="collaborators-count">
            {collaborators.length} {collaborators.length === 1 ? 'user' : 'users'}
          </span>
        </div>

        {/* Current User Pill / Name Editor */}
        {isEditingUser ? (
          <form onSubmit={handleUserSave} className="user-edit-form">
            <input
              type="text"
              autoFocus
              className="toolbar-input user-input"
              value={userNameInput}
              onChange={(e) => setUserNameInput(e.target.value)}
              onBlur={() => setIsEditingUser(false)}
            />
            <button type="submit" className="toolbar-btn primary">
              Save
            </button>
          </form>
        ) : (
          <button
            type="button"
            className="user-profile-badge"
            onClick={() => {
              setUserNameInput(currentUser.name);
              setIsEditingUser(true);
            }}
            title="Click to rename yourself"
          >
            <span className="user-color-dot" style={{ backgroundColor: currentUser.color }} />
            <span className="user-name">{currentUser.name} (You)</span>
            <span className="edit-icon">✎</span>
          </button>
        )}

        {/* Help button */}
        <button
          type="button"
          className="toolbar-btn icon-only"
          onClick={onOpenHelp}
          title="How collaboration works & Instructions"
        >
          ℹ️
        </button>
      </div>
    </header>
  );
};
