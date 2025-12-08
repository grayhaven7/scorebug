import type { Team, Game, AppSettings } from '../types';
import { defaultStatsConfig, defaultScoreboardConfig } from '../types';

const STORAGE_KEYS = {
  TEAMS: 'scorebug_teams',
  GAMES: 'scorebug_games',
  SETTINGS: 'scorebug_settings',
  CURRENT_GAME: 'scorebug_current_game',
};

// Safe JSON parse helper
function safeJsonParse<T>(data: string | null, fallback: T): T {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch {
    console.warn('Failed to parse localStorage data, using fallback');
    return fallback;
  }
}

// Teams
export function saveTeams(teams: Team[]): void {
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
}

export function loadTeams(): Team[] {
  return safeJsonParse(localStorage.getItem(STORAGE_KEYS.TEAMS), []);
}

// Games
export function saveGames(games: Game[]): void {
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
}

export function loadGames(): Game[] {
  return safeJsonParse(localStorage.getItem(STORAGE_KEYS.GAMES), []);
}

// Current Game (for live tracking)
export function saveCurrentGame(game: Game | null): void {
  if (game) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_GAME, JSON.stringify(game));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_GAME);
  }
}

export function loadCurrentGame(): Game | null {
  return safeJsonParse(localStorage.getItem(STORAGE_KEYS.CURRENT_GAME), null);
}

// Settings
export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

const defaultSettings: AppSettings = {
  currentTheme: 'default',
  statsConfig: defaultStatsConfig,
  scoreboardConfig: defaultScoreboardConfig,
  customThemes: [],
  defaultTargetScore: 21,
};

export function loadSettings(): AppSettings {
  return safeJsonParse(localStorage.getItem(STORAGE_KEYS.SETTINGS), defaultSettings);
}

// Clear all localStorage data
export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
