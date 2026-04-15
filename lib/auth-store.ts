"use client";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  emergencyContacts: string[];
  createdAt: number;
}

export interface UsageStats {
  sosActivations: number;
  smsSent: number;
  callsMade: number;
  timerUsage: number;
  lastActive: number;
}

const USERS_KEY = "safeguard_users";
const CURRENT_USER_KEY = "safeguard_current_user";
const USAGE_STATS_KEY = "safeguard_usage_stats";

export function getUsers(): User[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveUser(user: User): void {
  const users = getUsers();
  const existingIndex = users.findIndex((u) => u.email === user.email);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email === email);
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getUsageStats(): UsageStats {
  if (typeof window === "undefined") {
    return { sosActivations: 0, smsSent: 0, callsMade: 0, timerUsage: 0, lastActive: Date.now() };
  }
  const data = localStorage.getItem(USAGE_STATS_KEY);
  return data ? JSON.parse(data) : { sosActivations: 0, smsSent: 0, callsMade: 0, timerUsage: 0, lastActive: Date.now() };
}

export function updateUsageStats(updates: Partial<UsageStats>): UsageStats {
  const stats = getUsageStats();
  const newStats = { ...stats, ...updates, lastActive: Date.now() };
  localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(newStats));
  return newStats;
}

export function incrementStat(key: keyof Omit<UsageStats, "lastActive">): void {
  const stats = getUsageStats();
  stats[key] = (stats[key] || 0) + 1;
  stats.lastActive = Date.now();
  localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(stats));
}
