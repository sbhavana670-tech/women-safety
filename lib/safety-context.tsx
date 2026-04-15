"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import {
  type SafetySettings,
  type SafetyState,
  type ActivityLog,
  type Evidence,
  getSettings,
  saveSettings,
  getState,
  saveState,
  getLogs,
  addLog,
  getEvidence,
  addEvidence,
  deleteEvidence,
  clearLogs,
} from './safety-store';

interface SafetyContextState {
  settings: SafetySettings;
  state: SafetyState;
  logs: ActivityLog[];
  evidence: Evidence[];
}

type SafetyAction =
  | { type: 'SET_SETTINGS'; payload: Partial<SafetySettings> }
  | { type: 'SET_STATE'; payload: Partial<SafetyState> }
  | { type: 'ADD_LOG'; payload: Omit<ActivityLog, 'id' | 'timestamp'> }
  | { type: 'CLEAR_LOGS' }
  | { type: 'ADD_EVIDENCE'; payload: Omit<Evidence, 'id' | 'timestamp'> }
  | { type: 'DELETE_EVIDENCE'; payload: string }
  | { type: 'LOAD_FROM_STORAGE' }
  | { type: 'TRIGGER_SOS' }
  | { type: 'CANCEL_SOS' }
  | { type: 'START_TIMER'; payload: number }
  | { type: 'CANCEL_TIMER' }
  | { type: 'TOGGLE_STEALTH' }
  | { type: 'TOGGLE_FOLLOW_DETECTION' }
  | { type: 'TOGGLE_VOICE_DETECTION' }
  | { type: 'SET_RISK_LEVEL'; payload: SafetyState['riskLevel'] }
  | { type: 'UPDATE_LOCATION'; payload: { lat: number; lng: number } }
  | { type: 'SET_BATTERY'; payload: number };

const initialState: SafetyContextState = {
  settings: {
    emergencyContacts: [],
    emergencyPin: '1234',
    voiceTriggerWords: ['help', 'emergency', 'save me', 'danger'],
    timerDuration: 30,
    stealthModeEnabled: false,
    followDetectionEnabled: false,
    lowBatteryThreshold: 20,
  },
  state: {
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
  },
  logs: [],
  evidence: [],
};

