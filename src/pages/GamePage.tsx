import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TargetScoreBar } from '../components/TargetScoreBar';
import type { PlayerGameStats, StatType } from '../types';
import { statLabels } from '../types';
import confetti from 'canvas-confetti';

// Hook to calculate font size based on container dimensions (width and height)
function useScaledFontSize(boxRef: React.RefObject<HTMLDivElement | null>) {
  const [fontSize, setFontSize] = useState('clamp(1.25rem, 8vw, 5.5rem)');

  useEffect(() => {
    const updateFontSize = () => {
      if (boxRef.current) {
        const width = boxRef.current.offsetWidth;
        const height = boxRef.current.offsetHeight;
        // Use the smaller dimension to ensure text fits, but prefer height for vertical layout
        // Scale font to be approximately 50% of the smaller dimension for good visibility
        const dimension = Math.min(width, height);
        const calculatedSize = dimension * 0.5;
        setFontSize(`${Math.max(24, Math.min(calculatedSize, 120))}px`);
      }
    };

    updateFontSize();
    window.addEventListener('resize', updateFontSize);
    // Use ResizeObserver for more accurate updates
    let resizeObserver: ResizeObserver | null = null;
    if (boxRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateFontSize);
      resizeObserver.observe(boxRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateFontSize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
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
  const [expandedStats, setExpandedStats] = useState<{ home: boolean; away: boolean }>({ home: false, away: false });
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
  const updateTeamDetails = (teamType: 'home' | 'away', field: 'record' | 'standing' | 'displayName', value: string) => {
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
  ) => {
    const isExpanded = expandedStats[teamType];
    const visibleStats = isExpanded 
      ? enabledStats 
      : enabledStats.filter(stat => stat === 'points');
    
    return (
    <div
      className="rounded-xl overflow-hidden h-full flex flex-col"
      style={{ backgroundColor: currentTheme.secondaryBackground }}
    >
      {/* Team Header */}
      <div
        className="px-2 sm:px-3 md:px-2 lg:px-2.5 py-1.5 sm:py-2 md:py-1.5 lg:py-2"
        style={{
          backgroundColor: team.primaryColor,
          color: team.secondaryColor,
        }}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 md:gap-2.5 lg:gap-3 mb-1 sm:mb-1.5 md:mb-1.5 lg:mb-2">
            <span
              className="text-xs sm:text-sm md:text-sm lg:text-base font-bold tracking-wide truncate flex-1 min-w-0"
              style={{ fontFamily: currentTheme.headerFont }}
            >
              {team.teamName}
            </span>
            <button
              onClick={() => setExpandedStats(prev => ({ ...prev, [teamType]: !prev[teamType] }))}
              className="px-2 py-1 rounded text-[9px] sm:text-[10px] md:text-[10px] lg:text-xs font-medium transition-all hover:opacity-80 shrink-0"
              style={{
                backgroundColor: team.secondaryColor + '30',
                color: team.secondaryColor,
                borderRadius: currentTheme.borderRadius,
              }}
              title={isExpanded ? 'Collapse stats' : 'Expand stats'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <span className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-xs opacity-80 shrink-0">
              {isHome ? 'HOME' : 'AWAY'}
            </span>
        </div>
        
      </div>

      {/* Stats Table */}
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
        <table className="w-full min-w-max">
          <thead>
            <tr style={{ backgroundColor: currentTheme.backgroundColor }}>
              <th
                className="text-left font-medium w-10 sm:w-12 md:w-12 lg:w-14"
                style={{ 
                  color: currentTheme.textSecondary,
                  fontSize: 'clamp(0.625rem, 1.2vw + 0.4rem, 0.875rem)',
                  padding: 'clamp(0.375rem, 1vw + 0.25rem, 0.625rem) clamp(0.5rem, 1.2vw + 0.25rem, 1rem)'
                }}
              >
                #
              </th>
              <th
                className="text-left font-medium min-w-[100px] sm:min-w-[120px] md:min-w-[140px] lg:min-w-[160px]"
                style={{ 
                  color: currentTheme.textSecondary,
                  fontSize: 'clamp(0.625rem, 1.2vw + 0.4rem, 0.875rem)',
                  padding: 'clamp(0.375rem, 1vw + 0.25rem, 0.625rem) clamp(0.5rem, 1.2vw + 0.25rem, 1rem)'
                }}
              >
                PLAYER
              </th>
              {visibleStats.map(stat => (
                <th
                  key={stat}
                  colSpan={stat === 'points' && settings.scoreboardConfig.showQuickPoints ? 2 : 1}
                  className="text-center font-medium"
                  style={{ 
                    color: currentTheme.textSecondary,
                    fontSize: 'clamp(0.625rem, 1.2vw + 0.4rem, 0.875rem)',
                    padding: 'clamp(0.375rem, 1vw + 0.25rem, 0.625rem) clamp(0.5rem, 1.2vw + 0.25rem, 1rem)'
                  }}
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
                <td style={{ padding: 'clamp(0.375rem, 1vw + 0.25rem, 0.625rem) clamp(0.5rem, 1.2vw + 0.25rem, 1rem)' }}>
                  <span
                    className="inline-block rounded text-center font-bold"
                    style={{
                      backgroundColor: team.primaryColor,
                      color: team.secondaryColor,
                      fontSize: 'clamp(0.75rem, 1.5vw + 0.5rem, 1.125rem)',
                      width: 'clamp(1.75rem, 3.5vw + 1rem, 2.5rem)',
                      height: 'clamp(1.75rem, 3.5vw + 1rem, 2.5rem)',
                      lineHeight: 'clamp(1.75rem, 3.5vw + 1rem, 2.5rem)',
                    }}
                  >
                    {player.jerseyNumber}
                  </span>
                </td>
                <td 
                  className="font-medium truncate max-w-[120px] sm:max-w-[140px] md:max-w-[160px] lg:max-w-[180px]"
                  style={{
                    fontSize: settings.scoreboardConfig.showQuickPoints 
                      ? 'clamp(0.625rem, 1vw + 0.4rem, 0.875rem)'
                      : 'clamp(0.75rem, 1.5vw + 0.5rem, 1.125rem)',
                    padding: 'clamp(0.375rem, 1vw + 0.25rem, 0.625rem) clamp(0.5rem, 1.2vw + 0.25rem, 1rem)',
                    paddingRight: 'clamp(0.25rem, 0.8vw + 0.2rem, 0.625rem)'
                  }}
                >
                  {player.playerName}
                </td>
                {visibleStats.map(stat => {
                  const cellId = `${teamType}-${player.playerId}-${stat}`;
                  const value = player[stat as keyof PlayerGameStats];
                  return (
                    <>
                      <td key={stat} className={`${settings.scoreboardConfig.showQuickPoints ? 'px-1 sm:px-2 md:px-2 lg:px-3' : 'px-0.5 sm:px-1 md:px-1 lg:px-1.5'} py-1.5 sm:py-2 md:py-2 lg:py-2.5 text-center`}>
                        <button
                          onClick={e => handleStatClick(teamType, player.playerId, stat as keyof PlayerGameStats, e)}
                          className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded font-bold transition-all hover:scale-110 cursor-pointer ${
                            animatingCell === cellId ? 'stat-pop' : ''
                          }`}
                          style={{
                            backgroundColor: currentTheme.accentColor + '20',
                            color: currentTheme.accentColor,
                            borderRadius: currentTheme.borderRadius,
                            fontSize: 'clamp(0.875rem, 2vw + 0.5rem, 1.25rem)',
                          }}
                          title="Click to add, Shift+Click to subtract"
                        >
                          {typeof value === 'number' ? value : 0}
                        </button>
                      </td>
                      {stat === 'points' && settings.scoreboardConfig.showQuickPoints && (
                        <td className="px-1 sm:px-2 md:px-2 lg:px-3 py-1.5 sm:py-2 md:py-2 lg:py-2.5 text-center min-w-[80px] sm:min-w-[100px] md:min-w-[110px] lg:min-w-[120px]">
                          <div className="flex gap-1 sm:gap-1.5 md:gap-2 lg:gap-2 justify-center">
                            {[1, 2, 3].map(pts => (
                              <button
                                key={pts}
                                onClick={() => updatePlayerStat(teamType, player.playerId, 'points', pts)}
                                className="w-7 h-9 sm:w-8 sm:h-10 md:w-9 md:h-11 lg:w-10 lg:h-12 rounded text-[10px] sm:text-xs md:text-xs lg:text-sm font-bold transition-all hover:scale-110 hover:brightness-110 flex items-center justify-center"
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
              <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-2 lg:py-2.5"></td>
              <td 
                className="px-2 sm:px-3 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-2 lg:py-2.5 font-bold" 
                style={{ 
                  fontFamily: currentTheme.headerFont,
                  fontSize: 'clamp(0.875rem, 1.5vw + 0.5rem, 1.25rem)'
                }}
              >
                TOTAL
              </td>
              {visibleStats.map(stat => (
                <td key={stat} colSpan={stat === 'points' && settings.scoreboardConfig.showQuickPoints ? 2 : 1} className="px-1 sm:px-2 md:px-2 lg:px-3 py-1.5 sm:py-2 md:py-2 lg:py-2.5 text-center">
                  <span
                    className="inline-block px-2 sm:px-3 md:px-4 lg:px-5 rounded font-bold"
                    style={{
                      backgroundColor: team.primaryColor,
                      color: team.secondaryColor,
                      borderRadius: currentTheme.borderRadius,
                      fontSize: 'clamp(0.875rem, 2vw + 0.5rem, 1.25rem)',
                      height: 'clamp(1.75rem, 3.5vw + 1rem, 2.5rem)',
                      lineHeight: 'clamp(1.75rem, 3.5vw + 1rem, 2.5rem)',
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
  };

  const renderScoreboard = () => (
    <div className="w-full min-w-0 flex flex-col">
      {/* Game Title Input */}
      {settings.scoreboardConfig.showTitle && (
        <div className="flex justify-center px-1 xs:px-2 sm:px-2 pb-1 xs:pb-1.5 sm:pb-2 shrink-0">
          <input
            type="text"
            placeholder="Game Title (e.g. Game 4 of Season)"
            value={currentGame.title || ''}
            onChange={(e) => updateCurrentGame({ title: e.target.value })}
            className="text-center bg-transparent border-transparent hover:border-white/10 focus:border-white/20 border rounded px-1 xs:px-1.5 sm:px-2 md:px-3 py-0.5 xs:py-0.5 sm:py-1 w-full max-w-[280px] xs:max-w-[320px] sm:max-w-md transition-colors focus:outline-none placeholder-white/20 font-bold text-[10px] xs:text-xs sm:text-sm md:text-sm"
            style={{
              color: '#ffffff',
              fontFamily: currentTheme.headerFont,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-0.5 xs:gap-0.5 sm:gap-1 md:gap-1 shrink-0">
        {/* Scores Row - Horizontal Layout */}
        <div className="flex items-center justify-center w-full gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 px-1 xs:px-1.5 sm:px-2 md:px-2 lg:px-2.5 min-w-0 shrink-0">
          {/* Home Team Score */}
          <div className="flex flex-col items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-1 lg:gap-1.5">
            <div className="flex flex-col items-center gap-0.5 xs:gap-1 sm:gap-1 md:gap-0.5 lg:gap-1 w-full shrink-0">
              <input
                type="text"
                value={homeTeam.displayName || homeTeam.teamName}
                onChange={(e) => updateTeamDetails('home', 'displayName', e.target.value)}
                placeholder={homeTeam.teamName}
                className="text-sm xs:text-base sm:text-base md:text-sm lg:text-base font-bold text-center w-full px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-opacity-50 hover:bg-black/5 transition-colors"
                style={{ 
                  fontFamily: currentTheme.headerFont,
                  color: currentTheme.textColor,
                  textAlign: 'center',
                  '--tw-ring-color': currentTheme.accentColor + '50'
                } as React.CSSProperties & { '--tw-ring-color'?: string }}
                title={`Full name: ${homeTeam.teamName}`}
              />
              {(settings.scoreboardConfig.showRecord || settings.scoreboardConfig.showStanding) && (
                <div className="flex flex-col gap-0.5 xs:gap-0.5 sm:gap-1 md:gap-0.5 lg:gap-1 items-center justify-center text-[9px] xs:text-[10px] sm:text-xs md:text-[9px] lg:text-[10px] w-full">
                  {settings.scoreboardConfig.showRecord && (
                    <input
                      type="text"
                      placeholder="R"
                      value={homeTeam.record || ''}
                      onChange={(e) => updateTeamDetails('home', 'record', e.target.value)}
                      className="w-full max-w-[60px] xs:max-w-[70px] sm:max-w-[80px] md:max-w-[65px] lg:max-w-[75px] px-0.5 py-0 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        textAlign: 'center'
                      }}
                    />
                  )}
                  {settings.scoreboardConfig.showStanding && (
                    <input
                      type="text"
                      placeholder="S"
                      value={homeTeam.standing || ''}
                      onChange={(e) => updateTeamDetails('home', 'standing', e.target.value)}
                      className="w-full max-w-[80px] xs:max-w-[90px] sm:max-w-[100px] md:max-w-[85px] lg:max-w-[95px] px-0.5 py-0 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        textAlign: 'center'
                      }}
                    />
                  )}
                </div>
              )}
            </div>
            <div
              ref={homeScoreBoxRef}
              className="w-[65px] xs:w-[75px] sm:w-[90px] md:w-[90px] lg:w-[100px] xl:w-[110px] aspect-square rounded-lg flex flex-col items-center justify-center relative overflow-hidden shadow-lg shrink-0"
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
          </div>

          {/* Center - Quarter & Time */}
          {(settings.scoreboardConfig.showQuarter || settings.scoreboardConfig.showTimer) && (
            <div className="text-center flex flex-col items-center mx-0.5 xs:mx-1 sm:mx-1.5 md:mx-2 lg:mx-2.5 shrink-0 min-w-[70px] xs:min-w-[85px] sm:min-w-[100px] md:min-w-[70px] lg:min-w-[80px]">
              {settings.scoreboardConfig.showQuarter && (
                <div className="flex items-center gap-1 xs:gap-1 sm:gap-1.5 md:gap-1.5 lg:gap-2 mb-0.5 xs:mb-0.5 sm:mb-0.5 md:mb-0.5 lg:mb-1">
                  <button
                    onClick={() => handleQuarterChange(-1)}
                    className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full transition-all hover:scale-110 flex items-center justify-center bg-black/5 hover:bg-black/10 active:scale-95 shrink-0"
                    style={{
                      color: currentTheme.accentColor,
                    }}
                    disabled={quarter <= 1}
                  >
                    <span className="text-[10px] xs:text-xs sm:text-sm md:text-xs lg:text-sm">◀</span>
                  </button>
                  <span
                    className="text-sm xs:text-base sm:text-lg md:text-base lg:text-lg xl:text-xl font-black px-1 xs:px-1.5 sm:px-2 md:px-1 lg:px-1.5 min-w-[2ch]"
                    style={{ fontFamily: currentTheme.numberFont }}
                  >
                    Q{quarter}
                  </span>
                  <button
                    onClick={() => handleQuarterChange(1)}
                    className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full transition-all hover:scale-110 flex items-center justify-center bg-black/5 hover:bg-black/10 active:scale-95 shrink-0"
                    style={{
                      color: currentTheme.accentColor,
                    }}
                    disabled={quarter >= 4}
                  >
                    <span className="text-[10px] xs:text-xs sm:text-sm md:text-xs lg:text-sm">▶</span>
                  </button>
                </div>
              )}
              {settings.scoreboardConfig.showTimer && (
                <input
                  type="text"
                  value={timeRemaining}
                  onChange={e => updateCurrentGame({ timeRemaining: e.target.value })}
                  className="w-[56px] xs:w-[64px] sm:w-[72px] md:w-[60px] lg:w-[70px] text-center bg-transparent border-b-2 text-sm xs:text-base sm:text-lg md:text-sm lg:text-base xl:text-lg font-mono focus:outline-none font-bold"
                  style={{
                    borderColor: currentTheme.accentColor,
                    color: currentTheme.textColor,
                  }}
                />
              )}
            </div>
          )}

          {/* Away Team Score */}
          <div className="flex flex-col items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-1 lg:gap-1.5">
            <div className="flex flex-col items-center gap-0.5 xs:gap-1 sm:gap-1 md:gap-0.5 lg:gap-1 w-full shrink-0">
              <input
                type="text"
                value={awayTeam.displayName || awayTeam.teamName}
                onChange={(e) => updateTeamDetails('away', 'displayName', e.target.value)}
                placeholder={awayTeam.teamName}
                className="text-sm xs:text-base sm:text-base md:text-sm lg:text-base font-bold text-center w-full px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-opacity-50 hover:bg-black/5 transition-colors"
                style={{ 
                  fontFamily: currentTheme.headerFont,
                  color: currentTheme.textColor,
                  textAlign: 'center',
                  '--tw-ring-color': currentTheme.accentColor + '50'
                } as React.CSSProperties & { '--tw-ring-color'?: string }}
                title={`Full name: ${awayTeam.teamName}`}
              />
              {(settings.scoreboardConfig.showRecord || settings.scoreboardConfig.showStanding) && (
                <div className="flex flex-col gap-0.5 xs:gap-0.5 sm:gap-1 md:gap-0.5 lg:gap-1 items-center justify-center text-[9px] xs:text-[10px] sm:text-xs md:text-[9px] lg:text-[10px] w-full">
                  {settings.scoreboardConfig.showRecord && (
                    <input
                      type="text"
                      placeholder="R"
                      value={awayTeam.record || ''}
                      onChange={(e) => updateTeamDetails('away', 'record', e.target.value)}
                      className="w-full max-w-[60px] xs:max-w-[70px] sm:max-w-[80px] md:max-w-[65px] lg:max-w-[75px] px-0.5 py-0 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        textAlign: 'center'
                      }}
                    />
                  )}
                  {settings.scoreboardConfig.showStanding && (
                    <input
                      type="text"
                      placeholder="S"
                      value={awayTeam.standing || ''}
                      onChange={(e) => updateTeamDetails('away', 'standing', e.target.value)}
                      className="w-full max-w-[80px] xs:max-w-[90px] sm:max-w-[100px] md:max-w-[85px] lg:max-w-[95px] px-0.5 py-0 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        textAlign: 'center'
                      }}
                    />
                  )}
                </div>
              )}
            </div>
            <div
              ref={awayScoreBoxRef}
              className="w-[65px] xs:w-[75px] sm:w-[90px] md:w-[90px] lg:w-[100px] xl:w-[110px] aspect-square rounded-lg flex flex-col items-center justify-center relative overflow-hidden shadow-lg shrink-0"
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
    </div>
  );

  const renderActionBar = () => (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-2 md:mb-2 lg:mb-2 gap-3 md:gap-2 lg:gap-3 p-2 sm:p-3 md:p-2 lg:p-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap w-full md:w-auto justify-center md:justify-start gap-2 md:gap-1.5 lg:gap-2">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="px-2 sm:px-3 md:px-1.5 lg:px-2 py-1.5 md:py-1 lg:py-1.5 rounded-lg text-[11px] sm:text-xs md:text-[10px] lg:text-xs font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          className="px-2 sm:px-3 md:px-1.5 lg:px-2 py-1.5 md:py-1 lg:py-1.5 rounded-lg text-[11px] sm:text-xs md:text-[10px] lg:text-xs font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          className="px-2 sm:px-3 md:px-1.5 lg:px-2 py-1.5 md:py-1 lg:py-1.5 rounded-lg text-[11px] sm:text-xs md:text-[10px] lg:text-xs font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          className="px-2 sm:px-3 md:px-1.5 lg:px-2 py-1.5 md:py-1 lg:py-1.5 rounded-lg text-[11px] sm:text-xs md:text-[10px] lg:text-xs font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          className="px-2 sm:px-3 md:px-1.5 lg:px-2 py-1.5 md:py-1 lg:py-1.5 rounded-lg text-[11px] sm:text-xs md:text-[10px] lg:text-xs font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          className="px-2 sm:px-3 md:px-1.5 lg:px-2 py-1.5 md:py-1 lg:py-1.5 rounded-lg text-[11px] sm:text-xs md:text-[10px] lg:text-xs font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          className="px-2 sm:px-3 md:px-1.5 lg:px-2 py-1.5 md:py-1 lg:py-1.5 rounded-lg text-[11px] sm:text-xs md:text-[10px] lg:text-xs font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
      
      <p className="hidden sm:block text-[10px] md:text-[9px] lg:text-xs text-center order-last md:order-none opacity-60 px-2" style={{ color: currentTheme.textSecondary }}>
        Click to add • Shift+Click to subtract
      </p>

      <button
        onClick={() => setShowEndConfirm(true)}
        className="w-full md:w-auto px-3 md:px-2 lg:px-3 py-2 md:py-1 lg:py-1.5 rounded-lg text-xs md:text-[10px] lg:text-xs font-medium transition-all hover:scale-105"
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
      {/* Standard Layout */}
        <>
          {/* Mobile: Sticky Header */}
          <div
            className="md:hidden sticky top-0 z-40 shadow-sm w-full overflow-hidden"
            style={{ backgroundColor: currentTheme.secondaryBackground }}
          >
            <div className="w-full overflow-x-auto overflow-y-visible">
              <div className="min-w-0 px-1 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2">
                {renderScoreboard()}

                {/* Target Score Bar */}
                {showTargetBar && currentGame.targetScore && (
                  <div 
                    className="flex justify-center w-full mt-1 xs:mt-1.5 sm:mt-2 pt-1 xs:pt-1.5 sm:pt-2"
                    style={{ 
                      backgroundColor: currentTheme.secondaryBackground
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
            </div>
          </div>

          <div className="max-w-full mx-auto px-2 sm:px-3 md:px-3 lg:px-4 py-2 md:py-2 lg:py-3 w-full overflow-x-hidden">
            {renderActionBar()}

            {/* Desktop: Wrapper for Tables and Target Bar */}
            <div className="hidden md:flex md:flex-col" style={{ height: showTargetBar && currentGame.targetScore ? 'calc(100vh - 120px)' : 'calc(100vh - 80px)', minHeight: 0 }}>
              {/* Desktop: Three Column Layout - Home Stats | Scoreboard | Away Stats */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 lg:gap-3 items-start flex-1 min-h-0">
                {/* Home Team Stats */}
                <div className="min-h-0 overflow-x-auto overflow-y-auto flex flex-col h-full">
                  {renderTeamStats(homeTeam, 'home', true)}
                </div>

                {/* Scoreboard Section - Middle */}
                <div className="flex flex-col items-center justify-center sticky top-4 self-start w-[280px] md:w-[280px] lg:w-[320px] xl:w-[360px] h-full shrink-0">
                <div 
                  className="rounded-lg p-2 lg:p-3 shadow-xl w-full flex flex-col"
                  style={{ backgroundColor: currentTheme.secondaryBackground }}
                >
                  {/* Game Title Input */}
                  {settings.scoreboardConfig.showTitle && (
                    <div className="flex justify-center mb-2 lg:mb-2.5 shrink-0">
                      <input
                        type="text"
                        placeholder="Game Title"
                        value={currentGame.title || ''}
                        onChange={(e) => updateCurrentGame({ title: e.target.value })}
                        className="text-center bg-transparent border-transparent hover:border-white/10 focus:border-white/20 border rounded px-2 lg:px-2.5 py-0.5 lg:py-1 w-full max-w-full transition-colors focus:outline-none placeholder-white/20 font-bold text-[10px] lg:text-xs"
                        style={{
                          color: '#ffffff',
                          fontFamily: currentTheme.headerFont,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      />
                    </div>
                  )}

                  {/* Desktop Scoreboard Layout - Horizontal */}
                  <div className="flex items-center justify-center gap-2 lg:gap-2.5 shrink-0">
                    {/* Home Team Score - Left Side */}
                    <div className="flex flex-col items-center gap-1 lg:gap-1.5 flex-1 min-w-0">
                      <div className="flex flex-col items-center gap-0.5 lg:gap-1 w-full shrink-0">
                        <input
                          type="text"
                          value={homeTeam.displayName || homeTeam.teamName}
                          onChange={(e) => updateTeamDetails('home', 'displayName', e.target.value)}
                          placeholder={homeTeam.teamName}
                          className="text-sm lg:text-base font-bold text-center w-full px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-opacity-50 hover:bg-black/5 transition-colors"
                          style={{ 
                            fontFamily: currentTheme.headerFont,
                            color: currentTheme.textColor,
                            textAlign: 'center',
                            '--tw-ring-color': currentTheme.accentColor + '50'
                          } as React.CSSProperties & { '--tw-ring-color'?: string }}
                          title={`Full name: ${homeTeam.teamName}`}
                        />
                        {(settings.scoreboardConfig.showRecord || settings.scoreboardConfig.showStanding) && (
                          <div className="flex flex-col gap-0.5 lg:gap-1 items-center justify-center text-[8px] lg:text-[9px] w-full">
                            {settings.scoreboardConfig.showRecord && (
                              <input
                                type="text"
                                placeholder="R"
                                value={homeTeam.record || ''}
                                onChange={(e) => updateTeamDetails('home', 'record', e.target.value)}
                                className="w-full max-w-[60px] lg:max-w-[75px] px-0.5 py-0 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                                style={{ 
                                  color: currentTheme.textSecondary,
                                  fontFamily: currentTheme.headerFont,
                                  textAlign: 'center'
                                }}
                              />
                            )}
                            {settings.scoreboardConfig.showStanding && (
                              <input
                                type="text"
                                placeholder="S"
                                value={homeTeam.standing || ''}
                                onChange={(e) => updateTeamDetails('home', 'standing', e.target.value)}
                                className="w-full max-w-[80px] lg:max-w-[95px] px-0.5 py-0 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                                style={{ 
                                  color: currentTheme.textSecondary,
                                  fontFamily: currentTheme.headerFont,
                                  textAlign: 'center'
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <div
                        ref={homeScoreBoxRef}
                        className="w-[90px] lg:w-[100px] xl:w-[110px] aspect-square rounded-lg flex flex-col items-center justify-center relative overflow-hidden shadow-lg shrink-0"
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
                    </div>

                    {/* Center - Quarter, Timer, Target */}
                    <div className="flex flex-col items-center gap-1 lg:gap-1.5 shrink-0">
                      {settings.scoreboardConfig.showQuarter && (
                        <div className="flex items-center gap-1 lg:gap-1.5">
                          <button
                            onClick={() => handleQuarterChange(-1)}
                            className="w-5 h-5 lg:w-6 lg:h-6 rounded-full transition-all hover:scale-110 flex items-center justify-center bg-black/5 hover:bg-black/10 active:scale-95 shrink-0"
                            style={{
                              color: currentTheme.accentColor,
                            }}
                            disabled={quarter <= 1}
                          >
                            <span className="text-xs lg:text-sm">◀</span>
                          </button>
                          <span
                            className="text-sm lg:text-base xl:text-lg font-black px-1 lg:px-1.5 min-w-[2.5ch]"
                            style={{ fontFamily: currentTheme.numberFont }}
                          >
                            Q{quarter}
                          </span>
                          <button
                            onClick={() => handleQuarterChange(1)}
                            className="w-5 h-5 lg:w-6 lg:h-6 rounded-full transition-all hover:scale-110 flex items-center justify-center bg-black/5 hover:bg-black/10 active:scale-95 shrink-0"
                            style={{
                              color: currentTheme.accentColor,
                            }}
                            disabled={quarter >= 4}
                          >
                            <span className="text-xs lg:text-sm">▶</span>
                          </button>
                        </div>
                      )}
                      {settings.scoreboardConfig.showTimer && (
                        <input
                          type="text"
                          value={timeRemaining}
                          onChange={e => updateCurrentGame({ timeRemaining: e.target.value })}
                          className="w-[60px] lg:w-[70px] text-center bg-transparent border-b-2 text-sm lg:text-base xl:text-lg font-mono focus:outline-none font-bold"
                          style={{
                            borderColor: currentTheme.accentColor,
                            color: currentTheme.textColor,
                          }}
                        />
                      )}
                    </div>

                    {/* Away Team Score - Right Side */}
                    <div className="flex flex-col items-center gap-1 lg:gap-1.5 flex-1 min-w-0">
                      <div className="flex flex-col items-center gap-0.5 lg:gap-1 w-full shrink-0">
                        <input
                          type="text"
                          value={awayTeam.displayName || awayTeam.teamName}
                          onChange={(e) => updateTeamDetails('away', 'displayName', e.target.value)}
                          placeholder={awayTeam.teamName}
                          className="text-sm lg:text-base font-bold text-center w-full px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-opacity-50 hover:bg-black/5 transition-colors"
                          style={{ 
                            fontFamily: currentTheme.headerFont,
                            color: currentTheme.textColor,
                            textAlign: 'center',
                            '--tw-ring-color': currentTheme.accentColor + '50'
                          } as React.CSSProperties & { '--tw-ring-color'?: string }}
                          title={`Full name: ${awayTeam.teamName}`}
                        />
                        {(settings.scoreboardConfig.showRecord || settings.scoreboardConfig.showStanding) && (
                          <div className="flex flex-col gap-0.5 lg:gap-1 items-center justify-center text-[8px] lg:text-[9px] w-full">
                            {settings.scoreboardConfig.showRecord && (
                              <input
                                type="text"
                                placeholder="R"
                                value={awayTeam.record || ''}
                                onChange={(e) => updateTeamDetails('away', 'record', e.target.value)}
                                className="w-full max-w-[60px] lg:max-w-[75px] px-0.5 py-0 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                                style={{ 
                                  color: currentTheme.textSecondary,
                                  fontFamily: currentTheme.headerFont,
                                  textAlign: 'center'
                                }}
                              />
                            )}
                            {settings.scoreboardConfig.showStanding && (
                              <input
                                type="text"
                                placeholder="S"
                                value={awayTeam.standing || ''}
                                onChange={(e) => updateTeamDetails('away', 'standing', e.target.value)}
                                className="w-full max-w-[80px] lg:max-w-[95px] px-0.5 py-0 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                                style={{ 
                                  color: currentTheme.textSecondary,
                                  fontFamily: currentTheme.headerFont,
                                  textAlign: 'center'
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <div
                        ref={awayScoreBoxRef}
                        className="w-[90px] lg:w-[100px] xl:w-[110px] aspect-square rounded-lg flex flex-col items-center justify-center relative overflow-hidden shadow-lg shrink-0"
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
              </div>

                {/* Away Team Stats */}
                <div className="min-h-0 overflow-x-auto overflow-y-auto flex flex-col h-full">
                  {renderTeamStats(awayTeam, 'away', false)}
                </div>
              </div>

              {/* Desktop: Target Score Bar - Full Width Below Tables */}
              {showTargetBar && currentGame.targetScore && (
                <div className="flex justify-center w-full mt-2 lg:mt-3 shrink-0">
                  <div className="w-full">
                    <TargetScoreBar
                      homeScore={homeScore}
                      awayScore={awayScore}
                      targetScore={currentGame.targetScore}
                      homeColor={homeTeam.primaryColor}
                      awayColor={awayTeam.primaryColor}
                      theme={currentTheme}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: Two Column Layout */}
            <div className="md:hidden grid grid-cols-1 gap-4 sm:gap-5">
              {renderTeamStats(homeTeam, 'home', true)}
              {renderTeamStats(awayTeam, 'away', false)}
            </div>
          </div>

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
      </>
    </div>
  );
}

