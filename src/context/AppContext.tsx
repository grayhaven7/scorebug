import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Team, Game, AppSettings, Theme, StatsConfig, PlayerGameStats, ScoreboardConfig } from '../types';
import { defaultStatsConfig, defaultScoreboardConfig } from '../types';
import { saveTeams, loadTeams, saveGames, loadGames, saveSettings, loadSettings, saveCurrentGame, loadCurrentGame } from '../utils/storage';
import { getThemeById, presetThemes } from '../themes/presets';
import { generateTestData } from '../data/testData';

interface AppContextType {
  // Teams
  teams: Team[];
  addTeam: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => Team;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  getTeamById: (id: string) => Team | undefined;
  
  // Games
  games: Game[];
  currentGame: Game | null;
  startGame: (homeTeamId: string, awayTeamId: string) => Game;
  updateCurrentGame: (updates: Partial<Game>) => void;
  updatePlayerStat: (teamType: 'home' | 'away', playerId: string, stat: keyof PlayerGameStats, delta: number) => void;
  endGame: () => void;
  clearCurrentGame: () => void;
  
  // Settings
  settings: AppSettings;
  updateStatsConfig: (config: Partial<StatsConfig>) => void;
  updateScoreboardConfig: (config: Partial<ScoreboardConfig>) => void;
  setCurrentTheme: (themeId: string) => void;
  addCustomTheme: (theme: Omit<Theme, 'id'>) => Theme;
  updateCustomTheme: (id: string, updates: Partial<Theme>) => void;
  deleteCustomTheme: (id: string) => void;
  resetAllData: () => void;
  
