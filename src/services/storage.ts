import { UserPreferences, EvidenceRecord, DispatchLog } from '../types/safeov';

const PREFS_KEY = 'SafeOV_Prefs';
const EVIDENCE_KEY = 'SafeOV_Evidence';
const LOGS_KEY = 'SafeOV_DispatchLogs';

export const getPreferences = (): UserPreferences => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        userName: data.user_name || 'Vinay',
        localEmail: data.local_email || 'guardian@safeov.org',
        localPassword: data.local_password || 'shield123',
        isLoggedIn: data.is_logged_in !== undefined ? data.is_logged_in : false,
        setupComplete: data.setup_complete !== undefined ? data.setup_complete : false,
        contact1: data.contact_1 || '+91 98765 43210',
        contact2: data.contact_2 || '+91 91234 56789',
        contact3: data.contact_3 || '',
        gmailContact: data.gmail_contact || 'emergency.ops@safeov.org',
      };
    }
  } catch (e) {
    console.error('Error reading SafeOV_Prefs', e);
  }

  // Initial default state
  return {
    userName: 'Vinay Rathod',
    localEmail: 'rathodvinayak007@gmail.com',
    localPassword: 'password123',
    isLoggedIn: false,
    setupComplete: false,
    contact1: '+91 98765 43210',
    contact2: '+91 91234 56789',
    contact3: '',
    gmailContact: 'rathodvinayak007@gmail.com',
  };
};

export const savePreferences = (prefs: Partial<UserPreferences>): UserPreferences => {
  const current = getPreferences();
  const updated = { ...current, ...prefs };
  
  try {
    const androidFormat = {
      user_name: updated.userName,
      local_email: updated.localEmail,
      local_password: updated.localPassword,
      is_logged_in: updated.isLoggedIn,
      setup_complete: updated.setupComplete,
      contact_1: updated.contact1,
      contact_2: updated.contact2,
      contact_3: updated.contact3,
      gmail_contact: updated.gmailContact,
    };
    localStorage.setItem(PREFS_KEY, JSON.stringify(androidFormat));
  } catch (e) {
    console.error('Error saving SafeOV_Prefs', e);
  }

  return updated;
};

export const getEvidenceRecords = (): EvidenceRecord[] => {
  try {
    const raw = localStorage.getItem(EVIDENCE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveEvidenceRecord = (record: EvidenceRecord) => {
  try {
    const records = getEvidenceRecords();
    records.unshift(record);
    // Keep last 20
    const trimmed = records.slice(0, 20);
    localStorage.setItem(EVIDENCE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save evidence', e);
  }
};

export const getDispatchLogs = (): DispatchLog[] => {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addDispatchLog = (log: Omit<DispatchLog, 'id' | 'timestamp'>) => {
  try {
    const logs = getDispatchLogs();
    const newLog: DispatchLog = {
      ...log,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString(),
    };
    logs.unshift(newLog);
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 50)));
    return newLog;
  } catch (e) {
    console.error('Failed to log dispatch', e);
    return null;
  }
};
