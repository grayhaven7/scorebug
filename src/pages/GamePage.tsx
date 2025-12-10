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

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [confettiShown, setConfettiShown] = useState<string | null>(null);
  const [expandedStats, setExpandedStats] = useState<{ home: boolean; away: boolean }>({ home: false, away: false });
  const homeScoreBoxRef = useRef<HTMLDivElement>(null);
  const awayScoreBoxRef = useRef<HTMLDivElement>(null);
  const mobileScoreboardRef = useRef<HTMLDivElement>(null);
  const desktopScoreboardRef = useRef<HTMLDivElement>(null);

  const homeFontSize = useScaledFontSize(homeScoreBoxRef);
  const awayFontSize = useScaledFontSize(awayScoreBoxRef);
  const [fontSizes, setFontSizes] = useState({
    title: '32px',
    teamName: '48px',
    record: '26px',
    standing: '26px',
    timer: '32px',
    quarter: '44px',
  });

  useEffect(() => {
    const clampSize = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const updateFonts = () => {
      // Use scoreboard container width to scale everything together
      const widths: number[] = [];
      if (desktopScoreboardRef.current?.offsetWidth) widths.push(desktopScoreboardRef.current.offsetWidth);
      if (mobileScoreboardRef.current?.offsetWidth) widths.push(mobileScoreboardRef.current.offsetWidth);
      const containerWidth = widths.length ? Math.max(...widths) : 720;
      
      // Wider scale range so fonts actually change noticeably (0.7 to 1.4 = 2x range)
      const scale = clampSize(containerWidth / 720, 0.7, 1.4);
      
      // Calculate base sizes - records and standings use the SAME size as team names
      const teamNameSize = clampSize(24 * scale, 18, 42);

      setFontSizes({
        title: `${clampSize(28 * scale, 20, 48)}px`,
        teamName: `${teamNameSize}px`,
        record: `${teamNameSize}px`,
        standing: `${teamNameSize}px`,
        timer: `${clampSize(22 * scale, 18, 36)}px`,
        quarter: `${clampSize(26 * scale, 20, 44)}px`,
      });
    };

    updateFonts();
    const t1 = setTimeout(updateFonts, 50);
    const t2 = setTimeout(updateFonts, 200);

    window.addEventListener('resize', updateFonts);

    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateFonts);
      if (desktopScoreboardRef.current) resizeObserver.observe(desktopScoreboardRef.current);
      if (mobileScoreboardRef.current) resizeObserver.observe(mobileScoreboardRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', updateFonts);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [expandedStats]);

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
  const homeFouls = calculateTotal(homeTeam.players, 'fouls');
  const awayFouls = calculateTotal(awayTeam.players, 'fouls');

  // Get enabled stats
  const enabledStats = Object.entries(settings.statsConfig)
    .filter(([, enabled]) => enabled)
    .map(([stat]) => stat as StatType);

  const showFouls = enabledStats.includes('fouls');
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

  // Handle foul dot click - increments foul count (cycles 0->1->2->3->4->5->0)
  const handleFoulDotClick = (
    teamType: 'home' | 'away',
    playerId: string
  ) => {
    if (!currentGame) return;
    
    const player = teamType === 'home' 
      ? currentGame.homeTeam.players.find(p => p.playerId === playerId)
      : currentGame.awayTeam.players.find(p => p.playerId === playerId);
    
    if (!player) return;
    
    const currentFouls = typeof player.fouls === 'number' ? Math.max(0, Math.min(5, player.fouls)) : 0;
    // Cycle: 0->1->2->3->4->5->0
    const newFouls = currentFouls >= 5 ? 0 : currentFouls + 1;
    updatePlayerStat(teamType, playerId, 'fouls', newFouls - currentFouls);
  };

  // Render player stat table
  const renderTeamStats = (
    team: typeof homeTeam,
    teamType: 'home' | 'away',
    isHome: boolean
  ) => {
    const isExpanded = expandedStats[teamType];
    const visibleStats = isExpanded 
      ? enabledStats.filter(stat => stat !== 'fouls') // Exclude fouls from stats loop
      : enabledStats.filter(stat => stat === 'points');
    const showFouls = enabledStats.includes('fouls');
    
    return (
    <div
      className="rounded-xl overflow-hidden h-full flex flex-col"
      style={{ backgroundColor: currentTheme.secondaryBackground }}
    >
      {/* Team Header */}
      <div
        className="px-2 sm:px-3 md:px-2 lg:px-2.5"
        style={{
          backgroundColor: team.primaryColor,
          color: team.secondaryColor,
          paddingTop: 'clamp(0.25rem, 1vh + 0.2rem, 0.5rem)',
          paddingBottom: 'clamp(0.25rem, 1vh + 0.2rem, 0.5rem)',
        }}
      >
        <div className="flex items-center" style={{ 
          gap: 'clamp(0.5rem, 1vw + 0.3rem, 0.75rem)',
          marginBottom: 'clamp(0.125rem, 0.5vh + 0.1rem, 0.5rem)'
        }}>
            {/* Mobile: Both teams have [Toggle] [Team Name] [HOME/AWAY] */}
            {/* Desktop: Home team [Toggle] [Team Name] [HOME], Away team [AWAY] [Team Name] [Toggle] */}
            {/* Mobile layout - same for both teams */}
            <div className="flex items-center md:hidden w-full" style={{ 
              gap: 'clamp(0.5rem, 1vw + 0.3rem, 0.75rem)'
            }}>
              <button
                onClick={() => {
                  const newState = !expandedStats[teamType];
                  setExpandedStats({ home: newState, away: newState });
                }}
                className="rounded font-medium transition-all hover:opacity-80 shrink-0"
                style={{
                  backgroundColor: team.secondaryColor + '30',
                  color: team.secondaryColor,
                  borderRadius: currentTheme.borderRadius,
                  fontSize: 'clamp(0.5rem, 0.8vw + 0.3rem, 0.75rem)',
                  padding: 'clamp(0.125rem, 0.5vh + 0.1rem, 0.375rem) clamp(0.375rem, 0.8vw + 0.2rem, 0.5rem)'
                }}
                title={isExpanded ? 'Collapse stats' : 'Expand stats'}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
              <span
                className="font-bold tracking-wide truncate flex-1 min-w-0 text-center"
                style={{ 
                  fontFamily: currentTheme.headerFont,
                  fontSize: 'clamp(0.625rem, 1vw + 0.4rem, 1rem)'
                }}
              >
                {team.teamName}
              </span>
              <span className="opacity-80 shrink-0" style={{ fontSize: 'clamp(0.5rem, 0.8vw + 0.3rem, 0.75rem)' }}>
                {isHome ? 'HOME' : 'AWAY'}
              </span>
            </div>
            
            {/* Desktop layout - symmetrical */}
            <div className="hidden md:flex items-center w-full" style={{ 
              gap: 'clamp(0.5rem, 1vw + 0.3rem, 0.75rem)'
            }}>
              {isHome ? (
                <>
                  <button
                    onClick={() => {
                      const newState = !expandedStats[teamType];
                      setExpandedStats({ home: newState, away: newState });
                    }}
                    className="rounded font-medium transition-all hover:opacity-80 shrink-0"
                    style={{
                      backgroundColor: team.secondaryColor + '30',
                      color: team.secondaryColor,
                      borderRadius: currentTheme.borderRadius,
                      fontSize: 'clamp(0.5rem, 0.8vw + 0.3rem, 0.75rem)',
                      padding: 'clamp(0.125rem, 0.5vh + 0.1rem, 0.375rem) clamp(0.375rem, 0.8vw + 0.2rem, 0.5rem)'
                    }}
                    title={isExpanded ? 'Collapse stats' : 'Expand stats'}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                  <span
                    className="font-bold tracking-wide truncate flex-1 min-w-0 text-center"
                    style={{ 
                      fontFamily: currentTheme.headerFont,
                      fontSize: 'clamp(0.625rem, 1vw + 0.4rem, 1rem)'
                    }}
                  >
                    {team.teamName}
                  </span>
                  <span className="opacity-80 shrink-0" style={{ fontSize: 'clamp(0.5rem, 0.8vw + 0.3rem, 0.75rem)' }}>
                    HOME
                  </span>
                </>
              ) : (
                <>
                  <span className="opacity-80 shrink-0" style={{ fontSize: 'clamp(0.5rem, 0.8vw + 0.3rem, 0.75rem)' }}>
                    AWAY
                  </span>
                  <span
                    className="font-bold tracking-wide truncate flex-1 min-w-0 text-center"
                    style={{ 
                      fontFamily: currentTheme.headerFont,
                      fontSize: 'clamp(0.625rem, 1vw + 0.4rem, 1rem)'
                    }}
                  >
                    {team.teamName}
                  </span>
                  <button
                    onClick={() => {
                      const newState = !expandedStats[teamType];
                      setExpandedStats({ home: newState, away: newState });
                    }}
                    className="rounded font-medium transition-all hover:opacity-80 shrink-0"
                    style={{
                      backgroundColor: team.secondaryColor + '30',
                      color: team.secondaryColor,
                      borderRadius: currentTheme.borderRadius,
                      fontSize: 'clamp(0.5rem, 0.8vw + 0.3rem, 0.75rem)',
                      padding: 'clamp(0.125rem, 0.5vh + 0.1rem, 0.375rem) clamp(0.375rem, 0.8vw + 0.2rem, 0.5rem)'
                    }}
                    title={isExpanded ? 'Collapse stats' : 'Expand stats'}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                </>
              )}
            </div>
        </div>
        
      </div>

      {/* Stats Table */}
      <div className="flex-1 min-h-0" style={{ 
        width: '100%', 
        overflowX: isExpanded ? 'auto' : 'hidden',
        overflowY: 'auto'
      }}>
        <table style={{ 
          width: '100%', 
          tableLayout: isExpanded ? 'auto' : 'fixed',
          whiteSpace: 'nowrap' 
        }}>
          <thead>
            <tr style={{ backgroundColor: currentTheme.backgroundColor }}>
              <th
                className="text-left font-medium"
                style={{ 
                  color: currentTheme.textSecondary,
                  fontSize: 'clamp(0.5rem, 1.2vw + 0.3rem, 0.875rem)',
                  paddingTop: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                  paddingBottom: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                  paddingLeft: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)',
                  paddingRight: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)',
                  width: isExpanded ? 'auto' : '60px'
                }}
              >
                #
              </th>
              <th
                className="text-left font-medium"
                style={{ 
                  color: currentTheme.textSecondary,
                  fontSize: 'clamp(0.5rem, 1.2vw + 0.3rem, 0.875rem)',
                  paddingTop: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                  paddingBottom: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                  paddingLeft: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)',
                  paddingRight: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)',
                  width: isExpanded ? 'auto' : 'auto'
                }}
              >
                PLAYER
              </th>
              {showFouls && (
                <th
                  className="text-center font-medium"
                  style={{ 
                    color: currentTheme.textSecondary,
                    fontSize: 'clamp(0.5rem, 1.2vw + 0.3rem, 0.875rem)',
                    paddingTop: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                    paddingBottom: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                    paddingLeft: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)',
                    paddingRight: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)',
                    width: isExpanded ? 'auto' : '80px'
                  }}
                >
                  PF
                </th>
              )}
              {visibleStats.map(stat => (
                <th
                  key={stat}
                  colSpan={stat === 'points' && settings.scoreboardConfig.showQuickPoints ? 2 : 1}
                  className="text-center font-medium"
                  style={{ 
                    color: currentTheme.textSecondary,
                    fontSize: 'clamp(0.5rem, 1.2vw + 0.3rem, 0.875rem)',
                    paddingTop: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                    paddingBottom: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                    paddingLeft: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)',
                    paddingRight: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)',
                    width: isExpanded ? 'auto' : (stat === 'points' && settings.scoreboardConfig.showQuickPoints 
                      ? '200px'
                      : '80px')
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
                <td style={{ 
                  paddingTop: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                  paddingBottom: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                  paddingLeft: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)',
                  paddingRight: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)'
                }}>
                  <span
                    className="inline-block rounded text-center font-bold"
                    style={{
                      backgroundColor: team.primaryColor,
                      color: team.secondaryColor,
                      fontSize: 'clamp(0.6rem, 1.2vw + 0.4rem, 1.125rem)',
                      width: 'clamp(1.5rem, 2.5vw + 0.8rem, 2.5rem)',
                      height: 'clamp(1.5rem, 2.5vw + 0.8rem, 2.5rem)',
                      lineHeight: 'clamp(1.5rem, 2.5vw + 0.8rem, 2.5rem)',
                    }}
                  >
                    {player.jerseyNumber}
                  </span>
                </td>
                <td 
                  className="font-medium"
                  style={{
                    fontSize: settings.scoreboardConfig.showQuickPoints 
                      ? 'clamp(0.5rem, 0.9vw + 0.3rem, 0.875rem)'
                      : 'clamp(0.6rem, 1.2vw + 0.4rem, 1.125rem)',
                    paddingTop: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                    paddingBottom: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                    paddingLeft: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)',
                    paddingRight: 'clamp(0.25rem, 0.8vw + 0.2rem, 0.625rem)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {player.playerName}
                </td>
                {showFouls && (
                  <td 
                    className="text-center"
                    style={{
                      paddingTop: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                      paddingBottom: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                      paddingLeft: 'clamp(0.125rem, 0.6vw + 0.15rem, 0.75rem)',
                      paddingRight: 'clamp(0.125rem, 0.6vw + 0.15rem, 0.75rem)'
                    }}
                  >
                    <button
                      onClick={() => handleFoulDotClick(teamType, player.playerId)}
                      className="flex items-center justify-center gap-0.5 transition-all hover:scale-110 cursor-pointer"
                      style={{ gap: 'clamp(0.125rem, 0.3vw + 0.1rem, 0.375rem)' }}
                      title="Click to increment fouls"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const foulCount = typeof player.fouls === 'number' ? Math.max(0, player.fouls) : 0;
                        const isLit = i < foulCount;
                        const isFifthFoul = i === 4;
                        return (
                          <span
                            key={i}
                            style={{
                              color: isLit 
                                ? (isFifthFoul ? team.primaryColor : currentTheme.accentColor)
                                : currentTheme.textSecondary + '40',
                              fontSize: 'clamp(1rem, 2vw + 0.5rem, 1.75rem)',
                              opacity: isLit ? 1 : 0.3,
                              fontWeight: 'bold',
                            }}
                          >
                            •
                          </span>
                        );
                      })}
                    </button>
                  </td>
                )}
                {visibleStats.map(stat => {
                  const value = player[stat as keyof PlayerGameStats];
                  return (
                    <>
                      <td 
                        key={stat} 
                        className="text-center"
                        style={{
                          paddingTop: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                          paddingBottom: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                          paddingLeft: 'clamp(0.125rem, 0.6vw + 0.15rem, 0.75rem)',
                          paddingRight: 'clamp(0.125rem, 0.6vw + 0.15rem, 0.75rem)'
                        }}
                      >
                        <button
                          onClick={e => handleStatClick(teamType, player.playerId, stat as keyof PlayerGameStats, e)}
                          className="rounded font-bold transition-all hover:scale-110 cursor-pointer flex items-center justify-center gap-0.5"
                          style={{
                            backgroundColor: currentTheme.accentColor + '20',
                            color: currentTheme.accentColor,
                            borderRadius: currentTheme.borderRadius,
                            fontSize: 'clamp(0.7rem, 1.5vw + 0.4rem, 1.25rem)',
                            width: 'clamp(1.75rem, 3vw + 1rem, 3rem)',
                            height: 'clamp(1.75rem, 3vw + 1rem, 3rem)',
                          }}
                          title="Click to add, Shift+Click to subtract"
                        >
                          {typeof value === 'number' ? value : 0}
                        </button>
                      </td>
                      {stat === 'points' && settings.scoreboardConfig.showQuickPoints && (
                        <td 
                          className="text-center"
                          style={{
                            paddingTop: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                            paddingBottom: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                            paddingLeft: 'clamp(0.125rem, 0.6vw + 0.15rem, 0.75rem)',
                            paddingRight: 'clamp(0.125rem, 0.6vw + 0.15rem, 0.75rem)',
                            minWidth: 'clamp(5rem, 8vw + 3rem, 7.5rem)'
                          }}
                        >
                          <div className="flex justify-center" style={{ gap: 'clamp(0.125rem, 0.5vw + 0.15rem, 0.5rem)' }}>
                            {[1, 2, 3].map(pts => (
                              <button
                                key={pts}
                                onClick={() => updatePlayerStat(teamType, player.playerId, 'points', pts)}
                                className="rounded font-bold transition-all hover:scale-110 hover:brightness-110 flex items-center justify-center"
                                style={{
                                  backgroundColor: team.primaryColor,
                                  color: team.secondaryColor,
                                  borderRadius: currentTheme.borderRadius,
                                  opacity: 0.9,
                                  fontSize: 'clamp(0.5rem, 0.9vw + 0.3rem, 0.875rem)',
                                  width: 'clamp(1.5rem, 2vw + 0.8rem, 2.5rem)',
                                  height: 'clamp(1.75rem, 2.5vw + 1rem, 3rem)',
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
              <td style={{ 
                paddingTop: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                paddingBottom: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                paddingLeft: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)',
                paddingRight: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)'
              }}></td>
              <td 
                className="font-bold" 
                style={{ 
                  fontFamily: currentTheme.headerFont,
                  fontSize: 'clamp(0.7rem, 1.2vw + 0.4rem, 1.25rem)',
                  paddingTop: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                  paddingBottom: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                  paddingLeft: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)',
                  paddingRight: 'clamp(0.25rem, 1vw + 0.2rem, 1rem)'
                }}
              >
                TOTAL
              </td>
              {visibleStats.map(stat => (
                <td 
                  key={stat} 
                  colSpan={stat === 'points' && settings.scoreboardConfig.showQuickPoints ? 2 : 1} 
                  className="text-center"
                  style={{
                    paddingTop: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                    paddingBottom: 'clamp(0.125rem, 0.8vh + 0.1rem, 0.5rem)',
                    paddingLeft: 'clamp(0.125rem, 0.6vw + 0.15rem, 0.75rem)',
                    paddingRight: 'clamp(0.125rem, 0.6vw + 0.15rem, 0.75rem)'
                  }}
                >
                  <span
                    className="inline-block rounded font-bold flex items-center justify-center gap-0.5"
                    style={{
                      backgroundColor: team.primaryColor,
                      color: team.secondaryColor,
                      borderRadius: currentTheme.borderRadius,
                      fontSize: 'clamp(0.7rem, 1.5vw + 0.4rem, 1.25rem)',
                      height: 'clamp(1.5rem, 2.5vw + 0.8rem, 2.5rem)',
                      lineHeight: 'clamp(1.5rem, 2.5vw + 0.8rem, 2.5rem)',
                      padding: '0 clamp(0.375rem, 1vw + 0.2rem, 1.25rem)'
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
    <div ref={mobileScoreboardRef} className="w-full min-w-0 flex flex-col">
      {/* Game Title Input */}
      {settings.scoreboardConfig.showTitle && (
        <div className="flex justify-center px-1 xs:px-2 sm:px-2 pb-1 xs:pb-1.5 sm:pb-2 shrink-0">
          <input
            type="text"
            data-scoreboard-input
            placeholder="Game Title (e.g. Game 4 of Season)"
            value={currentGame.title || ''}
            onChange={(e) => updateCurrentGame({ title: e.target.value })}
            className="text-center bg-transparent border-transparent hover:border-white/10 focus:border-white/20 border rounded px-2 xs:px-2.5 sm:px-3 md:px-4 py-1 xs:py-1 sm:py-1.5 w-full max-w-[280px] xs:max-w-[320px] sm:max-w-md transition-colors focus:outline-none placeholder-white/20 font-bold"
                          style={{
                            color: '#ffffff',
                            fontFamily: currentTheme.headerFont,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            fontSize: fontSizes.title,
                            lineHeight: '1.1',
                            '--dynamic-font-size': fontSizes.title,
                          } as React.CSSProperties & { '--dynamic-font-size'?: string }}
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
                data-scoreboard-input
                value={homeTeam.displayName || homeTeam.teamName}
                onChange={(e) => updateTeamDetails('home', 'displayName', e.target.value)}
                placeholder={homeTeam.teamName}
                className="font-bold text-center w-full px-2 py-1 rounded border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-opacity-50 hover:bg-black/5 transition-colors leading-none"
                style={{
                  fontFamily: currentTheme.headerFont,
                  color: currentTheme.textColor,
                  textAlign: 'center',
                  '--tw-ring-color': currentTheme.accentColor + '50',
                  fontSize: fontSizes.teamName,
                  lineHeight: '1.05',
                  '--dynamic-font-size': fontSizes.teamName,
                } as React.CSSProperties & { '--tw-ring-color'?: string; '--dynamic-font-size'?: string }}
                title={`Full name: ${homeTeam.teamName}`}
              />
              {(settings.scoreboardConfig.showRecord || settings.scoreboardConfig.showStanding) && (
                <div className="flex flex-col gap-0.5 xs:gap-0.5 sm:gap-1 md:gap-0.5 lg:gap-1 items-center justify-center w-full">
                  {settings.scoreboardConfig.showRecord && (
                    <input
                      type="text"
                      data-scoreboard-input
                      placeholder="R"
                      value={homeTeam.record || ''}
                      onChange={(e) => updateTeamDetails('home', 'record', e.target.value)}
                      className="w-full max-w-[120px] xs:max-w-[140px] sm:max-w-[160px] md:max-w-[130px] lg:max-w-[150px] px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        textAlign: 'center',
                        fontSize: fontSizes.record,
                        lineHeight: '1.05',
                        '--dynamic-font-size': fontSizes.record,
                      } as React.CSSProperties & { '--dynamic-font-size'?: string }}
                    />
                  )}
                  {settings.scoreboardConfig.showStanding && (
                    <input
                      type="text"
                      data-scoreboard-input
                      placeholder="S"
                      value={homeTeam.standing || ''}
                      onChange={(e) => updateTeamDetails('home', 'standing', e.target.value)}
                      className="w-full max-w-[140px] xs:max-w-[160px] sm:max-w-[180px] md:max-w-[150px] lg:max-w-[170px] px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        textAlign: 'center',
                        fontSize: fontSizes.standing,
                        lineHeight: '1.05',
                        '--dynamic-font-size': fontSizes.standing,
                      } as React.CSSProperties & { '--dynamic-font-size'?: string }}
                    />
                  )}
                </div>
              )}
            </div>
            <div
              ref={homeScoreBoxRef}
              className="w-[60px] xs:w-[68px] sm:w-[76px] md:w-[78px] lg:w-[84px] xl:w-[88px] aspect-square rounded-lg flex flex-col items-center justify-center relative overflow-hidden shadow-lg shrink-0"
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
          {(settings.scoreboardConfig.showQuarter || settings.scoreboardConfig.showTimer || showFouls) && (
            <div className="text-center flex flex-col items-center justify-center mx-1 xs:mx-1.5 sm:mx-2 md:mx-2 lg:mx-2.5 shrink-0 min-w-[70px] xs:min-w-[85px] sm:min-w-[100px] md:min-w-[70px] lg:min-w-[80px]">
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
                    className="font-black px-1 xs:px-1.5 sm:px-2 md:px-1 lg:px-1.5 min-w-[2ch]"
                    style={{ fontFamily: currentTheme.numberFont, fontSize: fontSizes.quarter, lineHeight: '1' }}
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
                  data-scoreboard-input
                  value={timeRemaining}
                  onChange={e => updateCurrentGame({ timeRemaining: e.target.value })}
                  className={`text-center bg-transparent border-b-2 font-mono focus:outline-none font-bold py-0.5 leading-none ${showFouls ? 'mb-0.5 xs:mb-0.5 sm:mb-1 md:mb-0.5 lg:mb-1' : ''}`}
                  style={{
                    borderColor: currentTheme.accentColor,
                    color: currentTheme.textColor,
                    fontSize: fontSizes.timer,
                    '--dynamic-font-size': fontSizes.timer,
                    width: 'fit-content',
                    minWidth: '3.5ch',
                    maxWidth: '5ch',
                  } as React.CSSProperties & { '--dynamic-font-size'?: string }}
                />
              )}
              {showFouls && (
                <div className="flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-2 lg:gap-2.5 mt-1 xs:mt-1.5 sm:mt-2 md:mt-1 lg:mt-1.5">
                  <span
                    className="font-bold px-2 xs:px-2.5 sm:px-3 md:px-2 lg:px-2.5 py-0.5 xs:py-0.5 sm:py-1 md:py-0.5 lg:py-0.5 rounded min-w-[2ch] text-center"
                    style={{
                      backgroundColor: homeTeam.primaryColor,
                      color: homeTeam.secondaryColor,
                      fontFamily: currentTheme.numberFont,
                      fontSize: 'clamp(0.75rem, 1.3vw + 0.3rem, 1.1rem)',
                      lineHeight: '1.2',
                    }}
                  >
                    {homeFouls}
                  </span>
                  <span
                    className="text-[10px] xs:text-xs sm:text-sm md:text-xs lg:text-sm opacity-60 font-medium px-0.5"
                    style={{ color: currentTheme.textSecondary }}
                  >
                    PF
                  </span>
                  <span
                    className="font-bold px-2 xs:px-2.5 sm:px-3 md:px-2 lg:px-2.5 py-0.5 xs:py-0.5 sm:py-1 md:py-0.5 lg:py-0.5 rounded min-w-[2ch] text-center"
                    style={{
                      backgroundColor: awayTeam.primaryColor,
                      color: awayTeam.secondaryColor,
                      fontFamily: currentTheme.numberFont,
                      fontSize: 'clamp(0.75rem, 1.3vw + 0.3rem, 1.1rem)',
                      lineHeight: '1.2',
                    }}
                  >
                    {awayFouls}
                  </span>
                </div>
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
                className="font-bold text-center w-full px-2 py-1 rounded border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-opacity-50 hover:bg-black/5 transition-colors"
                style={{
                  fontFamily: currentTheme.headerFont,
                  color: currentTheme.textColor,
                  textAlign: 'center',
                  '--tw-ring-color': currentTheme.accentColor + '50',
                  fontSize: fontSizes.teamName,
                  lineHeight: '1.05',
                  '--dynamic-font-size': fontSizes.teamName,
                } as React.CSSProperties & { '--tw-ring-color'?: string; '--dynamic-font-size'?: string }}
                title={`Full name: ${awayTeam.teamName}`}
              />
              {(settings.scoreboardConfig.showRecord || settings.scoreboardConfig.showStanding) && (
                <div className="flex flex-col gap-0.5 xs:gap-0.5 sm:gap-1 md:gap-0.5 lg:gap-1 items-center justify-center w-full">
                  {settings.scoreboardConfig.showRecord && (
                    <input
                      type="text"
                      data-scoreboard-input
                      placeholder="R"
                      value={awayTeam.record || ''}
                      onChange={(e) => updateTeamDetails('away', 'record', e.target.value)}
                      className="w-full max-w-[120px] xs:max-w-[140px] sm:max-w-[160px] md:max-w-[130px] lg:max-w-[150px] px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        textAlign: 'center',
                        fontSize: fontSizes.record,
                        lineHeight: '1.05',
                        '--dynamic-font-size': fontSizes.record,
                      } as React.CSSProperties & { '--dynamic-font-size'?: string }}
                    />
                  )}
                  {settings.scoreboardConfig.showStanding && (
                    <input
                      type="text"
                      data-scoreboard-input
                      placeholder="S"
                      value={awayTeam.standing || ''}
                      onChange={(e) => updateTeamDetails('away', 'standing', e.target.value)}
                      className="w-full max-w-[140px] xs:max-w-[160px] sm:max-w-[180px] md:max-w-[150px] lg:max-w-[170px] px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        textAlign: 'center',
                        fontSize: fontSizes.standing,
                        lineHeight: '1.05',
                        '--dynamic-font-size': fontSizes.standing,
                      } as React.CSSProperties & { '--dynamic-font-size'?: string }}
                    />
                  )}
                </div>
              )}
            </div>
            <div
              ref={awayScoreBoxRef}
              className="w-[60px] xs:w-[68px] sm:w-[76px] md:w-[78px] lg:w-[84px] xl:w-[88px] aspect-square rounded-lg flex flex-col items-center justify-center relative overflow-hidden shadow-lg shrink-0"
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
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
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

          <div className="max-w-full mx-auto px-2 sm:px-3 md:px-3 lg:px-4 py-2 md:py-2 lg:py-3 w-full" style={{ overflowX: 'hidden' }}>
            {renderActionBar()}

            {/* Desktop: Wrapper for Tables and Target Bar */}
            <div className="hidden md:flex md:flex-col" style={{ height: showTargetBar && currentGame.targetScore ? 'calc(100vh - 120px)' : 'calc(100vh - 80px)', minHeight: 0 }}>
              {/* Desktop: Three Column Layout - Home Stats | Scoreboard | Away Stats */}
              <div className="grid gap-2 lg:gap-3 items-start flex-1 min-h-0" style={{ gridTemplateColumns: 'minmax(400px, 1fr) minmax(260px, auto) minmax(400px, 1fr)', width: '100%', minWidth: 0, overflow: 'hidden' }}>
                {/* Home Team Stats */}
                <div className="min-h-0 flex flex-col h-full" style={{ minWidth: 0, overflow: 'auto' }}>
                  {renderTeamStats(homeTeam, 'home', true)}
                </div>

                {/* Scoreboard Section - Middle */}
                <div className={`flex flex-col items-center justify-center sticky top-4 self-start h-full transition-all duration-300 ${
                  !expandedStats.home && !expandedStats.away
                    ? 'max-w-[380px] md:max-w-[420px] lg:max-w-[480px] xl:max-w-[540px]'
                    : 'max-w-[280px] md:max-w-[280px] lg:max-w-[320px] xl:max-w-[360px]'
                }`} style={{ 
                  width: !expandedStats.home && !expandedStats.away
                    ? 'clamp(260px, 100%, 540px)'
                    : 'clamp(260px, 100%, 360px)',
                  flexShrink: 1,
                  minWidth: '260px'
                }}>
                <div 
                  ref={desktopScoreboardRef}
                  className="rounded-lg shadow-xl w-full flex flex-col transition-all"
                  style={{ 
                    backgroundColor: currentTheme.secondaryBackground,
                    padding: 'clamp(12px, 2vw, 20px)',
                  }}
                >
                  {/* Game Title Input */}
                  {settings.scoreboardConfig.showTitle && (
                    <div className="flex justify-center mb-2 lg:mb-2.5 shrink-0">
                      <input
                        type="text"
                        data-scoreboard-input
                        placeholder="Game Title"
                        value={currentGame.title || ''}
                        onChange={(e) => updateCurrentGame({ title: e.target.value })}
                        className="text-center bg-transparent border-transparent hover:border-white/10 focus:border-white/20 border rounded px-3 lg:px-4 py-1 lg:py-1.5 w-full max-w-full transition-all focus:outline-none placeholder-white/20 font-bold"
                        style={{
                          color: '#ffffff',
                          fontFamily: currentTheme.headerFont,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          fontSize: fontSizes.title,
                          lineHeight: '1.1',
                          '--dynamic-font-size': fontSizes.title,
                        } as React.CSSProperties & { '--dynamic-font-size'?: string }}
                      />
                    </div>
                  )}

                  {/* Desktop Scoreboard Layout - Horizontal */}
                  <div className={`flex items-center justify-center shrink-0 transition-all ${
                    !expandedStats.home && !expandedStats.away
                      ? 'gap-3 lg:gap-4 xl:gap-5'
                      : 'gap-2 lg:gap-2.5'
                  }`} style={{ paddingLeft: 'clamp(8px, 2vw, 16px)', paddingRight: 'clamp(8px, 2vw, 16px)' }}>
                    {/* Home Team Score - Left Side */}
                    <div className={`flex flex-col items-center flex-1 min-w-0 transition-all ${
                      !expandedStats.home && !expandedStats.away
                        ? 'gap-1.5 lg:gap-2 xl:gap-2.5'
                        : 'gap-1 lg:gap-1.5'
                    }`}>
                      <div className={`flex flex-col items-center w-full shrink-0 transition-all ${
                        !expandedStats.home && !expandedStats.away
                          ? 'gap-1 lg:gap-1.5'
                          : 'gap-0.5 lg:gap-1'
                      }`}>
                        <input
                          type="text"
                          data-scoreboard-input
                          value={homeTeam.displayName || homeTeam.teamName}
                          onChange={(e) => updateTeamDetails('home', 'displayName', e.target.value)}
                          placeholder={homeTeam.teamName}
                          className="font-bold text-center w-full px-2 py-1 rounded border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-opacity-50 hover:bg-black/5 transition-all"
                style={{
                  fontFamily: currentTheme.headerFont,
                  color: currentTheme.textColor,
                  textAlign: 'center',
                  '--tw-ring-color': currentTheme.accentColor + '50',
                  fontSize: fontSizes.teamName,
                  lineHeight: '1.05',
                  '--dynamic-font-size': fontSizes.teamName,
                } as React.CSSProperties & { '--tw-ring-color'?: string; '--dynamic-font-size'?: string }}
                          title={`Full name: ${homeTeam.teamName}`}
                        />
                        {(settings.scoreboardConfig.showRecord || settings.scoreboardConfig.showStanding) && (
                          <div className="flex flex-col gap-0.5 lg:gap-1 items-center justify-center w-full transition-all">
                            {settings.scoreboardConfig.showRecord && (
                              <input
                                type="text"
                                data-scoreboard-input
                                placeholder="R"
                                value={homeTeam.record || ''}
                                onChange={(e) => updateTeamDetails('home', 'record', e.target.value)}
                                className={`w-full px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold transition-all ${
                                  !expandedStats.home && !expandedStats.away
                                    ? 'max-w-[130px] lg:max-w-[150px] xl:max-w-[170px]'
                                    : 'max-w-[120px] lg:max-w-[140px]'
                                }`}
                                style={{ 
                                  color: currentTheme.textSecondary,
                                  fontFamily: currentTheme.headerFont,
                                  textAlign: 'center',
                                  fontSize: fontSizes.record,
                                  lineHeight: '1.05',
                                  '--dynamic-font-size': fontSizes.record,
                                } as React.CSSProperties & { '--dynamic-font-size'?: string }}
                              />
                            )}
                            {settings.scoreboardConfig.showStanding && (
                              <input
                                type="text"
                                data-scoreboard-input
                                placeholder="S"
                                value={homeTeam.standing || ''}
                                onChange={(e) => updateTeamDetails('home', 'standing', e.target.value)}
                                className={`w-full px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold transition-all ${
                                  !expandedStats.home && !expandedStats.away
                                    ? 'max-w-[150px] lg:max-w-[170px] xl:max-w-[190px]'
                                    : 'max-w-[140px] lg:max-w-[160px]'
                                }`}
                                style={{ 
                                  color: currentTheme.textSecondary,
                                  fontFamily: currentTheme.headerFont,
                                  textAlign: 'center',
                                  fontSize: fontSizes.standing,
                                  lineHeight: '1.05',
                                  '--dynamic-font-size': fontSizes.standing,
                                } as React.CSSProperties & { '--dynamic-font-size'?: string }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <div
                        ref={homeScoreBoxRef}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center relative overflow-hidden shadow-lg shrink-0 transition-all ${
                          !expandedStats.home && !expandedStats.away
                            ? 'w-[88px] lg:w-[96px] xl:w-[104px]'
                            : 'w-[76px] lg:w-[84px] xl:w-[92px]'
                        }`}
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
                    <div className={`flex flex-col items-center shrink-0 transition-all ${
                      !expandedStats.home && !expandedStats.away
                        ? 'gap-1.5 lg:gap-2 xl:gap-2.5'
                        : 'gap-1 lg:gap-1.5'
                    }`}>
                      {settings.scoreboardConfig.showQuarter && (
                        <div className="flex items-center gap-1 lg:gap-1.5">
                          <button
                            onClick={() => handleQuarterChange(-1)}
                            className={`rounded-full transition-all hover:scale-110 flex items-center justify-center bg-black/5 hover:bg-black/10 active:scale-95 shrink-0 ${
                              !expandedStats.home && !expandedStats.away
                                ? 'w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8'
                                : 'w-5 h-5 lg:w-6 lg:h-6'
                            }`}
                            style={{
                              color: currentTheme.accentColor,
                            }}
                            disabled={quarter <= 1}
                          >
                            <span className={!expandedStats.home && !expandedStats.away ? 'text-sm lg:text-base xl:text-lg' : 'text-xs lg:text-sm'}>◀</span>
                          </button>
                          <span
                            className="font-black px-1 lg:px-1.5 min-w-[2.5ch] transition-all"
                            style={{ fontFamily: currentTheme.numberFont, fontSize: fontSizes.quarter, lineHeight: '1' }}
                          >
                            Q{quarter}
                          </span>
                          <button
                            onClick={() => handleQuarterChange(1)}
                            className={`rounded-full transition-all hover:scale-110 flex items-center justify-center bg-black/5 hover:bg-black/10 active:scale-95 shrink-0 ${
                              !expandedStats.home && !expandedStats.away
                                ? 'w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8'
                                : 'w-5 h-5 lg:w-6 lg:h-6'
                            }`}
                            style={{
                              color: currentTheme.accentColor,
                            }}
                            disabled={quarter >= 4}
                          >
                            <span className={!expandedStats.home && !expandedStats.away ? 'text-sm lg:text-base xl:text-lg' : 'text-xs lg:text-sm'}>▶</span>
                          </button>
                        </div>
                      )}
                      {settings.scoreboardConfig.showTimer && (
                        <input
                          type="text"
                          data-scoreboard-input
                          value={timeRemaining}
                          onChange={e => updateCurrentGame({ timeRemaining: e.target.value })}
                          className="text-center bg-transparent border-b-2 font-mono focus:outline-none font-bold transition-all py-0.5 leading-none"
                          style={{
                            borderColor: currentTheme.accentColor,
                            color: currentTheme.textColor,
                            fontSize: fontSizes.timer,
                            '--dynamic-font-size': fontSizes.timer,
                            width: 'fit-content',
                            minWidth: '3.5ch',
                            maxWidth: '5ch',
                          } as React.CSSProperties & { '--dynamic-font-size'?: string }}
                        />
                      )}
                      {showFouls && (
                        <div className="flex items-center gap-1.5 lg:gap-2 mt-1 lg:mt-1.5">
                          <span
                            className="font-bold px-1.5 lg:px-2 rounded transition-all"
                            style={{
                              backgroundColor: homeTeam.primaryColor,
                              color: homeTeam.secondaryColor,
                              fontFamily: currentTheme.numberFont,
                              fontSize: !expandedStats.home && !expandedStats.away 
                                ? 'clamp(0.75rem, 1.2vw + 0.3rem, 1.1rem)' 
                                : 'clamp(0.7rem, 1vw + 0.3rem, 1rem)',
                            }}
                          >
                            {homeFouls}
                          </span>
                          <span
                            className={`opacity-60 transition-all ${
                              !expandedStats.home && !expandedStats.away
                                ? 'text-xs lg:text-sm'
                                : 'text-[10px] lg:text-xs'
                            }`}
                            style={{ color: currentTheme.textSecondary }}
                          >
                            PF
                          </span>
                          <span
                            className="font-bold px-1.5 lg:px-2 rounded transition-all"
                            style={{
                              backgroundColor: awayTeam.primaryColor,
                              color: awayTeam.secondaryColor,
                              fontFamily: currentTheme.numberFont,
                              fontSize: !expandedStats.home && !expandedStats.away 
                                ? 'clamp(0.75rem, 1.2vw + 0.3rem, 1.1rem)' 
                                : 'clamp(0.7rem, 1vw + 0.3rem, 1rem)',
                            }}
                          >
                            {awayFouls}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Away Team Score - Right Side */}
                    <div className={`flex flex-col items-center flex-1 min-w-0 transition-all ${
                      !expandedStats.home && !expandedStats.away
                        ? 'gap-1.5 lg:gap-2 xl:gap-2.5'
                        : 'gap-1 lg:gap-1.5'
                    }`}>
                      <div className={`flex flex-col items-center w-full shrink-0 transition-all ${
                        !expandedStats.home && !expandedStats.away
                          ? 'gap-1 lg:gap-1.5'
                          : 'gap-0.5 lg:gap-1'
                      }`}>
                        <input
                          type="text"
                          data-scoreboard-input
                          value={awayTeam.displayName || awayTeam.teamName}
                          onChange={(e) => updateTeamDetails('away', 'displayName', e.target.value)}
                          placeholder={awayTeam.teamName}
                          className="font-bold text-center w-full px-2 py-1 rounded border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-opacity-50 hover:bg-black/5 transition-all"
                style={{
                  fontFamily: currentTheme.headerFont,
                  color: currentTheme.textColor,
                  textAlign: 'center',
                  '--tw-ring-color': currentTheme.accentColor + '50',
                  fontSize: fontSizes.teamName,
                  lineHeight: '1.05',
                  '--dynamic-font-size': fontSizes.teamName,
                } as React.CSSProperties & { '--tw-ring-color'?: string; '--dynamic-font-size'?: string }}
                          title={`Full name: ${awayTeam.teamName}`}
                        />
                        {(settings.scoreboardConfig.showRecord || settings.scoreboardConfig.showStanding) && (
                          <div className={`flex flex-col gap-0.5 lg:gap-1 items-center justify-center w-full transition-all ${
                            !expandedStats.home && !expandedStats.away
                              ? 'text-base lg:text-lg xl:text-xl'
                              : 'text-sm lg:text-base xl:text-lg'
                          }`}>
                            {settings.scoreboardConfig.showRecord && (
                              <input
                                type="text"
                                data-scoreboard-input
                                placeholder="R"
                                value={awayTeam.record || ''}
                                onChange={(e) => updateTeamDetails('away', 'record', e.target.value)}
                                className={`w-full px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold transition-all ${
                                  !expandedStats.home && !expandedStats.away
                                    ? 'max-w-[130px] lg:max-w-[150px] xl:max-w-[170px]'
                                    : 'max-w-[120px] lg:max-w-[140px]'
                                }`}
                                style={{ 
                                  color: currentTheme.textSecondary,
                                  fontFamily: currentTheme.headerFont,
                                  textAlign: 'center',
                                  fontSize: fontSizes.record,
                                  lineHeight: '1.05',
                                  '--dynamic-font-size': fontSizes.record,
                                } as React.CSSProperties & { '--dynamic-font-size'?: string }}
                              />
                            )}
                            {settings.scoreboardConfig.showStanding && (
                              <input
                                type="text"
                                data-scoreboard-input
                                placeholder="S"
                                value={awayTeam.standing || ''}
                                onChange={(e) => updateTeamDetails('away', 'standing', e.target.value)}
                                className={`w-full px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold transition-all ${
                                  !expandedStats.home && !expandedStats.away
                                    ? 'max-w-[150px] lg:max-w-[170px] xl:max-w-[190px]'
                                    : 'max-w-[140px] lg:max-w-[160px]'
                                }`}
                                style={{ 
                                  color: currentTheme.textSecondary,
                                  fontFamily: currentTheme.headerFont,
                                  textAlign: 'center',
                                  fontSize: fontSizes.standing,
                                  lineHeight: '1.05',
                                  '--dynamic-font-size': fontSizes.standing,
                                } as React.CSSProperties & { '--dynamic-font-size'?: string }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <div
                        ref={awayScoreBoxRef}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center relative overflow-hidden shadow-lg shrink-0 transition-all ${
                          !expandedStats.home && !expandedStats.away
                            ? 'w-[88px] lg:w-[96px] xl:w-[104px]'
                            : 'w-[76px] lg:w-[84px] xl:w-[92px]'
                        }`}
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
                <div className="min-h-0 flex flex-col h-full" style={{ minWidth: 0, overflow: 'auto' }}>
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

