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
  displayName?: string; // Optional shortened display name for scoreboard
  primaryColor: string;
  secondaryColor: string;
  record: string;
  standing: string;
  players: PlayerGameStats[];
}

// Game definition
export interface Game {
  id: string;
  title?: string;
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
export type ScoreboardTextField =
  | 'title'
  | 'teamName'
  | 'record'
  | 'standing'
  | 'timer'
  | 'quarter'
  | 'score'
  | 'foul'
  | 'playerName'
  | 'jerseyNumber'
  | 'statHeader'
  | 'statValue';

export type ScoreboardTextSizes = Record<ScoreboardTextField, number>;

export interface ScoreboardConfig {
  showTimer: boolean;
  showQuarter: boolean;
  showTargetBar: boolean;
  showQuickPoints: boolean;
  showRecord: boolean;
  showStanding: boolean;
  showTitle: boolean;
  textScale: number; // Global text scale multiplier (0.5 to 2.0, default 1.0)
  textSizes: ScoreboardTextSizes; // Per-field text size multipliers (default 1.0)
}

// Keyboard shortcut bindings
export interface KeyboardBindings {
  selectPlayer1: string;
  selectPlayer2: string;
  selectPlayer3: string;
  selectPlayer4: string;
  selectPlayer5: string;
  addPoints1: string;
  addPoints2: string;
  addPoints3: string;
  addFoul: string;
  undo: string;
  toggleTeam: string;
}

// Default keyboard bindings
export const defaultKeyboardBindings: KeyboardBindings = {
  selectPlayer1: '1',
  selectPlayer2: '2',
  selectPlayer3: '3',
  selectPlayer4: '4',
  selectPlayer5: '5',
  addPoints1: 'q',
  addPoints2: 'w',
  addPoints3: 'e',
  addFoul: 'f',
  undo: 'z',
  toggleTeam: ' ', // Spacebar
};

// Action for undo history
export interface GameAction {
  id: string;
  teamType: 'home' | 'away';
  playerId: string;
  stat: keyof PlayerGameStats;
  delta: number;
  timestamp: number;
}

// App settings
export interface AppSettings {
  currentTheme: string;
  statsConfig: StatsConfig;
  scoreboardConfig: ScoreboardConfig;
  customThemes: Theme[];
  defaultTargetScore: number | null;
  keyboardBindings: KeyboardBindings;
  keyboardShortcutsEnabled: boolean;
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
  showQuickPoints: false,
  showRecord: true,
  showStanding: true,
  showTitle: true,
  textScale: 1.0,
  textSizes: {
    title: 1,
    teamName: 1,
    record: 1,
    standing: 1,
    timer: 1,
    quarter: 1,
    score: 1,
    foul: 1,
    playerName: 1,
    jerseyNumber: 1,
    statHeader: 1,
    statValue: 1,
  },
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