function safetyReducer(state: SafetyContextState, action: SafetyAction): SafetyContextState {
  switch (action.type) {
    case 'LOAD_FROM_STORAGE':
      return {
        settings: getSettings(),
        state: getState(),
        logs: getLogs(),
        evidence: getEvidence(),
      };

    case 'SET_SETTINGS': {
      const newSettings = saveSettings(action.payload);
      return { ...state, settings: newSettings };
    }

    case 'SET_STATE': {
      const newState = saveState(action.payload);
      return { ...state, state: newState };
    }

    case 'ADD_LOG': {
      const newLog = addLog(action.payload);
      return { ...state, logs: [newLog, ...state.logs].slice(0, 100) };
    }

    case 'CLEAR_LOGS':
      clearLogs();
      return { ...state, logs: [] };

    case 'ADD_EVIDENCE': {
      const newEvidence = addEvidence(action.payload);
      return { ...state, evidence: [newEvidence, ...state.evidence].slice(0, 50) };
    }

    case 'DELETE_EVIDENCE':
      deleteEvidence(action.payload);
      return { ...state, evidence: state.evidence.filter(e => e.id !== action.payload) };

    case 'TRIGGER_SOS': {
      const newState = saveState({ isSOSActive: true, riskLevel: 'critical' });
      addLog({ type: 'sos', description: 'SOS Emergency Activated' });
      return {
        ...state,
        state: newState,
        logs: [{ id: crypto.randomUUID(), type: 'sos', description: 'SOS Emergency Activated', timestamp: Date.now() }, ...state.logs],
      };
    }

    case 'CANCEL_SOS': {
      const newState = saveState({ isSOSActive: false, riskLevel: 'low' });
      addLog({ type: 'sos', description: 'SOS Emergency Cancelled' });
      return {
        ...state,
        state: newState,
        logs: [{ id: crypto.randomUUID(), type: 'sos', description: 'SOS Emergency Cancelled', timestamp: Date.now() }, ...state.logs],
      };
    }

    case 'START_TIMER': {
      const endTime = Date.now() + action.payload * 60 * 1000;
      const newState = saveState({ isTimerActive: true, timerEndTime: endTime });
      addLog({ type: 'timer', description: `Safety timer started for ${action.payload} minutes` });
      return {
        ...state,
        state: newState,
        logs: [{ id: crypto.randomUUID(), type: 'timer', description: `Safety timer started for ${action.payload} minutes`, timestamp: Date.now() }, ...state.logs],
      };
    }

    case 'CANCEL_TIMER': {
      const newState = saveState({ isTimerActive: false, timerEndTime: null });
      addLog({ type: 'timer', description: 'Safety timer cancelled' });
      return {
        ...state,
        state: newState,
        logs: [{ id: crypto.randomUUID(), type: 'timer', description: 'Safety timer cancelled', timestamp: Date.now() }, ...state.logs],
      };
    }

    case 'TOGGLE_STEALTH': {
      const newValue = !state.state.isStealthMode;
      const newState = saveState({ isStealthMode: newValue });
      addLog({ type: 'sos', description: `Stealth mode ${newValue ? 'enabled' : 'disabled'}` });
      return {
        ...state,
        state: newState,
        logs: [{ id: crypto.randomUUID(), type: 'sos', description: `Stealth mode ${newValue ? 'enabled' : 'disabled'}`, timestamp: Date.now() }, ...state.logs],
      };
    }

    case 'TOGGLE_FOLLOW_DETECTION': {
      const newValue = !state.state.isFollowDetection;
      const newState = saveState({ isFollowDetection: newValue });
      addLog({ type: 'follow', description: `Follow detection ${newValue ? 'enabled' : 'disabled'}` });
      return {
        ...state,
        state: newState,
        logs: [{ id: crypto.randomUUID(), type: 'follow', description: `Follow detection ${newValue ? 'enabled' : 'disabled'}`, timestamp: Date.now() }, ...state.logs],
      };
    }

    case 'TOGGLE_VOICE_DETECTION': {
      const newValue = !state.state.isVoiceDetectionActive;
      const newState = saveState({ isVoiceDetectionActive: newValue });
      addLog({ type: 'voice', description: `Voice detection ${newValue ? 'enabled' : 'disabled'}` });
      return {
        ...state,
        state: newState,
        logs: [{ id: crypto.randomUUID(), type: 'voice', description: `Voice detection ${newValue ? 'enabled' : 'disabled'}`, timestamp: Date.now() }, ...state.logs],
      };
    }

    case 'SET_RISK_LEVEL': {
      const newState = saveState({ riskLevel: action.payload });
      return { ...state, state: newState };
    }

    case 'UPDATE_LOCATION': {
      const newState = saveState({ currentLocation: action.payload });
      return { ...state, state: newState };
    }

    case 'SET_BATTERY': {
      const newState = saveState({ batteryLevel: action.payload });
      return { ...state, state: newState };
    }

    default:
      return state;
  }
}

interface SafetyContextValue extends SafetyContextState {
  dispatch: React.Dispatch<SafetyAction>;
  triggerSOS: () => void;
  cancelSOS: () => void;
  startTimer: (minutes: number) => void;
  cancelTimer: () => void;
  toggleStealth: () => void;
  toggleFollowDetection: () => void;
  toggleVoiceDetection: () => void;
  setRiskLevel: (level: SafetyState['riskLevel']) => void;
  updateLocation: (lat: number, lng: number) => void;
  updateSettings: (settings: Partial<SafetySettings>) => void;
  logActivity: (type: ActivityLog['type'], description: string, data?: Record<string, unknown>) => void;
  captureEvidence: (type: Evidence['type'], data: string, description?: string) => void;
  removeEvidence: (id: string) => void;
  clearActivityLogs: () => void;
  sendEmergencySMS: (phoneNumber: string, customMessage?: string) => Promise<{ success: boolean; error?: string }>;
}

