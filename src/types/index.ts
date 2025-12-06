// Player definition
export interface Player {
  id: string;
  name: string;
  jerseyNumber: string;
}

// Team definition
export interface Team {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  players: Player[];
  createdAt: number;
  updatedAt: number;
}

// Player stats during a game
export interface PlayerGameStats {
  playerId: string;
  playerName: string;
  jerseyNumber: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fouls: number;
  turnovers: number;
  threePointers: number;
}

// Team stats during a game
export interface TeamGameStats {
  teamId: string;
  teamName: string;
  primaryColor: string;
  secondaryColor: string;
  record: string;
  standing: string;
  players: PlayerGameStats[];
}

// Game definition
export interface Game {
  id: string;
  homeTeam: TeamGameStats;
  awayTeam: TeamGameStats;
  quarter: number;
  timeRemaining: string;
  targetScore: number | null;
  status: 'setup' | 'live' | 'finished';
  createdAt: number;
  updatedAt: number;
}

// Stat types that can be toggled
export type StatType = 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks' | 'fouls' | 'turnovers' | 'threePointers';

// Stats configuration
export interface StatsConfig {
  points: boolean;
  rebounds: boolean;
  assists: boolean;
  steals: boolean;
  blocks: boolean;
  fouls: boolean;
  turnovers: boolean;
  threePointers: boolean;
}

// Theme presets
export type ThemePreset = 'espn' | 'tnt' | 'custom';

// Theme definition
export interface Theme {
  id: string;
  name: string;
  preset: ThemePreset;
  backgroundColor: string;
  secondaryBackground: string;
  accentColor: string;
  textColor: string;
  textSecondary: string;
  headerFont: string;
  bodyFont: string;
  numberFont: string;
  borderRadius: string;
  scoreboardStyle: 'modern' | 'classic' | 'minimal';
  layout: 'standard' | 'split';
  baseScale: number;
}

// Scoreboard display configuration
export interface ScoreboardConfig {
  showTimer: boolean;
  showQuarter: boolean;
  showTargetBar: boolean;
  showQuickPoints: boolean;
}

// App settings
export interface AppSettings {
  currentTheme: string;
  statsConfig: StatsConfig;
  scoreboardConfig: ScoreboardConfig;
  customThemes: Theme[];
}

// Default stats configuration
export const defaultStatsConfig: StatsConfig = {
  points: true,
  rebounds: true,
  assists: true,
  steals: false,
  blocks: false,
  fouls: true,
  turnovers: false,
  threePointers: false,
};

// Default scoreboard configuration
export const defaultScoreboardConfig: ScoreboardConfig = {
  showTimer: true,
  showQuarter: true,
  showTargetBar: true,
  showQuickPoints: true,
};

// Stat display names
export const statLabels: Record<StatType, string> = {
  points: 'PTS',
  rebounds: 'REB',
  assists: 'AST',
  steals: 'STL',
  blocks: 'BLK',
  fouls: 'PF',
  turnovers: 'TO',
  threePointers: '3PT',
};

// Full stat names
export const statFullNames: Record<StatType, string> = {
  points: 'Points',
  rebounds: 'Rebounds',
  assists: 'Assists',
  steals: 'Steals',
  blocks: 'Blocks',
  fouls: 'Fouls',
  turnovers: 'Turnovers',
  threePointers: '3-Pointers',
};
