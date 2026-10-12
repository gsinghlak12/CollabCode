export interface UserProfile {
  name: string;
  color: string;
}

export interface UserAwarenessState {
  user?: UserProfile;
  [key: string]: unknown;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';