const SafetyContext = createContext<SafetyContextValue | null>(null);

export function SafetyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(safetyReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'LOAD_FROM_STORAGE' });
  }, []);

  const triggerSOS = useCallback(() => {
    dispatch({ type: 'TRIGGER_SOS' });
  }, []);

  const cancelSOS = useCallback(() => {
    dispatch({ type: 'CANCEL_SOS' });
  }, []);

  const startTimer = useCallback((minutes: number) => {
    dispatch({ type: 'START_TIMER', payload: minutes });
  }, []);

  const cancelTimer = useCallback(() => {
    dispatch({ type: 'CANCEL_TIMER' });
  }, []);

  const toggleStealth = useCallback(() => {
    dispatch({ type: 'TOGGLE_STEALTH' });
  }, []);

  const toggleFollowDetection = useCallback(() => {
    dispatch({ type: 'TOGGLE_FOLLOW_DETECTION' });
  }, []);

  const toggleVoiceDetection = useCallback(() => {
    dispatch({ type: 'TOGGLE_VOICE_DETECTION' });
  }, []);

  const setRiskLevel = useCallback((level: SafetyState['riskLevel']) => {
    dispatch({ type: 'SET_RISK_LEVEL', payload: level });
  }, []);

  const updateLocation = useCallback((lat: number, lng: number) => {
    dispatch({ type: 'UPDATE_LOCATION', payload: { lat, lng } });
  }, []);

  const updateSettings = useCallback((settings: Partial<SafetySettings>) => {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
  }, []);

  const logActivity = useCallback((type: ActivityLog['type'], description: string, data?: Record<string, unknown>) => {
    dispatch({ type: 'ADD_LOG', payload: { type, description, data } });
  }, []);

  const captureEvidence = useCallback((type: Evidence['type'], data: string, description?: string) => {
    dispatch({ type: 'ADD_EVIDENCE', payload: { type, data, description } });
  }, []);

  const removeEvidence = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EVIDENCE', payload: id });
  }, []);

  const clearActivityLogs = useCallback(() => {
    dispatch({ type: 'CLEAR_LOGS' });
  }, []);

  const sendEmergencySMS = useCallback(async (phoneNumber: string, customMessage?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const location = state.state.currentLocation;
      const locationText = location 
        ? `Location: https://www.google.com/maps?q=${location.lat},${location.lng}` 
        : "Location: Unable to determine";
      
      const message = customMessage || 
        `EMERGENCY ALERT! I need help immediately!\n\n${locationText}\n\nSent via SafeGuard App`;

      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber, message }),
      });

      const result = await response.json();

      if (!response.ok) {
        logActivity('sos', `SMS failed to ${phoneNumber}: ${result.error}`);
        return { success: false, error: result.error };
      }

      logActivity('sos', `Emergency SMS sent to ${phoneNumber}`, { messageId: result.messageId });
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logActivity('sos', `SMS error: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }, [state.state.currentLocation, logActivity]);

  const value: SafetyContextValue = {
    ...state,
    dispatch,
    triggerSOS,
    cancelSOS,
    startTimer,
    cancelTimer,
    toggleStealth,
    toggleFollowDetection,
    toggleVoiceDetection,
    setRiskLevel,
    updateLocation,
    updateSettings,
    logActivity,
    captureEvidence,
    removeEvidence,
    clearActivityLogs,
    sendEmergencySMS,
  };

  return (
    <SafetyContext.Provider value={value}>
      {children}
    </SafetyContext.Provider>
  );
}

export function useSafety() {
  const context = useContext(SafetyContext);
  if (!context) {
    throw new Error('useSafety must be used within a SafetyProvider');
  }
  return context;
}