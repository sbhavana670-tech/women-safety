// Offline-first safety store using localStorage

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface ActivityLog {
  id: string;
  type: 'sos' | 'voice' | 'pin' | 'timer' | 'location' | 'evidence' | 'alarm' | 'fake_call' | 'follow' | 'battery' | 'flashlight' | 'complaint';
  timestamp: number;
  description: string;
  data?: Record<string, unknown>;
}

export interface SafePlace {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'shelter' | 'public' | 'custom';
  lat: number;
  lng: number;
  distance?: number;
  address?: string;
}

export interface Evidence {
  id: string;
  type: 'image' | 'audio';
  timestamp: number;
  data: string; // Base64 or blob URL
  description?: string;
}

export interface SafetySettings {
  emergencyContacts: EmergencyContact[];
  emergencyPin: string;
  voiceTriggerWords: string[];
  timerDuration: number; // minutes
  stealthModeEnabled: boolean;
  followDetectionEnabled: boolean;
  lowBatteryThreshold: number;
}

export interface SafetyState {
  isSOSActive: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  currentLocation: { lat: number; lng: number } | null;
  isTimerActive: boolean;
  timerEndTime: number | null;
  isStealthMode: boolean;
  isFollowDetection: boolean;
  isVoiceDetectionActive: boolean;
  batteryLevel: number;
  dailySafetyScore: number;
}

const STORAGE_KEYS = {
  SETTINGS: 'safety_settings',
  STATE: 'safety_state',
  LOGS: 'activity_logs',
  EVIDENCE: 'evidence_store',
};

const DEFAULT_SETTINGS: SafetySettings = {
  emergencyContacts: [],
  emergencyPin: '1234',
  voiceTriggerWords: ['help', 'emergency', 'save me', 'danger'],
  timerDuration: 30,
  stealthModeEnabled: false,
  followDetectionEnabled: false,
  lowBatteryThreshold: 20,
};

const DEFAULT_STATE: SafetyState = {
  isSOSActive: false,
  riskLevel: 'low',
  currentLocation: null,
  isTimerActive: false,
  timerEndTime: null,
  isStealthMode: false,
  isFollowDetection: false,
  isVoiceDetectionActive: false,
  batteryLevel: 100,
  dailySafetyScore: 85,
};

// Safe localStorage access
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      console.warn('localStorage not available');
    }
  },
};

export function getSettings(): SafetySettings {
  const stored = safeLocalStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<SafetySettings>): SafetySettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  safeLocalStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  return updated;
}

export function getState(): SafetyState {
  const stored = safeLocalStorage.getItem(STORAGE_KEYS.STATE);
  if (stored) {
    try {
      return { ...DEFAULT_STATE, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_STATE;
    }
  }
  return DEFAULT_STATE;
}

export function saveState(state: Partial<SafetyState>): SafetyState {
  const current = getState();
  const updated = { ...current, ...state };
  safeLocalStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(updated));
  return updated;
}

export function getLogs(): ActivityLog[] {
  const stored = safeLocalStorage.getItem(STORAGE_KEYS.LOGS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog {
  const logs = getLogs();
  const newLog: ActivityLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  logs.unshift(newLog);
  // Keep only last 100 logs
  const trimmed = logs.slice(0, 100);
  safeLocalStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmed));
  return newLog;
}

export function clearLogs(): void {
  safeLocalStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
}

export function getEvidence(): Evidence[] {
  const stored = safeLocalStorage.getItem(STORAGE_KEYS.EVIDENCE);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function addEvidence(evidence: Omit<Evidence, 'id' | 'timestamp'>): Evidence {
  const items = getEvidence();
  const newEvidence: Evidence = {
    ...evidence,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  items.unshift(newEvidence);
  // Keep only last 50 evidence items
  const trimmed = items.slice(0, 50);
  safeLocalStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(trimmed));
  return newEvidence;
}

export function deleteEvidence(id: string): void {
  const items = getEvidence();
  const filtered = items.filter(e => e.id !== id);
  safeLocalStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(filtered));
}

// Simulated safe places database
export const SAFE_PLACES: SafePlace[] = [
  { id: '1', name: 'Central Police Station', type: 'police', lat: 28.6139, lng: 77.2090, address: '123 Main Street' },
  { id: '2', name: 'City Hospital', type: 'hospital', lat: 28.6129, lng: 77.2095, address: '456 Health Avenue' },
  { id: '3', name: 'Women\'s Shelter', type: 'shelter', lat: 28.6149, lng: 77.2080, address: '789 Safe Lane' },
  { id: '4', name: 'Metro Station', type: 'public', lat: 28.6159, lng: 77.2070, address: 'Metro Plaza' },
  { id: '5', name: 'Community Center', type: 'public', lat: 28.6119, lng: 77.2100, address: '321 Community Road' },
  { id: '6', name: 'Fire Station', type: 'public', lat: 28.6169, lng: 77.2060, address: '654 Emergency Street' },
  { id: '7', name: '24/7 Pharmacy', type: 'public', lat: 28.6109, lng: 77.2110, address: '987 Medicine Lane' },
  { id: '8', name: 'Women\'s Police Station', type: 'police', lat: 28.6179, lng: 77.2050, address: '147 Justice Road' },
];

// Calculate distance between two points (Haversine formula)
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getNearbyPlaces(lat: number, lng: number, maxDistance = 5): SafePlace[] {
  return SAFE_PLACES
    .map(place => ({
      ...place,
      distance: calculateDistance(lat, lng, place.lat, place.lng),
    }))
    .filter(place => place.distance! <= maxDistance)
    .sort((a, b) => a.distance! - b.distance!);
}

// Legal information database
export const LEGAL_INFO = {
  emergencyNumbers: [
    { name: 'Police Emergency', number: '100', description: 'For immediate police assistance' },
    { name: 'Women Helpline', number: '181', description: 'National women helpline - 24/7 support' },
    { name: 'Emergency Services', number: '112', description: 'Universal emergency number' },
    { name: 'Domestic Violence', number: '1091', description: 'Women in distress helpline' },
    { name: 'Child Helpline', number: '1098', description: 'For child safety and protection' },
  ],
  rights: [
    {
      title: 'Right to File Zero FIR',
      description: 'You can file an FIR at any police station regardless of jurisdiction. The police must register it.',
    },
    {
      title: 'Right to Free Legal Aid',
      description: 'Women are entitled to free legal aid under the Legal Services Authorities Act.',
    },
    {
      title: 'Right to Privacy',
      description: 'Your identity as a victim cannot be disclosed without consent. Medical examination requires written consent.',
    },
    {
      title: 'Right to Lodge Complaint',
      description: 'Police cannot refuse to register your complaint. If refused, you can approach higher authorities.',
    },
    {
      title: 'Protection from Arrest at Night',
      description: 'Women cannot be arrested after sunset and before sunrise except in exceptional circumstances with magistrate order.',
    },
  ],
  laws: [
    {
      title: 'Protection of Women from Domestic Violence Act, 2005',
      description: 'Provides protection from physical, emotional, verbal, sexual, and economic abuse.',
    },
    {
      title: 'Sexual Harassment of Women at Workplace Act, 2013',
      description: 'Protects women from sexual harassment at workplace and establishes Internal Complaints Committee.',
    },
    {
      title: 'Indian Penal Code Section 354',
      description: 'Assault or criminal force to woman with intent to outrage her modesty - punishable up to 5 years.',
    },
    {
      title: 'IPC Section 509',
      description: 'Word, gesture or act intended to insult the modesty of a woman - punishable up to 3 years.',
    },
  ],
};
