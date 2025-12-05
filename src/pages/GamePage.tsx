import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { PlayerGameStats, StatType } from '../types';
import { statLabels } from '../types';

export function GamePage() {
  const navigate = useNavigate();
  const {
    currentGame,
    updateCurrentGame,
    updatePlayerStat,
    endGame,
    clearCurrentGame,
    currentTheme,
    settings,
  } = useApp();

  const [animatingCell, setAnimatingCell] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Redirect if no game
  useEffect(() => {
    if (!currentGame) {
      navigate('/');
    }
  }, [currentGame, navigate]);

  if (!currentGame) return null;

  const { homeTeam, awayTeam, quarter, timeRemaining } = currentGame;

  // Calculate team totals
  const calculateTotal = (players: PlayerGameStats[], stat: keyof PlayerGameStats) =>
    players.reduce((sum, p) => {
      const value = p[stat];
      return typeof value === 'number' ? sum + value : sum;
    }, 0);

  const homeScore = calculateTotal(homeTeam.players, 'points');
  const awayScore = calculateTotal(awayTeam.players, 'points');

  // Get enabled stats
  const enabledStats = Object.entries(settings.statsConfig)
    .filter(([, enabled]) => enabled)
    .map(([stat]) => stat as StatType);

  // Handle stat click
  const handleStatClick = (
    teamType: 'home' | 'away',
    playerId: string,
    stat: keyof PlayerGameStats,
    event: React.MouseEvent
  ) => {
    const delta = event.shiftKey ? -1 : 1;
    updatePlayerStat(teamType, playerId, stat, delta);

    // Animate
    const cellId = `${teamType}-${playerId}-${stat}`;
    setAnimatingCell(cellId);
    setTimeout(() => setAnimatingCell(null), 200);
  };

  // Handle quarter change
  const handleQuarterChange = (delta: number) => {
    const newQuarter = Math.max(1, Math.min(4, quarter + delta));
    updateCurrentGame({ quarter: newQuarter });
  };

  // Handle end game
  const handleEndGame = () => {
    endGame();
    navigate('/');
  };

  // Handle exit without saving
  const handleExit = () => {
    clearCurrentGame();
    navigate('/');
  };

  // Render player stat table
  const renderTeamStats = (
    team: typeof homeTeam,
    teamType: 'home' | 'away',
    isHome: boolean
  ) => (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: currentTheme.secondaryBackground }}
    >
      {/* Team Header */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{
          backgroundColor: team.primaryColor,
          color: team.secondaryColor,
        }}
      >
        <span
          className="text-lg font-bold tracking-wide"
          style={{ fontFamily: currentTheme.headerFont }}
        >
          {team.teamName}
        </span>
        <span className="ml-auto text-sm opacity-80">
          {isHome ? 'HOME' : 'AWAY'}
        </span>
      </div>

      {/* Stats Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: currentTheme.backgroundColor }}>
              <th
                className="px-3 py-2 text-left text-xs font-medium"
                style={{ color: currentTheme.textSecondary }}
              >
                #
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium"
                style={{ color: currentTheme.textSecondary }}
              >
                PLAYER
              </th>
              {enabledStats.map(stat => (
                <th
                  key={stat}
                  className="px-3 py-2 text-center text-xs font-medium"
                  style={{ color: currentTheme.textSecondary }}
                >
                  {statLabels[stat]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.players.map((player, index) => (
              <tr
                key={player.playerId}
                className="border-t"
                style={{
                  borderColor: currentTheme.backgroundColor,
                  backgroundColor:
                    index % 2 === 0
                      ? 'transparent'
                      : currentTheme.backgroundColor + '40',
                }}
              >
                <td className="px-3 py-2">
                  <span
                    className="inline-block w-8 h-6 rounded text-center text-xs font-bold leading-6"
                    style={{
                      backgroundColor: team.primaryColor,
                      color: team.secondaryColor,
                    }}
                  >
                    {player.jerseyNumber}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium text-sm">{player.playerName}</td>
                {enabledStats.map(stat => {
                  const cellId = `${teamType}-${player.playerId}-${stat}`;
                  const value = player[stat as keyof PlayerGameStats];
                  return (
                    <td key={stat} className="px-2 py-2 text-center">
                      <button
                        onClick={e => handleStatClick(teamType, player.playerId, stat as keyof PlayerGameStats, e)}
                        className={`w-10 h-8 rounded font-bold text-sm transition-all hover:scale-110 cursor-pointer ${
                          animatingCell === cellId ? 'stat-pop' : ''
                        }`}
                        style={{
                          backgroundColor: currentTheme.accentColor + '20',
                          color: currentTheme.accentColor,
                          borderRadius: currentTheme.borderRadius,
                        }}
                        title="Click to add, Shift+Click to subtract"
                      >
                        {typeof value === 'number' ? value : 0}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Team Totals Row */}
            <tr
              className="border-t-2 font-bold"
              style={{
                borderColor: team.primaryColor,
                backgroundColor: team.primaryColor + '20',
              }}
            >
              <td className="px-3 py-2"></td>
              <td className="px-3 py-2" style={{ fontFamily: currentTheme.headerFont }}>
                TOTAL
              </td>
              {enabledStats.map(stat => (
                <td key={stat} className="px-2 py-2 text-center">
                  <span
                    className="inline-block w-10 h-8 leading-8 rounded font-bold text-sm"
                    style={{
                      backgroundColor: team.primaryColor,
                      color: team.secondaryColor,
                      borderRadius: currentTheme.borderRadius,
                    }}
                  >
                    {calculateTotal(team.players, stat as keyof PlayerGameStats)}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: currentTheme.backgroundColor,
        color: currentTheme.textColor,
      }}
    >
      {/* Top Scoreboard */}
      <div
        className="sticky top-0 z-40"
        style={{ backgroundColor: currentTheme.secondaryBackground }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-2 md:py-4">
            {/* Home Team Score */}
            <div className="flex items-center gap-2 md:gap-4">
              <div
                className="w-12 h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: homeTeam.primaryColor }}
              >
                <span
                  className="text-2xl md:text-3xl font-black"
                  style={{
                    color: homeTeam.secondaryColor,
                    fontFamily: currentTheme.numberFont,
                  }}
                >
                  {homeScore}
                </span>
              </div>
              <div className="hidden sm:block">
                <p
                  className="text-sm md:text-lg font-bold"
                  style={{ fontFamily: currentTheme.headerFont }}
                >
                  {homeTeam.teamName}
                </p>
                <p className="text-[10px] md:text-xs" style={{ color: currentTheme.textSecondary }}>
                  HOME
                </p>
              </div>
              {/* Mobile Team Name (condensed) */}
              <div className="sm:hidden">
                <p
                  className="text-sm font-bold"
                  style={{ fontFamily: currentTheme.headerFont }}
                >
                  {homeTeam.teamName.slice(0, 3).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Center - Quarter & Time */}
            {(settings.scoreboardConfig.showQuarter || settings.scoreboardConfig.showTimer) && (
              <div className="text-center flex flex-col items-center">
                {settings.scoreboardConfig.showQuarter && (
                  <div className="flex items-center gap-1 md:gap-2 mb-1">
                    <button
                      onClick={() => handleQuarterChange(-1)}
                      className="w-6 h-6 md:w-8 md:h-8 rounded-full transition-all hover:scale-110 flex items-center justify-center"
                      style={{
                        backgroundColor: currentTheme.accentColor + '20',
                        color: currentTheme.accentColor,
                      }}
                      disabled={quarter <= 1}
                    >
                      <span className="text-xs md:text-sm">◀</span>
                    </button>
                    <span
                      className="text-lg md:text-2xl font-black px-2 md:px-4"
                      style={{ fontFamily: currentTheme.numberFont }}
                    >
                      Q{quarter}
                    </span>
                    <button
                      onClick={() => handleQuarterChange(1)}
                      className="w-6 h-6 md:w-8 md:h-8 rounded-full transition-all hover:scale-110 flex items-center justify-center"
                      style={{
                        backgroundColor: currentTheme.accentColor + '20',
                        color: currentTheme.accentColor,
                      }}
                      disabled={quarter >= 4}
                    >
                      <span className="text-xs md:text-sm">▶</span>
                    </button>
                  </div>
                )}
                {settings.scoreboardConfig.showTimer && (
                  <input
                    type="text"
                    value={timeRemaining}
                    onChange={e => updateCurrentGame({ timeRemaining: e.target.value })}
                    className="w-16 md:w-24 text-center bg-transparent border-b-2 text-sm md:text-lg font-mono focus:outline-none"
                    style={{
                      borderColor: currentTheme.accentColor,
                      color: currentTheme.textColor,
                    }}
                  />
                )}
              </div>
            )}

            {/* Away Team Score */}
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden sm:block text-right">
                <p
                  className="text-sm md:text-lg font-bold"
                  style={{ fontFamily: currentTheme.headerFont }}
                >
                  {awayTeam.teamName}
                </p>
                <p className="text-[10px] md:text-xs" style={{ color: currentTheme.textSecondary }}>
                  AWAY
                </p>
              </div>
              {/* Mobile Team Name (condensed) */}
              <div className="sm:hidden text-right">
                <p
                  className="text-sm font-bold"
                  style={{ fontFamily: currentTheme.headerFont }}
                >
                  {awayTeam.teamName.slice(0, 3).toUpperCase()}
                </p>
              </div>
              <div
                className="w-12 h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: awayTeam.primaryColor }}
              >
                <span
                  className="text-2xl md:text-3xl font-black"
                  style={{
                    color: awayTeam.secondaryColor,
                    fontFamily: currentTheme.numberFont,
                  }}
                >
                  {awayScore}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex w-full sm:w-auto justify-between sm:justify-start gap-4">
            <button
              onClick={() => setShowExitConfirm(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 flex-1 sm:flex-none"
              style={{
                backgroundColor: currentTheme.backgroundColor,
                border: `1px solid ${currentTheme.textSecondary}40`,
                color: currentTheme.textSecondary,
                borderRadius: currentTheme.borderRadius,
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => setShowEndConfirm(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex-1 sm:flex-none sm:hidden"
              style={{
                backgroundColor: currentTheme.accentColor,
                color: '#fff',
                borderRadius: currentTheme.borderRadius,
              }}
            >
              End Game
            </button>
          </div>
          
          <p className="text-xs text-center order-last sm:order-none" style={{ color: currentTheme.textSecondary }}>
            Click stat to add • Shift+Click to subtract
          </p>

          <button
            onClick={() => setShowEndConfirm(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 hidden sm:block"
            style={{
              backgroundColor: currentTheme.accentColor,
              color: '#fff',
              borderRadius: currentTheme.borderRadius,
            }}
          >
            End Game
          </button>
        </div>

        {/* Team Stats Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderTeamStats(homeTeam, 'home', true)}
          {renderTeamStats(awayTeam, 'away', false)}
        </div>
      </div>

      {/* End Game Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEndConfirm(false)} />
          <div
            className="relative w-full max-w-md p-6 rounded-xl text-center"
            style={{ backgroundColor: currentTheme.secondaryBackground }}
          >
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: currentTheme.headerFont }}>
              END GAME?
            </h2>
            <p className="mb-6" style={{ color: currentTheme.textSecondary }}>
              Final Score: {homeTeam.teamName} {homeScore} - {awayScore} {awayTeam.teamName}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 px-4 py-3 rounded-lg font-medium border"
                style={{
                  borderColor: currentTheme.textSecondary + '40',
                  color: currentTheme.textSecondary,
                  borderRadius: currentTheme.borderRadius,
                }}
              >
                Keep Playing
              </button>
              <button
                onClick={handleEndGame}
                className="flex-1 px-4 py-3 rounded-lg font-medium"
                style={{
                  backgroundColor: currentTheme.accentColor,
                  color: '#fff',
                  borderRadius: currentTheme.borderRadius,
                }}
              >
                End & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
          <div
            className="relative w-full max-w-md p-6 rounded-xl text-center"
            style={{ backgroundColor: currentTheme.secondaryBackground }}
          >
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: currentTheme.headerFont }}>
              LEAVE GAME?
            </h2>
            <p className="mb-6" style={{ color: currentTheme.textSecondary }}>
              Your game progress is auto-saved. You can resume later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-3 rounded-lg font-medium border"
                style={{
                  borderColor: currentTheme.textSecondary + '40',
                  color: currentTheme.textSecondary,
                  borderRadius: currentTheme.borderRadius,
                }}
              >
                Stay
              </button>
              <button
                onClick={handleExit}
                className="flex-1 px-4 py-3 rounded-lg font-medium bg-red-500/20 text-red-400"
                style={{ borderRadius: currentTheme.borderRadius }}
              >
                Leave (Discard)
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-4 py-3 rounded-lg font-medium"
                style={{
                  backgroundColor: currentTheme.accentColor,
                  color: '#fff',
                  borderRadius: currentTheme.borderRadius,
                }}
              >
                Leave (Keep)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

