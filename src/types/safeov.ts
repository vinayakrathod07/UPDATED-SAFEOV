export interface UserPreferences {
  userName: string;
  localEmail: string;
  localPassword?: string;
  isLoggedIn: boolean;
  setupComplete: boolean;
  contact1: string;
  contact2: string;
  contact3: string;
  gmailContact: string;
}

export interface EvidenceRecord {
  id: string;
  timestamp: string;
  durationSeconds: number;
  videoUrl: string;
  trigger: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface DispatchLog {
  id: string;
  timestamp: string;
  type: 'SMS' | 'EMAIL' | 'AMBULANCE';
  recipient: string;
  content: string;
  status: 'SENT' | 'SIMULATED';
}

export interface BotMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}
