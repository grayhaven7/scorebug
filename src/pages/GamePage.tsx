import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TargetScoreBar } from '../components/TargetScoreBar';
import type { PlayerGameStats, StatType } from '../types';
import { statLabels } from '../types';
import confetti from 'canvas-confetti';

// Hook to calculate font size based on container width
function useScaledFontSize(boxRef: React.RefObject<HTMLDivElement | null>) {
  const [fontSize, setFontSize] = useState('clamp(1.25rem, 8vw, 5.5rem)');

  useEffect(() => {
    const updateFontSize = () => {
      if (boxRef.current) {
        const width = boxRef.current.offsetWidth;
        // Scale font to be approximately 40% of box width for good visibility
        const calculatedSize = width * 0.4;
        setFontSize(`${Math.max(20, Math.min(calculatedSize, 88))}px`);
      }
    };

    updateFontSize();
    window.addEventListener('resize', updateFontSize);
    return () => window.removeEventListener('resize', updateFontSize);
  }, [boxRef]);

  return fontSize;
}

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
    updateScoreboardConfig,
  } = useApp();

  const [animatingCell, setAnimatingCell] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [confettiShown, setConfettiShown] = useState<string | null>(null);
  const homeScoreBoxRef = useRef<HTMLDivElement>(null);
  const awayScoreBoxRef = useRef<HTMLDivElement>(null);
  const homeFontSize = useScaledFontSize(homeScoreBoxRef);
  const awayFontSize = useScaledFontSize(awayScoreBoxRef);

  // Redirect if no game and reset confetti when game changes
  useEffect(() => {
    if (!currentGame) {
      navigate('/');
    }
  }, [currentGame, navigate]);

  // Reset confetti when game ID changes (new game started)
  useEffect(() => {
    setConfettiShown(null);
  }, [currentGame?.id]);

  // Confetti celebration when target is won
  useEffect(() => {
    if (!currentGame?.targetScore || currentGame.targetScore <= 0 || !currentGame) {
      // Reset confetti state if target is removed
      setConfettiShown(null);
      return;
    }

    // Calculate scores inline
    const homeScore = currentGame.homeTeam.players.reduce((sum, p) => {
      const value = p.points;
      return typeof value === 'number' ? sum + value : sum;
    }, 0);
    const awayScore = currentGame.awayTeam.players.reduce((sum, p) => {
      const value = p.points;
      return typeof value === 'number' ? sum + value : sum;
    }, 0);
    const targetScore = currentGame.targetScore;

    // Check if a team has won
    const homeWon = homeScore >= targetScore;
    const awayWon = awayScore >= targetScore;

    // Determine winner and confetti key
    let winner: 'home' | 'away' | null = null;
    let confettiKey: string | null = null;

    if (homeWon && awayWon) {
      // Both teams reached target - celebrate both (or the one that reached it first)
      // For simplicity, we'll celebrate the one with higher score
      if (homeScore >= awayScore) {
        winner = 'home';
        confettiKey = `home-${targetScore}`;
      } else {
        winner = 'away';
        confettiKey = `away-${targetScore}`;
      }
    } else if (homeWon) {
      winner = 'home';
      confettiKey = `home-${targetScore}`;
    } else if (awayWon) {
      winner = 'away';
      confettiKey = `away-${targetScore}`;
    }

    // Trigger confetti if winner exists and we haven't shown it yet for this target
    if (winner && confettiKey && confettiShown !== confettiKey) {
      const winningTeam = winner === 'home' ? currentGame.homeTeam : currentGame.awayTeam;
      const primaryColor = winningTeam.primaryColor;
      const secondaryColor = winningTeam.secondaryColor;

      // Ensure colors are in proper hex format for canvas-confetti
      // canvas-confetti accepts hex strings like '#RRGGBB'
      const normalizeHex = (color: string): string => {
        if (!color) return '#ffffff'; // fallback to white
        
        // If it's already a hex color, ensure it's properly formatted
        if (color.startsWith('#')) {
          // Handle 3-digit hex (#RGB -> #RRGGBB)
          if (color.length === 4) {
            const r = color[1];
            const g = color[2];
            const b = color[3];
            return `#${r}${r}${g}${g}${b}${b}`;
          }
          // Already 6 or 8 digit hex, return as-is
          return color;
        }
        
        // If it's not hex, try to parse it or return as-is
        // (canvas-confetti might handle other formats)
        return color;
      };

      const primaryHex = normalizeHex(primaryColor);
      const secondaryHex = normalizeHex(secondaryColor);

      // Create confetti with team colors
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 10000,
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      // Fire multiple bursts with team colors (using hex directly)
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: [primaryHex],
      });
      fire(0.2, {
        spread: 60,
        colors: [secondaryHex],
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        colors: [primaryHex, secondaryHex],
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
        colors: [primaryHex, secondaryHex],
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
        colors: [primaryHex, secondaryHex],
      });

      // Mark confetti as shown for this target
      setConfettiShown(confettiKey);
    }
  }, [
    currentGame?.targetScore,
    currentGame?.homeTeam.players,
    currentGame?.awayTeam.players,
    currentGame?.homeTeam.primaryColor,
    currentGame?.homeTeam.secondaryColor,
    currentGame?.awayTeam.primaryColor,
    currentGame?.awayTeam.secondaryColor,
    confettiShown,
  ]);

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
        className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3"
        style={{
          backgroundColor: team.primaryColor,
          color: team.secondaryColor,
        }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mb-0.5 sm:mb-1 md:mb-2">
          <span
            className="text-sm sm:text-base md:text-lg font-bold tracking-wide truncate flex-1 min-w-0"
            style={{ fontFamily: currentTheme.headerFont }}
          >
            {team.teamName}
          </span>
          <span className="ml-auto text-[10px] xs:text-xs sm:text-sm opacity-80 shrink-0">
            {isHome ? 'HOME' : 'AWAY'}
          </span>
        </div>
        
      </div>

      {/* Stats Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr style={{ backgroundColor: currentTheme.backgroundColor }}>
              <th
                className="px-2 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-2 text-left text-[10px] sm:text-[11px] md:text-xs font-medium w-8 sm:w-10"
                style={{ color: currentTheme.textSecondary }}
              >
                #
              </th>
              <th
                className="px-2 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-2 text-left text-[10px] sm:text-[11px] md:text-xs font-medium min-w-[70px] sm:min-w-[80px]"
                style={{ color: currentTheme.textSecondary }}
              >
                PLAYER
              </th>
              {enabledStats.map(stat => (
                <th
                  key={stat}
                  colSpan={stat === 'points' && settings.scoreboardConfig.showQuickPoints ? 2 : 1}
                  className="px-2 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-2 text-center text-[10px] sm:text-[11px] md:text-xs font-medium"
                  style={{ color: currentTheme.textSecondary }}
                >
                  {statLabels[stat].slice(0, 3)}
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
                <td className="px-2 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-2">
                  <span
                    className="inline-block w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-6 rounded text-center text-[11px] sm:text-xs md:text-sm font-bold leading-5 sm:leading-6 md:leading-6"
                    style={{
                      backgroundColor: team.primaryColor,
                      color: team.secondaryColor,
                    }}
                  >
                    {player.jerseyNumber}
                  </span>
                </td>
                <td className="px-2 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-2 font-medium text-xs sm:text-sm md:text-base truncate max-w-[80px] sm:max-w-[100px]">{player.playerName}</td>
                {enabledStats.map(stat => {
                  const cellId = `${teamType}-${player.playerId}-${stat}`;
                  const value = player[stat as keyof PlayerGameStats];
                  return (
                    <>
                      <td key={stat} className="px-1 sm:px-1 md:px-2 py-1.5 sm:py-2 md:py-2 text-center">
                        <button
                          onClick={e => handleStatClick(teamType, player.playerId, stat as keyof PlayerGameStats, e)}
                          className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-8 rounded font-bold text-xs sm:text-sm md:text-base transition-all hover:scale-110 cursor-pointer ${
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
                      {stat === 'points' && settings.scoreboardConfig.showQuickPoints && (
                        <td className="px-1 sm:px-1 md:px-2 py-1.5 sm:py-2 md:py-2 text-center min-w-[50px] sm:min-w-[60px] md:w-24">
                          <div className="flex gap-0.5 sm:gap-1 justify-center">
                            {[1, 2, 3].map(pts => (
                              <button
                                key={pts}
                                onClick={() => updatePlayerStat(teamType, player.playerId, 'points', pts)}
                                className="w-4 h-5 sm:w-5 sm:h-6 md:w-6 md:h-8 rounded text-[9px] sm:text-[10px] md:text-xs font-bold transition-all hover:scale-110 hover:brightness-110 flex items-center justify-center"
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
              <td className="px-2 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-2"></td>
              <td className="px-2 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-2 text-xs sm:text-sm md:text-base" style={{ fontFamily: currentTheme.headerFont }}>
                TOTAL
              </td>
              {enabledStats.map(stat => (
                <td key={stat} colSpan={stat === 'points' && settings.scoreboardConfig.showQuickPoints ? 2 : 1} className="px-1 sm:px-1 md:px-2 py-1.5 sm:py-2 md:py-2 text-center">
                  <span
                    className="inline-block px-1 sm:px-1.5 md:px-0 md:w-10 h-6 sm:h-7 md:h-8 leading-6 sm:leading-7 md:leading-8 rounded font-bold text-xs sm:text-sm md:text-base"
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
    <div className="w-full">
      {/* Game Title Input */}
      {settings.scoreboardConfig.showTitle && (
        <div className="flex justify-center pt-1 px-2 pb-1">
          <input
            type="text"
            placeholder="Game Title (e.g. Game 4 of Season)"
            value={currentGame.title || ''}
            onChange={(e) => updateCurrentGame({ title: e.target.value })}
            className="text-center bg-transparent border-transparent hover:border-white/10 focus:border-white/20 border rounded px-1.5 sm:px-2 md:px-3 py-0.5 w-full max-w-md transition-colors focus:outline-none placeholder-white/20 font-bold text-[10px] sm:text-xs md:text-sm"
            style={{
              color: '#ffffff',
              fontFamily: currentTheme.headerFont,
              fontSize: 'clamp(0.65rem, 1.5vw, 0.9rem)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          />
        </div>
      )}

      <div className="flex flex-col items-center py-1 sm:py-1.5 md:py-2 gap-0.5 sm:gap-1 md:gap-1">
        {/* Team Names Row - Above Score Boxes */}
        <div className="flex items-center justify-center w-full mb-0 px-2">
          <div className="flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3">
            {/* Home Team Name */}
            <div className="max-w-[100px] xs:max-w-[130px] sm:max-w-[160px] md:max-w-[120px] lg:max-w-[140px] flex flex-col items-center text-center min-w-0">
              <p
                className="text-[10px] xs:text-xs sm:text-sm md:text-sm font-bold break-words leading-normal"
                style={{ 
                  fontFamily: currentTheme.headerFont,
                  color: currentTheme.textColor
                }}
                title={homeTeam.teamName}
              >
                {homeTeam.teamName}
              </p>
            </div>
            
            {/* Center spacer - matches quarter/timer width below */}
            {(settings.scoreboardConfig.showQuarter || settings.scoreboardConfig.showTimer) ? (
              <div className="hidden xs:flex flex-col items-center mx-1 xs:mx-2 sm:mx-3 md:mx-2 lg:mx-3 shrink-0 min-w-[50px] xs:min-w-[60px] sm:min-w-[70px] md:min-w-[80px] lg:min-w-[90px]">
              </div>
            ) : null}

            {/* Away Team Name */}
            <div className="max-w-[100px] xs:max-w-[130px] sm:max-w-[160px] md:max-w-[120px] lg:max-w-[140px] flex flex-col items-center text-center min-w-0">
              <p
                className="text-[10px] xs:text-xs sm:text-sm md:text-sm font-bold break-words leading-normal"
                style={{ 
                  fontFamily: currentTheme.headerFont,
                  color: currentTheme.textColor
                }}
                title={awayTeam.teamName}
              >
                {awayTeam.teamName}
              </p>
            </div>
          </div>
        </div>

        {/* Record/Standing Row */}
        <div className="flex flex-col w-full gap-0 px-2">
          {/* Record/Standing Row */}
          {(settings.scoreboardConfig.showRecord || settings.scoreboardConfig.showStanding) && (
            <div className="flex items-center justify-center w-full">
              <div className="flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2">
                {/* Home Team Record/Standing */}
                <div className="flex gap-0.5 items-center">
                  {settings.scoreboardConfig.showRecord && (
                    <input
                      type="text"
                      placeholder="Record"
                      value={homeTeam.record || ''}
                      onChange={(e) => updateTeamDetails('home', 'record', e.target.value)}
                      className="w-12 xs:w-14 sm:w-16 md:w-18 lg:w-20 px-0.5 py-0 text-[10px] xs:text-xs sm:text-sm md:text-sm rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-right font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none'
                      }}
                    />
                  )}
                  {settings.scoreboardConfig.showStanding && (
                    <input
                      type="text"
                      placeholder="Standing"
                      value={homeTeam.standing || ''}
                      onChange={(e) => updateTeamDetails('home', 'standing', e.target.value)}
                      className="w-12 xs:w-14 sm:w-16 md:w-18 lg:w-20 px-0.5 py-0 text-[10px] xs:text-xs sm:text-sm md:text-sm rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-right font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none'
                      }}
                    />
                  )}
                </div>
                
                {/* Center spacer */}
                {(settings.scoreboardConfig.showQuarter || settings.scoreboardConfig.showTimer) ? (
                  <div className="hidden xs:flex flex-col items-center mx-0.5 xs:mx-1 sm:mx-2 md:mx-2 lg:mx-3 shrink-0 min-w-[40px] xs:min-w-[50px] sm:min-w-[60px] md:min-w-[70px] lg:min-w-[80px]">
                  </div>
                ) : null}

                {/* Away Team Record/Standing */}
                <div className="flex gap-0.5 items-center">
                  {settings.scoreboardConfig.showStanding && (
                    <input
                      type="text"
                      placeholder="Standing"
                      value={awayTeam.standing || ''}
                      onChange={(e) => updateTeamDetails('away', 'standing', e.target.value)}
                      className="w-12 xs:w-14 sm:w-16 md:w-18 lg:w-20 px-0.5 py-0 text-[10px] xs:text-xs sm:text-sm md:text-sm rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-left font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none'
                      }}
                    />
                  )}
                  {settings.scoreboardConfig.showRecord && (
                    <input
                      type="text"
                      placeholder="Record"
                      value={awayTeam.record || ''}
                      onChange={(e) => updateTeamDetails('away', 'record', e.target.value)}
                      className="w-12 xs:w-14 sm:w-16 md:w-18 lg:w-20 px-0.5 py-0 text-[10px] xs:text-xs sm:text-sm md:text-sm rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-left font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scores Row */}
        <div className="flex items-center justify-center w-full gap-1 xs:gap-1.5 sm:gap-2 md:gap-2 px-2">
          {/* Home Team Score */}
          <div
            ref={homeScoreBoxRef}
            className="w-[70px] xs:w-[85px] sm:w-[100px] md:w-[110px] lg:w-[120px] aspect-square rounded-lg sm:rounded-xl md:rounded-xl flex flex-col items-center justify-center relative overflow-hidden shadow-lg"
            style={{ backgroundColor: homeTeam.primaryColor }}
          >
            <span
              className="font-black relative z-10 leading-none"
              style={{
                color: homeTeam.secondaryColor,
                fontFamily: currentTheme.numberFont,
                fontSize: homeFontSize,
              }}
            >
              {homeScore}
            </span>
          </div>

          {/* Center - Quarter & Time */}
          {(settings.scoreboardConfig.showQuarter || settings.scoreboardConfig.showTimer) && (
            <div className="text-center flex flex-col items-center mx-0.5 xs:mx-1 sm:mx-1.5 md:mx-2 shrink-0">
              {settings.scoreboardConfig.showQuarter && (
                <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-1 md:gap-1.5 mb-0.5 sm:mb-0.5 md:mb-0">
                  <button
                    onClick={() => handleQuarterChange(-1)}
                    className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full transition-all hover:scale-110 flex items-center justify-center bg-black/5 hover:bg-black/10 active:scale-95"
                    style={{
                      color: currentTheme.accentColor,
                    }}
                    disabled={quarter <= 1}
                  >
                    <span className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs">◀</span>
                  </button>
                  <span
                    className="text-xs xs:text-sm sm:text-base md:text-base font-black px-0.5 xs:px-1 sm:px-1 md:px-1.5 min-w-[2ch]"
                    style={{ fontFamily: currentTheme.numberFont }}
                  >
                    Q{quarter}
                  </span>
                  <button
                    onClick={() => handleQuarterChange(1)}
                    className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full transition-all hover:scale-110 flex items-center justify-center bg-black/5 hover:bg-black/10 active:scale-95"
                    style={{
                      color: currentTheme.accentColor,
                    }}
                    disabled={quarter >= 4}
                  >
                    <span className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs">▶</span>
                  </button>
                </div>
              )}
              {settings.scoreboardConfig.showTimer && (
                <input
                  type="text"
                  value={timeRemaining}
                  onChange={e => updateCurrentGame({ timeRemaining: e.target.value })}
                  className="w-10 xs:w-12 sm:w-14 md:w-16 lg:w-18 text-center bg-transparent border-b-2 text-xs xs:text-sm sm:text-base md:text-base font-mono focus:outline-none font-bold"
                  style={{
                    borderColor: currentTheme.accentColor,
                    color: currentTheme.textColor,
                  }}
                />
              )}
              {currentGame.targetScore && (
                <div className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-[9px] font-bold mt-0 whitespace-nowrap uppercase tracking-wider" style={{ color: currentTheme.accentColor }}>
                  TARGET: {currentGame.targetScore}
                </div>
              )}
            </div>
          )}

          {/* Away Team Score */}
          <div
            ref={awayScoreBoxRef}
            className="w-[70px] xs:w-[85px] sm:w-[100px] md:w-[110px] lg:w-[120px] aspect-square rounded-lg sm:rounded-xl md:rounded-xl flex flex-col items-center justify-center relative overflow-hidden shadow-lg"
            style={{ backgroundColor: awayTeam.primaryColor }}
          >
            <span
              className="font-black relative z-10 leading-none"
              style={{
                color: awayTeam.secondaryColor,
                fontFamily: currentTheme.numberFont,
                fontSize: awayFontSize,
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
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-4 md:mb-6 gap-3 md:gap-4 p-2 sm:p-3 md:p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap w-full md:w-auto justify-center md:justify-start gap-2">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="px-2 sm:px-3 py-1.5 md:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          className="px-2 sm:px-3 py-1.5 md:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          onClick={() => updateScoreboardConfig({ showQuickPoints: !settings.scoreboardConfig.showQuickPoints })}
          className="px-2 sm:px-3 py-1.5 md:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
          style={{
            backgroundColor: currentTheme.backgroundColor,
            border: `1px solid ${currentTheme.textSecondary}40`,
            color: currentTheme.textSecondary,
            borderRadius: currentTheme.borderRadius,
          }}
        >
          {settings.scoreboardConfig.showQuickPoints ? 'Hide +Pts' : 'Show +Pts'}
        </button>
        <button
          onClick={() => updateScoreboardConfig({ showTitle: !settings.scoreboardConfig.showTitle })}
          className="px-2 sm:px-3 py-1.5 md:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
          style={{
            backgroundColor: currentTheme.backgroundColor,
            border: `1px solid ${currentTheme.textSecondary}40`,
            color: currentTheme.textSecondary,
            borderRadius: currentTheme.borderRadius,
          }}
        >
          {settings.scoreboardConfig.showTitle ? 'Hide Title' : 'Show Title'}
        </button>
        <button
          onClick={() => updateScoreboardConfig({ showRecord: !settings.scoreboardConfig.showRecord })}
          className="px-2 sm:px-3 py-1.5 md:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
          style={{
            backgroundColor: currentTheme.backgroundColor,
            border: `1px solid ${currentTheme.textSecondary}40`,
            color: currentTheme.textSecondary,
            borderRadius: currentTheme.borderRadius,
          }}
        >
          {settings.scoreboardConfig.showRecord ? 'Hide Record' : 'Show Record'}
        </button>
        <button
          onClick={() => updateScoreboardConfig({ showStanding: !settings.scoreboardConfig.showStanding })}
          className="px-2 sm:px-3 py-1.5 md:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
          style={{
            backgroundColor: currentTheme.backgroundColor,
            border: `1px solid ${currentTheme.textSecondary}40`,
            color: currentTheme.textSecondary,
            borderRadius: currentTheme.borderRadius,
          }}
        >
          {settings.scoreboardConfig.showStanding ? 'Hide Standing' : 'Show Standing'}
        </button>
        <button
          onClick={toggleFullscreen}
          className="px-2 sm:px-3 py-1.5 md:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
          style={{
            backgroundColor: currentTheme.backgroundColor,
            border: `1px solid ${currentTheme.textSecondary}40`,
            color: currentTheme.textSecondary,
            borderRadius: currentTheme.borderRadius,
          }}
        >
          {isFullscreen ? 'Exit Full' : 'Full'}
        </button>
      </div>
      
      <p className="hidden sm:block text-[10px] md:text-xs text-center order-last md:order-none opacity-60 px-2" style={{ color: currentTheme.textSecondary }}>
        Click to add • Shift+Click to subtract
      </p>

      <button
        onClick={() => setShowEndConfirm(true)}
        className="w-full md:w-auto px-4 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
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
      className={`${isFullscreen ? 'h-full overflow-y-auto' : 'min-h-screen'} flex flex-col`}
      style={{
        backgroundColor: currentTheme.backgroundColor,
        color: currentTheme.textColor,
        fontSize: `${currentTheme.baseScale || 1}em`, // Font scaling
      }}
    >
      {currentTheme.layout === 'split' ? (
        // Split Layout
        <div className={`flex flex-col ${isFullscreen ? 'min-h-full' : 'h-screen overflow-hidden'}`}>
          <div className="flex-none">
            {renderActionBar()}
          </div>
          <div className={`flex-1 flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] gap-3 md:gap-4 ${isFullscreen ? '' : 'overflow-hidden'} px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4`}>
            <div className="flex-1 overflow-y-auto pr-0 md:pr-2 order-2 md:order-1 min-h-0">
              {renderTeamStats(homeTeam, 'home', true)}
            </div>
            <div className="flex-none flex flex-col items-center w-full md:w-auto md:max-w-[320px] lg:max-w-[360px] h-auto md:max-h-[45vh] gap-2 sm:gap-3 md:gap-2 order-1 md:order-2">
              <div 
                className="w-full rounded-xl p-2 sm:p-3 md:p-4 py-2 sm:py-3 md:py-4 shadow-xl shrink-0"
                style={{ backgroundColor: currentTheme.secondaryBackground }}
              >
                {renderScoreboard()}
                
                {showTargetBar && currentGame.targetScore && (
                  <div className="flex justify-center w-full mt-0.5 pt-0.5 border-t" style={{ borderColor: currentTheme.backgroundColor }}>
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
            <div className="flex-1 overflow-y-auto pl-0 md:pl-2 order-3 min-h-0">
              {renderTeamStats(awayTeam, 'away', false)}
            </div>
          </div>
        </div>
      ) : (
        // Standard Layout
        <>
          <div
            className="sticky top-0 z-40 shadow-sm max-h-[45vh] py-1 sm:py-1.5 md:py-2"
            style={{ backgroundColor: currentTheme.secondaryBackground }}
          >
            {renderScoreboard()}

            {/* Target Score Bar */}
            {showTargetBar && currentGame.targetScore && (
              <div 
                className="flex justify-center w-full py-0.5 border-b"
                style={{ 
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
          </div>

          <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 py-4 sm:py-5 md:py-6 w-full">
            {renderActionBar()}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              {renderTeamStats(homeTeam, 'home', true)}
              {renderTeamStats(awayTeam, 'away', false)}
            </div>
          </div>
        </>
      )}

      {/* Target Score Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTargetModal(false)} />
          <div
            className="relative w-full max-w-sm p-4 sm:p-6 rounded-xl text-center"
            style={{ backgroundColor: currentTheme.secondaryBackground }}
          >
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ fontFamily: currentTheme.headerFont }}>
              SET TARGET SCORE
            </h2>
            <p className="mb-3 sm:mb-4 text-xs sm:text-sm px-2" style={{ color: currentTheme.textSecondary }}>
              Set a score limit for the game. Progress bars will appear. Set to 0 to disable.
            </p>
            <input 
              type="number"
              placeholder="e.g. 21"
              defaultValue={currentGame.targetScore || ''}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border text-center text-lg sm:text-xl font-bold mb-4 sm:mb-6 focus:outline-none"
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
              className="w-full px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEndConfirm(false)} />
          <div
            className="relative w-full max-w-md p-4 sm:p-6 rounded-xl text-center"
            style={{ backgroundColor: currentTheme.secondaryBackground }}
          >
            <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3" style={{ fontFamily: currentTheme.headerFont }}>
              END GAME?
            </h2>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base px-2" style={{ color: currentTheme.textSecondary }}>
              Final Score: {homeTeam.teamName} {homeScore} - {awayScore} {awayTeam.teamName}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base border"
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
                className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
          <div
            className="relative w-full max-w-md p-4 sm:p-6 rounded-xl text-center"
            style={{ backgroundColor: currentTheme.secondaryBackground }}
          >
            <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3" style={{ fontFamily: currentTheme.headerFont }}>
              LEAVE GAME?
            </h2>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base px-2" style={{ color: currentTheme.textSecondary }}>
              Your game progress is auto-saved. You can resume later.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base border"
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
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base bg-red-500/20 text-red-400"
                style={{ borderRadius: currentTheme.borderRadius }}
              >
                Leave (Discard)
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base"
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

