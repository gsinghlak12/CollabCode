import { UserProfile } from '../types';

const COLORS = [
  '#2563EB', // Blue
  '#DC2626', // Red
  '#059669', // Emerald
  '#D97706', // Amber
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#0891B2', // Cyan
  '#EA580C', // Orange
  '#4F46E5', // Indigo
  '#16A34A', // Green
];

const ADJECTIVES = ['Swift', 'Bright', 'Clever', 'Cosmic', 'Bold', 'Nimble', 'Solar', 'Lunar', 'Epic', 'Cyber'];
const NOUNS = ['Coder', 'Hacker', 'Architect', 'Dev', 'Ninja', 'Pilot', 'Wizard', 'Voyager', 'Spark', 'Pioneer'];

export function getOrCreateUserProfile(): UserProfile {
  try {
    const cached = localStorage.getItem('collab_editor_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.name && parsed.color) {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }

  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const user: UserProfile = {
    name: `${adj} ${noun}`,
    color,
  };

  try {
    localStorage.setItem('collab_editor_user', JSON.stringify(user));
  } catch {
    // ignore storage errors
  }

  return user;
}

export function saveUserProfile(user: UserProfile) {
  try {
    localStorage.setItem('collab_editor_user', JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function updateCursorStyles(states: Map<number, { user?: UserProfile }>) {
  let styleEl = document.getElementById('yjs-cursors-style') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'yjs-cursors-style';
    document.head.appendChild(styleEl);
  }

  let css = '';
  states.forEach((state, clientId) => {
    if (state.user) {
      const { name, color } = state.user;
      const safeName = (name || `User ${clientId}`).replace(/["\\]/g, '');
      css += `
        .yRemoteSelection-${clientId} {
          background-color: ${color}33 !important;
        }
        .yRemoteSelectionHead-${clientId} {
          border-left: 2px solid ${color} !important;
          border-top: 2px solid ${color} !important;
          border-bottom: 2px solid ${color} !important;
          height: 100% !important;
          box-sizing: border-box !important;
        }
        .yRemoteSelectionHead-${clientId}::after {
          content: ' ' !important;
          position: absolute !important;
          border: 3px solid ${color} !important;
          background-color: ${color} !important;
          left: -4px !important;
          top: -5px !important;
          border-radius: 50% !important;
        }
        .yRemoteSelectionHead-${clientId}::before {
          content: "${safeName}" !important;
          position: absolute !important;
          top: -1.4em !important;
          left: -2px !important;
          font-size: 11px !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          font-weight: 600 !important;
          line-height: 1 !important;
          padding: 2px 5px !important;
          background-color: ${color} !important;
          color: #ffffff !important;
          border-radius: 3px !important;
          white-space: nowrap !important;
          pointer-events: none !important;
          z-index: 100 !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
        }
      `;
    }
  });

  styleEl.innerHTML = css;
}