  // Theme helpers
  currentTheme: Theme;
  allThemes: Theme[];
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    currentTheme: 'default',
    statsConfig: defaultStatsConfig,
    scoreboardConfig: defaultScoreboardConfig,
    customThemes: [],
  });

  // Load data on mount
  useEffect(() => {
    const loadedTeams = loadTeams();
    if (loadedTeams.length === 0) {
      const { teams: testTeams, games: testGames, currentGame: testCurrentGame } = generateTestData();
      setTeams(testTeams);
      setGames(testGames);
      setCurrentGame(testCurrentGame);
      
      saveTeams(testTeams);
      saveGames(testGames);
      saveCurrentGame(testCurrentGame);
    } else {
      setTeams(loadedTeams);
      setGames(loadGames());
      setCurrentGame(loadCurrentGame());
    }
    
    // Load settings and merge with defaults to handle new config fields
    const loadedSettings = loadSettings();
    
    // Ensure custom themes have numberFont (migration for existing data)
    const patchedCustomThemes = (loadedSettings.customThemes || []).map(theme => ({
      ...theme,
      numberFont: theme.numberFont || theme.headerFont || 'Teko',
      layout: theme.layout || 'standard',
      baseScale: theme.baseScale || 1,
    }));

    setSettings({
      ...loadedSettings,
      scoreboardConfig: {
        ...defaultScoreboardConfig,
        ...(loadedSettings.scoreboardConfig || {}),
        showTargetBar: loadedSettings.scoreboardConfig?.showTargetBar ?? defaultScoreboardConfig.showTargetBar,
      },
      customThemes: patchedCustomThemes,
    });
  }, []);

  // Reset all data
  const resetAllData = () => {
    const { teams: testTeams, games: testGames, currentGame: testCurrentGame } = generateTestData();
    
    // Reset state
    setTeams(testTeams);
    setGames(testGames);
    setCurrentGame(testCurrentGame);
    setSettings({
      currentTheme: 'default',
      statsConfig: defaultStatsConfig,
      scoreboardConfig: defaultScoreboardConfig,
      customThemes: [],
    });

    // Reset storage
    saveTeams(testTeams);
    saveGames(testGames);
    saveCurrentGame(testCurrentGame);
    saveSettings({
      currentTheme: 'default',
      statsConfig: defaultStatsConfig,
      scoreboardConfig: defaultScoreboardConfig,
      customThemes: [],
    });
  };

  // Team operations
  const addTeam = (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Team => {
    const newTeam: Team = {
      ...teamData,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedTeams = [...teams, newTeam];
    setTeams(updatedTeams);
    saveTeams(updatedTeams);
    return newTeam;
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    const updatedTeams = teams.map(team =>
      team.id === id ? { ...team, ...updates, updatedAt: Date.now() } : team
    );
    setTeams(updatedTeams);
    saveTeams(updatedTeams);
  };

  const deleteTeam = (id: string) => {
    const updatedTeams = teams.filter(team => team.id !== id);
    setTeams(updatedTeams);
    saveTeams(updatedTeams);
  };

  const getTeamById = (id: string) => teams.find(team => team.id === id);

  // Game operations
  const startGame = (homeTeamId: string, awayTeamId: string): Game => {
    const homeTeam = getTeamById(homeTeamId);
    const awayTeam = getTeamById(awayTeamId);
    
    if (!homeTeam || !awayTeam) {
      throw new Error('Invalid team selection');
    }

    const createPlayerStats = (players: typeof homeTeam.players): PlayerGameStats[] =>
      players.map(player => ({
        playerId: player.id,
        playerName: player.name,
        jerseyNumber: player.jerseyNumber,
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        fouls: 0,
        turnovers: 0,
        threePointers: 0,
      }));

    const newGame: Game = {
      id: uuidv4(),
      homeTeam: {
        teamId: homeTeam.id,
        teamName: homeTeam.name,
        primaryColor: homeTeam.primaryColor,
        secondaryColor: homeTeam.secondaryColor,
        record: '',
        standing: '',
        players: createPlayerStats(homeTeam.players),
      },
      awayTeam: {
        teamId: awayTeam.id,
        teamName: awayTeam.name,
        primaryColor: awayTeam.primaryColor,
        secondaryColor: awayTeam.secondaryColor,
        record: '',
        standing: '',
        players: createPlayerStats(awayTeam.players),
      },
      quarter: 1,
      timeRemaining: '12:00',
      targetScore: 21,
      status: 'live',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setCurrentGame(newGame);
    saveCurrentGame(newGame);
    return newGame;
  };

  const updateCurrentGame = (updates: Partial<Game>) => {
    if (!currentGame) return;
    const updated = { ...currentGame, ...updates, updatedAt: Date.now() };
    setCurrentGame(updated);
    saveCurrentGame(updated);
  };

  const updatePlayerStat = (
    teamType: 'home' | 'away',
    playerId: string,
    stat: keyof PlayerGameStats,
    delta: number
  ) => {
    if (!currentGame) return;
    
    const teamKey = teamType === 'home' ? 'homeTeam' : 'awayTeam';
    const updatedPlayers = currentGame[teamKey].players.map(player => {
      if (player.playerId === playerId) {
        const currentValue = player[stat];
        if (typeof currentValue === 'number') {
          return { ...player, [stat]: Math.max(0, currentValue + delta) };
        }
      }
      return player;
    });

    const updated = {
      ...currentGame,
      [teamKey]: { ...currentGame[teamKey], players: updatedPlayers },
      updatedAt: Date.now(),
    };
    setCurrentGame(updated);
    saveCurrentGame(updated);
  };

  const endGame = () => {
    if (!currentGame) return;
    const finishedGame = { ...currentGame, status: 'finished' as const, updatedAt: Date.now() };
    const updatedGames = [...games, finishedGame];
    setGames(updatedGames);
    saveGames(updatedGames);
    setCurrentGame(null);
    saveCurrentGame(null);
  };

  const clearCurrentGame = () => {
    setCurrentGame(null);
    saveCurrentGame(null);
  };

  // Settings operations
  const updateStatsConfig = (config: Partial<StatsConfig>) => {
    const updated = { ...settings, statsConfig: { ...settings.statsConfig, ...config } };
    setSettings(updated);
    saveSettings(updated);
  };

  const updateScoreboardConfig = (config: Partial<ScoreboardConfig>) => {
    const updated = { ...settings, scoreboardConfig: { ...settings.scoreboardConfig, ...config } };
    setSettings(updated);
    saveSettings(updated);
  };

  const setCurrentTheme = (themeId: string) => {
    const updated = { ...settings, currentTheme: themeId };
    setSettings(updated);
    saveSettings(updated);
  };

  const addCustomTheme = (themeData: Omit<Theme, 'id'>): Theme => {
    const newTheme: Theme = { ...themeData, id: uuidv4() };
    const updated = { ...settings, customThemes: [...settings.customThemes, newTheme] };
    setSettings(updated);
    saveSettings(updated);
    return newTheme;
  };

  const updateCustomTheme = (id: string, updates: Partial<Theme>) => {
    const updated = {
      ...settings,
      customThemes: settings.customThemes.map(theme =>
        theme.id === id ? { ...theme, ...updates } : theme
      ),
    };
    setSettings(updated);
    saveSettings(updated);
  };

  const deleteCustomTheme = (id: string) => {
    const updated = {
      ...settings,
      customThemes: settings.customThemes.filter(theme => theme.id !== id),
      currentTheme: settings.currentTheme === id ? 'default' : settings.currentTheme,
    };
    setSettings(updated);
    saveSettings(updated);
  };

  const currentTheme = getThemeById(settings.currentTheme, settings.customThemes);
  const allThemes = [...presetThemes, ...settings.customThemes];

  return (
    <AppContext.Provider
      value={{
        teams,
        addTeam,
        updateTeam,
        deleteTeam,
        getTeamById,
        games,
        currentGame,
        startGame,
        updateCurrentGame,
        updatePlayerStat,
        endGame,
        clearCurrentGame,
        settings,
        updateStatsConfig,
        updateScoreboardConfig,
        setCurrentTheme,
        addCustomTheme,
        updateCustomTheme,
        deleteCustomTheme,
        resetAllData,
        currentTheme,
        allThemes,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
