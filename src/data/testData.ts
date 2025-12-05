import { v4 as uuidv4 } from 'uuid';
import type { Team, Player, Game, PlayerGameStats } from '../types';

export function generateTestData() {
  // 1. Create Teams
  const lakersId = uuidv4();
  const celticsId = uuidv4();
  const warriorsId = uuidv4();
  const bullsId = uuidv4();

  const lakersPlayers: Player[] = [
    { id: uuidv4(), name: 'LeBron James', jerseyNumber: '23' },
    { id: uuidv4(), name: 'Anthony Davis', jerseyNumber: '3' },
    { id: uuidv4(), name: 'D\'Angelo Russell', jerseyNumber: '1' },
    { id: uuidv4(), name: 'Austin Reaves', jerseyNumber: '15' },
    { id: uuidv4(), name: 'Rui Hachimura', jerseyNumber: '28' },
  ];

  const celticsPlayers: Player[] = [
    { id: uuidv4(), name: 'Jayson Tatum', jerseyNumber: '0' },
    { id: uuidv4(), name: 'Jaylen Brown', jerseyNumber: '7' },
    { id: uuidv4(), name: 'Kristaps Porzingis', jerseyNumber: '8' },
    { id: uuidv4(), name: 'Jrue Holiday', jerseyNumber: '4' },
    { id: uuidv4(), name: 'Derrick White', jerseyNumber: '9' },
  ];

  const warriorsPlayers: Player[] = [
    { id: uuidv4(), name: 'Stephen Curry', jerseyNumber: '30' },
    { id: uuidv4(), name: 'Klay Thompson', jerseyNumber: '11' },
    { id: uuidv4(), name: 'Draymond Green', jerseyNumber: '23' },
    { id: uuidv4(), name: 'Andrew Wiggins', jerseyNumber: '22' },
    { id: uuidv4(), name: 'Kevon Looney', jerseyNumber: '5' },
  ];

  const bullsPlayers: Player[] = [
    { id: uuidv4(), name: 'Michael Jordan', jerseyNumber: '23' },
    { id: uuidv4(), name: 'Scottie Pippen', jerseyNumber: '33' },
    { id: uuidv4(), name: 'Dennis Rodman', jerseyNumber: '91' },
    { id: uuidv4(), name: 'Ron Harper', jerseyNumber: '9' },
    { id: uuidv4(), name: 'Steve Kerr', jerseyNumber: '25' },
  ];

  const teams: Team[] = [
    {
      id: lakersId,
      name: 'Lakers',
      primaryColor: '#552583',
      secondaryColor: '#FDB927',
      players: lakersPlayers,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: celticsId,
      name: 'Celtics',
      primaryColor: '#007A33',
      secondaryColor: '#BA9653',
      players: celticsPlayers,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: warriorsId,
      name: 'Warriors',
      primaryColor: '#1D428A',
      secondaryColor: '#FFC72C',
      players: warriorsPlayers,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: bullsId,
      name: 'Bulls (96)',
      primaryColor: '#CE1141',
      secondaryColor: '#000000',
      players: bullsPlayers,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  // Helper to create player stats
  const createStats = (players: Player[], pointsBase: number): PlayerGameStats[] => {
    return players.map(p => {
      const pts = Math.floor(Math.random() * pointsBase);
      return {
        playerId: p.id,
        playerName: p.name,
        jerseyNumber: p.jerseyNumber,
        points: pts,
        rebounds: Math.floor(Math.random() * 10),
        assists: Math.floor(Math.random() * 8),
        steals: Math.floor(Math.random() * 3),
        blocks: Math.floor(Math.random() * 2),
        fouls: Math.floor(Math.random() * 4),
        turnovers: Math.floor(Math.random() * 3),
        threePointers: Math.floor(pts / 3),
      };
    });
  };

  // 2. Create History Games (Finished)
  const historyGame1: Game = {
    id: uuidv4(),
    homeTeam: {
      teamId: lakersId,
      teamName: 'Lakers',
      primaryColor: '#552583',
      secondaryColor: '#FDB927',
      players: createStats(lakersPlayers, 30),
    },
    awayTeam: {
      teamId: warriorsId,
      teamName: 'Warriors',
      primaryColor: '#1D428A',
      secondaryColor: '#FFC72C',
      players: createStats(warriorsPlayers, 35), // Warriors win
    },
    quarter: 4,
    timeRemaining: '0:00',
    status: 'finished',
    createdAt: Date.now() - 86400000 * 2, // 2 days ago
    updatedAt: Date.now() - 86400000 * 2,
  };

  const historyGame2: Game = {
    id: uuidv4(),
    homeTeam: {
      teamId: bullsId,
      teamName: 'Bulls (96)',
      primaryColor: '#CE1141',
      secondaryColor: '#000000',
      players: createStats(bullsPlayers, 40), // Bulls win big
    },
    awayTeam: {
      teamId: celticsId,
      teamName: 'Celtics',
      primaryColor: '#007A33',
      secondaryColor: '#BA9653',
      players: createStats(celticsPlayers, 20),
    },
    quarter: 4,
    timeRemaining: '0:00',
    status: 'finished',
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 86400000,
  };

  // 3. Create Live Game (Active)
  // High scoring close game
  const activeGame: Game = {
    id: uuidv4(),
    homeTeam: {
      teamId: celticsId,
      teamName: 'Celtics',
      primaryColor: '#007A33',
      secondaryColor: '#BA9653',
      players: createStats(celticsPlayers, 25),
    },
    awayTeam: {
      teamId: lakersId,
      teamName: 'Lakers',
      primaryColor: '#552583',
      secondaryColor: '#FDB927',
      players: createStats(lakersPlayers, 24),
    },
    quarter: 3,
    timeRemaining: '4:20',
    status: 'live',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return {
    teams,
    games: [historyGame1, historyGame2],
    currentGame: activeGame,
  };
}

// Keep this for backward compatibility if needed, but AppContext will switch to generateTestData
export function getTestTeams(): Team[] {
  return generateTestData().teams;
}
