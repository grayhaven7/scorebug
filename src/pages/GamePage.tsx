import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TargetScoreBar } from '../components/TargetScoreBar';
import type { PlayerGameStats, StatType } from '../types';
import { statLabels } from '../types';

export function GamePage() {
  const navigate = useNavigate();
  const gameContainerRef = useRef<HTMLDivElement>(null);
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
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const showTargetBar = !!(currentGame.targetScore && settings.scoreboardConfig.showTargetBar);

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

  // Toggle Fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (gameContainerRef.current?.requestFullscreen) {
        await gameContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Update Team Details
  const updateTeamDetails = (teamType: 'home' | 'away', field: 'record' | 'standing', value: string) => {
    const teamKey = teamType === 'home' ? 'homeTeam' : 'awayTeam';
    updateCurrentGame({
      [teamKey]: { ...currentGame[teamKey], [field]: value }
    });
  };

  // Render player stat table
  const renderTeamStats = (
    team: typeof homeTeam,
    teamType: 'home' | 'away',
    isHome: boolean
  ) => (
    <div
      className="rounded-xl overflow-hidden h-full flex flex-col"
      style={{ backgroundColor: currentTheme.secondaryBackground }}
    >
      {/* Team Header */}
      <div
        className="px-4 py-3"
        style={{
          backgroundColor: team.primaryColor,
          color: team.secondaryColor,
        }}
      >
        <div className="flex items-center gap-3 mb-2">
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
        
        {/* Record and Standing Inputs */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Record (e.g. 11-3)"
            value={team.record || ''}
            onChange={(e) => updateTeamDetails(teamType, 'record', e.target.value)}
            className="w-24 px-2 py-1 text-xs rounded bg-white/20 border-transparent focus:bg-white/30 focus:outline-none placeholder-white/50"
            style={{ color: team.secondaryColor }}
          />
          <input
            type="text"
            placeholder="Standing (e.g. 1st)"
            value={team.standing || ''}
            onChange={(e) => updateTeamDetails(teamType, 'standing', e.target.value)}
            className="flex-1 px-2 py-1 text-xs rounded bg-white/20 border-transparent focus:bg-white/30 focus:outline-none placeholder-white/50"
            style={{ color: team.secondaryColor }}
          />
        </div>
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
                  colSpan={stat === 'points' ? 2 : 1}
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
                    <>
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
                      {stat === 'points' && (
                        <td className="px-1 py-2 text-center w-24">
                          <div className="flex gap-1 justify-center">
                            {[1, 2, 3].map(pts => (
                              <button
                                key={pts}
                                onClick={() => updatePlayerStat(teamType, player.playerId, 'points', pts)}
                                className="w-6 h-8 rounded text-xs font-bold transition-all hover:scale-110 hover:brightness-110"
                                style={{
                                  backgroundColor: team.primaryColor,
                                  color: team.secondaryColor,
                                  borderRadius: currentTheme.borderRadius,
                                  opacity: 0.9,
                                }}
                              >
                                +{pts}
                              </button>
                            ))}
                          </div>
                        </td>
                      )}
                    </>
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
                <td key={stat} colSpan={stat === 'points' ? 2 : 1} className="px-2 py-2 text-center">
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

  const renderScoreboard = () => (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between py-2 md:py-4">
        {/* Home Team Score */}
        <div className="flex items-center gap-2 md:gap-4">
          <div
            className="w-12 h-12 md:w-16 md:h-16 rounded-lg flex flex-col items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: homeTeam.primaryColor }}
          >
            {currentGame.targetScore && (
              <div 
                className="absolute bottom-0 left-0 right-0 bg-white/30 transition-all duration-500"
                style={{ height: `${Math.min(100, (homeScore / currentGame.targetScore) * 100)}%` }}
              />
            )}
            <span
              className="text-2xl md:text-3xl font-black relative z-10"
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
          <div className="text-center flex flex-col items-center mx-4">
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
            {currentGame.targetScore && (
              <div className="text-xs font-bold mt-1" style={{ color: currentTheme.accentColor }}>
                TARGET: {currentGame.targetScore}
              </div>
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
            className="w-12 h-12 md:w-16 md:h-16 rounded-lg flex flex-col items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: awayTeam.primaryColor }}
          >
            {currentGame.targetScore && (
              <div 
                className="absolute bottom-0 left-0 right-0 bg-white/30 transition-all duration-500"
                style={{ height: `${Math.min(100, (awayScore / currentGame.targetScore) * 100)}%` }}
              />
            )}
            <span
              className="text-2xl md:text-3xl font-black relative z-10"
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
  );

  const renderActionBar = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 p-4">
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
          onClick={() => setShowTargetModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 flex-1 sm:flex-none"
          style={{
            backgroundColor: currentTheme.backgroundColor,
            border: `1px solid ${currentTheme.textSecondary}40`,
            color: currentTheme.textSecondary,
            borderRadius: currentTheme.borderRadius,
          }}
        >
          🎯 Target
        </button>
        <button
          onClick={toggleFullscreen}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 flex-1 sm:flex-none"
          style={{
            backgroundColor: currentTheme.backgroundColor,
            border: `1px solid ${currentTheme.textSecondary}40`,
            color: currentTheme.textSecondary,
            borderRadius: currentTheme.borderRadius,
          }}
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>
      
      <p className="text-xs text-center order-last sm:order-none" style={{ color: currentTheme.textSecondary }}>
        Click stat to add • Shift+Click to subtract
      </p>

      <button
        onClick={() => setShowEndConfirm(true)}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
        style={{
          backgroundColor: currentTheme.accentColor,
          color: '#fff',
          borderRadius: currentTheme.borderRadius,
        }}
      >
        End Game
      </button>
    </div>
  );

  return (
    <div
      ref={gameContainerRef}
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: currentTheme.backgroundColor,
        color: currentTheme.textColor,
        fontSize: `${currentTheme.baseScale || 1}em`, // Font scaling
      }}
    >
      {currentTheme.layout === 'split' ? (
        // Split Layout
        <div className="flex flex-col h-screen overflow-hidden">
          <div className="flex-none">
            {renderActionBar()}
          </div>
          <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-4 overflow-hidden px-4 pb-4">
            <div className="overflow-y-auto pr-2">
              {renderTeamStats(homeTeam, 'home', true)}
            </div>
            <div className="flex flex-col items-center min-w-[300px] h-full gap-4">
              <div 
                className="w-full rounded-xl p-4 shadow-xl shrink-0"
                style={{ backgroundColor: currentTheme.secondaryBackground }}
              >
                {renderScoreboard()}
                
                {showTargetBar && currentGame.targetScore && (
                  <div className="flex justify-center w-full mt-2 pt-2 border-t" style={{ borderColor: currentTheme.backgroundColor }}>
                    <TargetScoreBar
                      homeScore={homeScore}
                      awayScore={awayScore}
                      targetScore={currentGame.targetScore}
                      homeColor={homeTeam.primaryColor}
                      awayColor={awayTeam.primaryColor}
                      theme={currentTheme}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-y-auto pl-2">
              {renderTeamStats(awayTeam, 'away', false)}
            </div>
          </div>
        </div>
      ) : (
        // Standard Layout
        <>
          <div
            className="sticky top-0 z-40"
            style={{ backgroundColor: currentTheme.secondaryBackground }}
          >
            {renderScoreboard()}
          </div>

          {/* Target Score Bar */}
          {showTargetBar && currentGame.targetScore && (
            <div 
              className="sticky z-30 flex justify-center w-full py-1 border-b shadow-sm"
              style={{ 
                top: 80, // Approximate height of scoreboard
                backgroundColor: currentTheme.secondaryBackground,
                borderColor: currentTheme.backgroundColor 
              }}
            >
              <TargetScoreBar
                homeScore={homeScore}
                awayScore={awayScore}
                targetScore={currentGame.targetScore}
                homeColor={homeTeam.primaryColor}
                awayColor={awayTeam.primaryColor}
                theme={currentTheme}
              />
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 py-6 w-full">
            {renderActionBar()}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderTeamStats(homeTeam, 'home', true)}
              {renderTeamStats(awayTeam, 'away', false)}
            </div>
          </div>
        </>
      )}

      {/* Target Score Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTargetModal(false)} />
          <div
            className="relative w-full max-w-sm p-6 rounded-xl text-center"
            style={{ backgroundColor: currentTheme.secondaryBackground }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: currentTheme.headerFont }}>
              SET TARGET SCORE
            </h2>
            <p className="mb-4 text-sm" style={{ color: currentTheme.textSecondary }}>
              Set a score limit for the game. Progress bars will appear. Set to 0 to disable.
            </p>
            <input 
              type="number"
              placeholder="e.g. 21"
              defaultValue={currentGame.targetScore || ''}
              className="w-full px-4 py-3 rounded-lg border text-center text-xl font-bold mb-6 focus:outline-none"
              style={{
                backgroundColor: currentTheme.backgroundColor,
                borderColor: currentTheme.textSecondary + '40',
                color: currentTheme.textColor,
                fontFamily: currentTheme.numberFont,
              }}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                updateCurrentGame({ targetScore: val > 0 ? val : null });
              }}
            />
            <button
              onClick={() => setShowTargetModal(false)}
              className="w-full px-4 py-3 rounded-lg font-medium"
              style={{
                backgroundColor: currentTheme.accentColor,
                color: '#fff',
                borderRadius: currentTheme.borderRadius,
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

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

