import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TargetScoreBar } from '../components/TargetScoreBar';
import type { PlayerGameStats, StatType } from '../types';
import { statLabels } from '../types';
import confetti from 'canvas-confetti';

// Hook to calculate scoreboard scaling based on container dimensions
interface ScoreboardScales {
  scoreBoxSize: number;
  teamNameSize: number;
  recordSize: number;
  quarterSize: number;
  timerSize: number;
  titleSize: number;
  foulBoxSize: number;
  foulFontSize: number;
  gap: number;
  padding: number;
}

function useScoreboardScaling(
  containerRef: React.RefObject<HTMLDivElement | null>,
  showTitle: boolean,
  showRecord: boolean,
  showStanding: boolean,
  showFouls: boolean,
  isExpanded: boolean
): ScoreboardScales {
  const [scales, setScales] = useState<ScoreboardScales>({
    scoreBoxSize: 140,
    teamNameSize: 48,
    recordSize: 32,
    quarterSize: 44,
    timerSize: 36,
    titleSize: 40,
    foulBoxSize: 60,
    foulFontSize: 28,
    gap: 20,
    padding: 20,
  });

  useEffect(() => {
    const calculateScales = () => {
      // Use viewport height for consistent scaling
      const vh = window.innerHeight / 100;
      
      // Scale down when stats are expanded (less horizontal space)
      const expandedScale = isExpanded ? 0.7 : 1;
      
      // Scale based on viewport height
      const scoreBoxSize = Math.max(100, Math.floor(18 * vh * expandedScale));
      const teamNameSize = Math.max(24, Math.floor(5 * vh * expandedScale));
      const recordSize = Math.max(16, Math.floor(3.5 * vh * expandedScale));
      const quarterSize = Math.max(24, Math.floor(4.5 * vh * expandedScale));
      const timerSize = Math.max(20, Math.floor(3.5 * vh * expandedScale));
      const titleSize = Math.max(20, Math.floor(4 * vh * expandedScale));
      const foulBoxSize = Math.max(40, Math.floor(7 * vh * expandedScale));
      const foulFontSize = Math.max(18, Math.floor(3 * vh * expandedScale));
      const gap = Math.max(12, Math.floor(2 * vh * expandedScale));
      const padding = Math.max(12, Math.floor(2 * vh * expandedScale));

      setScales({ scoreBoxSize, teamNameSize, recordSize, quarterSize, timerSize, titleSize, foulBoxSize, foulFontSize, gap, padding });
    };

    calculateScales();
    
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateScales, 30);
    };

    window.addEventListener('resize', debouncedUpdate);
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(debouncedUpdate);
      resizeObserver.observe(containerRef.current);
    }
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedUpdate);
      resizeObserver?.disconnect();
    };
  }, [containerRef, showTitle, showRecord, showStanding, showFouls, isExpanded]);

  return scales;
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
  const homeTableRef = useRef<HTMLDivElement>(null);
  const awayTableRef = useRef<HTMLDivElement>(null);

  
  // Get enabled stats for scaling calculation
  const enabledStatsForScaling = Object.entries(settings.statsConfig)
    .filter(([, enabled]) => enabled)
    .map(([stat]) => stat as StatType);
  const showFoulsForScaling = enabledStatsForScaling.includes('fouls');
  
  // Scoreboard scaling
  const scoreboardScales = useScoreboardScaling(
    desktopScoreboardRef,
    settings.scoreboardConfig.showTitle,
    settings.scoreboardConfig.showRecord,
    settings.scoreboardConfig.showStanding,
    showFoulsForScaling,
    expandedStats.home || expandedStats.away
  );
  
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
    
    // Get the appropriate ref for this team
    const tableRef = teamType === 'home' ? homeTableRef : awayTableRef;
    
    return (
    <div
      ref={tableRef}
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: currentTheme.secondaryBackground, height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Team Header - Using vh units for scaling */}
      <div
        style={{
          backgroundColor: team.primaryColor,
          color: team.secondaryColor,
          padding: 'max(8px, 1.2vh) max(12px, 1.5vh)',
          flexShrink: 0,
        }}
      >
        <div className="flex items-center" style={{ 
          gap: 'max(8px, 1vh)',
        }}>
            {/* Mobile: Both teams have [Toggle] [Team Name] [HOME/AWAY] */}
            {/* Desktop: Home team [Toggle] [Team Name] [HOME], Away team [AWAY] [Team Name] [Toggle] */}
            {/* Mobile layout - same for both teams */}
            <div className="flex items-center md:hidden w-full" style={{ 
              gap: 'max(8px, 1vh)'
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
                  fontSize: 'max(16px, 2vh)',
                  padding: 'max(4px, 0.5vh) max(8px, 1vh)'
                }}
                title={isExpanded ? 'Collapse stats' : 'Expand stats'}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
              <span
                className="font-bold tracking-wide truncate flex-1 min-w-0 text-center"
                style={{ 
                  fontFamily: currentTheme.headerFont,
                  fontSize: 'max(28px, 4vh)'
                }}
              >
                {team.teamName}
              </span>
              <span className="opacity-80 shrink-0" style={{ fontSize: 'max(14px, 1.8vh)' }}>
                {isHome ? 'HOME' : 'AWAY'}
              </span>
            </div>
            
            {/* Desktop layout - symmetrical */}
            <div className="hidden md:flex items-center w-full" style={{ 
              gap: 'max(8px, 1vh)'
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
                      fontSize: 'max(16px, 2vh)',
                      padding: 'max(4px, 0.5vh) max(8px, 1vh)'
                    }}
                    title={isExpanded ? 'Collapse stats' : 'Expand stats'}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                  <span
                    className="font-bold tracking-wide truncate flex-1 min-w-0 text-center"
                    style={{ 
                      fontFamily: currentTheme.headerFont,
                      fontSize: 'max(26px, 3.8vh)'
                    }}
                  >
                    {team.teamName}
                  </span>
                  <span className="opacity-80 shrink-0" style={{ fontSize: 'max(14px, 1.8vh)' }}>
                    HOME
                  </span>
                </>
              ) : (
                <>
                  <span className="opacity-80 shrink-0" style={{ fontSize: 'max(14px, 1.8vh)' }}>
                    AWAY
                  </span>
                  <span
                    className="font-bold tracking-wide truncate flex-1 min-w-0 text-center"
                    style={{ 
                      fontFamily: currentTheme.headerFont,
                      fontSize: 'max(26px, 3.8vh)'
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
                      fontSize: 'max(16px, 2vh)',
                      padding: 'max(4px, 0.5vh) max(8px, 1vh)'
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

      {/* Stats Table - Using viewport units for reliable scaling */}
      <div style={{ flex: 1, width: '100%', overflowX: isExpanded ? 'auto' : 'hidden', overflowY: 'hidden', minHeight: 0 }}>
        {(() => {
          // Calculate sizes based on number of rows AND available width
          const rowCount = team.players.length + 2; // players + header + total
          const availableVh = showTargetBar ? 55 : 62; // viewport height available
          const rowVh = availableVh / rowCount;
          
          // Scale everything based on row height - use smaller values to prevent overflow
          const jerseyVh = Math.min(rowVh * 0.42, 4);
          const fontVh = Math.min(rowVh * 0.32, 3);
          const foulVh = Math.min(rowVh * 0.35, 3);
          const pointsVh = Math.min(rowVh * 0.4, 4);
          const quickBtnVh = Math.min(rowVh * 0.28, 3);
          const headerVh = Math.min(rowVh * 0.42, 3.5);
          
          return (
            <table style={{ width: isExpanded ? 'max-content' : '100%', minWidth: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: isExpanded ? 'auto' : 'fixed' }}>
              <thead>
                <tr style={{ backgroundColor: currentTheme.backgroundColor, height: `${rowVh}vh` }}>
                  <th style={{ color: currentTheme.textSecondary, fontSize: `${headerVh}vh`, fontWeight: 700, textAlign: 'center', width: isExpanded ? 'auto' : '12%', minWidth: isExpanded ? 40 : undefined, padding: '0 2px' }}>#</th>
                  <th style={{ color: currentTheme.textSecondary, fontSize: `${headerVh}vh`, fontWeight: 700, textAlign: 'left', paddingLeft: '4px', minWidth: isExpanded ? 100 : undefined }}>PLAYER</th>
                  {showFouls && <th style={{ color: currentTheme.textSecondary, fontSize: `${headerVh}vh`, fontWeight: 700, textAlign: 'center', width: isExpanded ? 'auto' : '22%', minWidth: isExpanded ? 80 : undefined, padding: '0 4px' }}>PF</th>}
                  {visibleStats.map(stat => (
                    <th key={stat} colSpan={stat === 'points' && settings.scoreboardConfig.showQuickPoints ? 2 : 1} style={{ color: currentTheme.textSecondary, fontSize: `${headerVh}vh`, fontWeight: 700, textAlign: 'center', width: isExpanded ? 'auto' : (stat === 'points' && settings.scoreboardConfig.showQuickPoints ? '22%' : '18%'), minWidth: isExpanded ? 50 : 60, padding: isExpanded ? '0 4px' : '0 12px' }}>
                      {statLabels[stat].slice(0, isExpanded ? 3 : 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {team.players.map((player, index) => (
                  <tr key={player.playerId} style={{ borderTop: `1px solid ${currentTheme.backgroundColor}`, backgroundColor: index % 2 === 0 ? 'transparent' : currentTheme.backgroundColor + '40', height: `${rowVh}vh` }}>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <span className="inline-flex items-center justify-center rounded font-bold" style={{ backgroundColor: team.primaryColor, color: team.secondaryColor, fontSize: `${pointsVh}vh`, width: `${pointsVh * 1.3}vh`, height: `${pointsVh * 1.3}vh`, minWidth: 24, minHeight: 24 }}>
                        {player.jerseyNumber}
                      </span>
                    </td>
                    <td style={{ fontSize: `${fontVh}vh`, fontWeight: 600, verticalAlign: 'middle', paddingLeft: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player.playerName}
                    </td>
                    {showFouls && (
                      <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '0 2px' }}>
                        <button onClick={() => handleFoulDotClick(teamType, player.playerId)} className="flex items-center justify-center mx-auto cursor-pointer w-full" style={{ gap: `${foulVh * 0.12}vh` }} title="Click to increment fouls">
                          {[0,1,2,3,4].map(i => {
                            const foulCount = typeof player.fouls === 'number' ? player.fouls : 0;
                            const isLit = i < foulCount;
                            return <span key={i} style={{ color: isLit ? (i === 4 ? team.primaryColor : currentTheme.accentColor) : currentTheme.textSecondary + '40', fontSize: `${foulVh}vh`, opacity: isLit ? 1 : 0.3, fontWeight: 'bold', lineHeight: 1 }}>●</span>;
                          })}
                        </button>
                      </td>
                    )}
                    {visibleStats.map(stat => {
                      const value = player[stat as keyof PlayerGameStats];
                      const isPoints = stat === 'points';
                      const needsBox = stat === 'rebounds' || stat === 'assists';
                      return (
                        <React.Fragment key={stat}>
                          <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: isExpanded ? '0 4px' : '0 12px' }}>
                            <button
                              onClick={e => handleStatClick(teamType, player.playerId, stat as keyof PlayerGameStats, e)}
                              className={needsBox ? "cursor-pointer inline-flex items-center justify-center rounded" : "cursor-pointer"}
                              style={{
                                color: currentTheme.accentColor,
                                fontSize: `${pointsVh}vh`,
                                fontWeight: 900,
                                display: 'block',
                                width: '100%',
                                textAlign: 'center',
                                ...(needsBox && {
                                  backgroundColor: currentTheme.accentColor + '25',
                                  minWidth: `${pointsVh * 1.5}vh`,
                                  height: `${pointsVh * 1.2}vh`,
                                  padding: '4px 10px',
                                  display: 'inline-flex'
                                })
                              }}
                              title="Click +1, Shift+Click -1"
                            >
                              {typeof value === 'number' ? value : 0}
                            </button>
                          </td>
                          {isPoints && settings.scoreboardConfig.showQuickPoints && (
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <div className="flex justify-center items-center" style={{ gap: `${quickBtnVh * 0.1}vh` }}>
                                {[1,2,3].map(pts => (
                                  <button key={pts} onClick={() => updatePlayerStat(teamType, player.playerId, 'points', pts)} className="rounded font-bold" style={{ backgroundColor: team.primaryColor, color: team.secondaryColor, fontSize: `${quickBtnVh * 0.5}vh`, width: `${quickBtnVh}vh`, height: `${quickBtnVh}vh`, minWidth: 18, minHeight: 18, opacity: 0.9 }}>
                                    +{pts}
                                  </button>
                                ))}
                              </div>
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
                {/* TOTAL Row - scales with vh */}
                <tr style={{ borderTop: `2px solid ${team.primaryColor}`, backgroundColor: team.primaryColor + '20', height: `${rowVh}vh` }}>
                  <td></td>
                  <td style={{ fontSize: `${fontVh * 1.1}vh`, fontWeight: 800, verticalAlign: 'middle', paddingLeft: '4px', fontFamily: currentTheme.headerFont, whiteSpace: 'nowrap' }}>TOTAL</td>
                  {showFouls && (
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <span className="inline-flex items-center justify-center rounded font-bold" style={{ backgroundColor: team.primaryColor, color: team.secondaryColor, fontSize: `${fontVh}vh`, height: `${jerseyVh * 0.8}vh`, minHeight: 22, padding: '0 0.8vh' }}>
                        {calculateTotal(team.players, 'fouls')}
                      </span>
                    </td>
                  )}
                  {visibleStats.map(stat => {
                    const total = calculateTotal(team.players, stat as keyof PlayerGameStats);
                    return (
                      <React.Fragment key={stat}>
                        <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: isExpanded ? '0 4px' : '0 12px' }}>
                          <span className="inline-flex items-center justify-center rounded font-bold" style={{ backgroundColor: team.primaryColor, color: team.secondaryColor, fontSize: `${fontVh * 1.1}vh`, height: `${jerseyVh * 0.85}vh`, minHeight: 24, padding: '0 0.8vh', margin: '0 auto' }}>
                            {total}
                          </span>
                        </td>
                        {stat === 'points' && settings.scoreboardConfig.showQuickPoints && <td></td>}
                      </React.Fragment>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          );
        })()}
      </div>
    </div>
    );
  };

  const renderScoreboard = () => (
    <div ref={mobileScoreboardRef} className="w-full min-w-0 flex flex-col">
      {/* Game Title Input - SAME SIZE AS TEAM NAME */}
      {settings.scoreboardConfig.showTitle && (
        <div className="flex justify-center w-full px-2 pb-1 xs:pb-1.5 sm:pb-2 shrink-0">
          <input
            type="text"
            data-scoreboard-input
            placeholder="Game Title"
            value={currentGame.title || ''}
            onChange={(e) => updateCurrentGame({ title: e.target.value })}
            className="text-center bg-transparent border-transparent hover:border-white/10 focus:border-white/20 border rounded px-2 py-1 w-full transition-colors focus:outline-none placeholder-white/20 font-bold"
            style={{
              color: '#ffffff',
              fontFamily: currentTheme.headerFont,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontSize: 'clamp(32px, 5vh, 100px)',
              lineHeight: '1.1',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-0.5 xs:gap-0.5 sm:gap-1 md:gap-1 shrink-0">
        {/* Scores Row - Horizontal Layout */}
        <div className="flex items-center justify-center w-full gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 px-1 xs:px-1.5 sm:px-2 md:px-2 lg:px-2.5 min-w-0 shrink-0">
          {/* Home Team Score */}
          <div className="flex flex-col items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-1 lg:gap-1.5">
            <div className="flex flex-col items-center gap-0.5 xs:gap-1 sm:gap-1 md:gap-0.5 lg:gap-1 w-full shrink-0" style={{ minWidth: '120px' }}>
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
                  fontSize: 'clamp(32px, 5vh, 100px)',
                  lineHeight: '1.05',
                  minWidth: '120px',
                }}
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
                      className="w-full max-w-[200px] xs:max-w-[220px] sm:max-w-[240px] md:max-w-[220px] lg:max-w-[240px] px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        textAlign: 'center',
                        fontSize: 'clamp(22px, 3.5vh, 70px)',
                        lineHeight: '1.05',
                      }}
                    />
                  )}
                  {settings.scoreboardConfig.showStanding && (
                    <input
                      type="text"
                      data-scoreboard-input
                      placeholder="S"
                      value={homeTeam.standing || ''}
                      onChange={(e) => updateTeamDetails('home', 'standing', e.target.value)}
                      className="w-full max-w-[220px] xs:max-w-[240px] sm:max-w-[260px] md:max-w-[240px] lg:max-w-[260px] px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        textAlign: 'center',
                        fontSize: 'clamp(22px, 3.5vh, 70px)',
                        lineHeight: '1.05',
                      }}
                    />
                  )}
                </div>
              )}
            </div>
            <div
              className="w-[100px] xs:w-[115px] sm:w-[130px] md:w-[90px] lg:w-[100px] xl:w-[110px] aspect-square rounded-lg flex flex-col items-center justify-center relative overflow-hidden shadow-lg shrink-0"
              style={{ backgroundColor: homeTeam.primaryColor }}
            >
              <span
                className="font-black relative z-10 leading-none"
                style={{
                  color: homeTeam.secondaryColor,
                  fontFamily: currentTheme.numberFont,
                  fontSize: 'clamp(3rem, 12vw, 5rem)',
                }}
              >
                {homeScore}
              </span>
            </div>
          </div>

          {/* Center - Quarter & Time */}
          {(settings.scoreboardConfig.showQuarter || settings.scoreboardConfig.showTimer) && (
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
                    style={{ fontFamily: currentTheme.numberFont, fontSize: 'clamp(28px, 4.5vh, 90px)', lineHeight: '1' }}
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
                  className="text-center bg-transparent border-b-2 font-mono focus:outline-none font-bold py-0.5 leading-none"
                  style={{
                    borderColor: currentTheme.accentColor,
                    color: currentTheme.textColor,
                    fontSize: 'clamp(24px, 3.5vh, 70px)',
                    width: 'fit-content',
                    minWidth: '3.5ch',
                    maxWidth: '5ch',
                  }}
                />
              )}
            </div>
          )}

          {/* Away Team Score */}
          <div className="flex flex-col items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-1 lg:gap-1.5">
            <div className="flex flex-col items-center gap-0.5 xs:gap-1 sm:gap-1 md:gap-0.5 lg:gap-1 w-full shrink-0" style={{ minWidth: '120px' }}>
              <input
                type="text"
                data-scoreboard-input
                value={awayTeam.displayName || awayTeam.teamName}
                onChange={(e) => updateTeamDetails('away', 'displayName', e.target.value)}
                placeholder={awayTeam.teamName}
                className="font-bold text-center w-full px-2 py-1 rounded border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-opacity-50 hover:bg-black/5 transition-colors"
                style={{
                  fontFamily: currentTheme.headerFont,
                  color: currentTheme.textColor,
                  textAlign: 'center',
                  fontSize: 'clamp(32px, 5vh, 100px)',
                  lineHeight: '1.05',
                  minWidth: '120px',
                }}
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
                      className="w-full max-w-[200px] xs:max-w-[220px] sm:max-w-[240px] md:max-w-[220px] lg:max-w-[240px] px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        textAlign: 'center',
                        fontSize: 'clamp(22px, 3.5vh, 70px)',
                        lineHeight: '1.05',
                      }}
                    />
                  )}
                  {settings.scoreboardConfig.showStanding && (
                    <input
                      type="text"
                      data-scoreboard-input
                      placeholder="S"
                      value={awayTeam.standing || ''}
                      onChange={(e) => updateTeamDetails('away', 'standing', e.target.value)}
                      className="w-full max-w-[220px] xs:max-w-[240px] sm:max-w-[260px] md:max-w-[240px] lg:max-w-[260px] px-1 py-0.5 rounded border-0 bg-transparent focus:outline-none focus:ring-0 text-center font-bold"
                      style={{ 
                        color: currentTheme.textSecondary,
                        fontFamily: currentTheme.headerFont,
                        textAlign: 'center',
                        fontSize: 'clamp(22px, 3.5vh, 70px)',
                        lineHeight: '1.05',
                      }}
                    />
                  )}
                </div>
              )}
            </div>
            <div
              className="w-[100px] xs:w-[115px] sm:w-[130px] md:w-[90px] lg:w-[100px] xl:w-[110px] aspect-square rounded-lg flex flex-col items-center justify-center relative overflow-hidden shadow-lg shrink-0"
              style={{ backgroundColor: awayTeam.primaryColor }}
            >
              <span
                className="font-black relative z-10 leading-none"
                style={{
                  color: awayTeam.secondaryColor,
                  fontFamily: currentTheme.numberFont,
                  fontSize: 'clamp(3rem, 12vw, 5rem)',
                }}
              >
                {awayScore}
              </span>
            </div>
          </div>
        </div>
        
        {/* Foul Totals - Below Scores */}
        {showFouls && (
          <div className="flex items-center justify-center gap-6 xs:gap-8 sm:gap-10 md:gap-8 lg:gap-10 w-full mt-2 xs:mt-2.5 sm:mt-3 md:mt-2 lg:mt-2.5">
            <div className="flex flex-col items-center gap-1 xs:gap-1.5 sm:gap-2">
              <span
                className="font-bold uppercase tracking-wide"
                style={{ color: currentTheme.textSecondary, fontSize: 'clamp(14px, 2vh, 24px)' }}
              >
                PF
              </span>
              <span
                className="font-black px-4 xs:px-5 sm:px-6 md:px-5 lg:px-6 py-2 xs:py-2.5 sm:py-3 md:py-2.5 lg:py-3 rounded-lg min-w-[3ch] text-center shadow-lg"
                style={{
                  backgroundColor: homeTeam.primaryColor,
                  color: homeTeam.secondaryColor,
                  fontFamily: currentTheme.numberFont,
                  fontSize: 'clamp(1.25rem, 3vw + 0.5rem, 2rem)',
                  lineHeight: '1.2',
                }}
              >
                {homeFouls}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 xs:gap-1.5 sm:gap-2">
              <span
                className="font-bold uppercase tracking-wide"
                style={{ color: currentTheme.textSecondary, fontSize: 'clamp(14px, 2vh, 24px)' }}
              >
                PF
              </span>
              <span
                className="font-black px-4 xs:px-5 sm:px-6 md:px-5 lg:px-6 py-2 xs:py-2.5 sm:py-3 md:py-2.5 lg:py-3 rounded-lg min-w-[3ch] text-center shadow-lg"
                style={{
                  backgroundColor: awayTeam.primaryColor,
                  color: awayTeam.secondaryColor,
                  fontFamily: currentTheme.numberFont,
                  fontSize: 'clamp(1.25rem, 3vw + 0.5rem, 2rem)',
                  lineHeight: '1.2',
                }}
              >
                {awayFouls}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderActionBar = () => (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-2 md:mb-2 lg:mb-2 gap-3 md:gap-2 lg:gap-3 p-2 sm:p-3 md:p-2 lg:p-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap w-full md:w-auto justify-center md:justify-start gap-2 md:gap-2 lg:gap-2.5">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="px-3 sm:px-4 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 rounded-lg text-sm md:text-xs lg:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          className="px-3 sm:px-4 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 rounded-lg text-sm md:text-xs lg:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          className="px-3 sm:px-4 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 rounded-lg text-sm md:text-xs lg:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          className="px-3 sm:px-4 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 rounded-lg text-sm md:text-xs lg:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          className="px-3 sm:px-4 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 rounded-lg text-sm md:text-xs lg:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          className="px-3 sm:px-4 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 rounded-lg text-sm md:text-xs lg:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
          className="px-3 sm:px-4 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 rounded-lg text-sm md:text-xs lg:text-sm font-medium transition-all hover:opacity-80 whitespace-nowrap"
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
        className="w-full md:w-auto px-3 sm:px-4 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 rounded-lg text-sm md:text-xs lg:text-sm font-medium transition-all hover:scale-105"
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

          <div className="max-w-full mx-auto px-2 sm:px-3 md:px-3 lg:px-4 py-2 md:py-2 lg:py-3 w-full flex-1 flex flex-col" style={{ overflowX: 'hidden', minHeight: 0 }}>
            {renderActionBar()}

            {/* Desktop: Wrapper for Tables and Target Bar */}
            <div className="hidden md:flex flex-col flex-1" style={{ minHeight: 0 }}>
              {/* Desktop: Three Column Layout - Home Stats | Scoreboard | Away Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', flex: 1, width: '100%', minHeight: 0 }}>
                {/* Home Team Stats */}
                <div style={{ height: '100%', minHeight: 0 }}>
                  {renderTeamStats(homeTeam, 'home', true)}
                </div>

                {/* Scoreboard Section - Middle */}
                <div className="flex flex-col items-center justify-center"
                  style={{ 
                    width: 'auto',
                    minWidth: '280px',
                    maxWidth: '550px',
                    height: '100%',
                    padding: '0 8px',
                  }}>
                <div
                  ref={desktopScoreboardRef}
                  className="rounded-lg shadow-xl w-full flex flex-col"
                  style={{ backgroundColor: currentTheme.secondaryBackground, padding: `${scoreboardScales.padding * 1.5}px ${scoreboardScales.padding * 0.4}px` }}
                >
                  {/* Game Title Input - SCALES WITH SCOREBOARD */}
                  {settings.scoreboardConfig.showTitle && (
                    <div className="flex justify-center shrink-0" style={{ marginBottom: scoreboardScales.gap / 2 }}>
                      <input
                        type="text"
                        data-scoreboard-input
                        placeholder="Game Title"
                        value={currentGame.title || ''}
                        onChange={(e) => updateCurrentGame({ title: e.target.value })}
                        className="text-center bg-transparent border-transparent hover:border-white/10 focus:border-white/20 border rounded w-full max-w-full focus:outline-none placeholder-white/20 font-bold"
                        style={{
                          color: '#ffffff',
                          fontFamily: currentTheme.headerFont,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          fontSize: scoreboardScales.teamNameSize,
                          lineHeight: '1.1',
                          padding: `${scoreboardScales.padding / 3}px ${scoreboardScales.padding / 2}px`,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      />
                    </div>
                  )}

                  {/* Desktop Scoreboard Layout - Horizontal */}
                  <div className="flex items-center justify-center shrink-0" style={{ gap: scoreboardScales.gap, padding: `0 ${scoreboardScales.padding / 2}px`, marginTop: scoreboardScales.gap / 2 }}>
                    {/* Home Team Score - Left Side */}
                    <div className="flex flex-col items-center" style={{ gap: scoreboardScales.gap / 3, minWidth: scoreboardScales.scoreBoxSize }}>
                      <div className="flex flex-col items-center w-full shrink-0" style={{ gap: 2 }}>
                        <div className="flex flex-col items-center w-full" style={{ gap: 0 }}>
                          <input
                            type="text"
                            data-scoreboard-input
                            value={homeTeam.displayName || homeTeam.teamName}
                            onChange={(e) => updateTeamDetails('home', 'displayName', e.target.value)}
                            placeholder={homeTeam.teamName}
                            className="font-bold text-center w-full px-1 rounded border-0 bg-transparent focus:outline-none hover:bg-black/5"
                            style={{
                              fontFamily: currentTheme.headerFont,
                              color: currentTheme.textColor,
                              fontSize: scoreboardScales.teamNameSize,
                              lineHeight: '1.1',
                            }}
                            title={`Full name: ${homeTeam.teamName}`}
                          />
                          {(settings.scoreboardConfig.showRecord || settings.scoreboardConfig.showStanding) && (
                            <div className="flex flex-col items-center justify-center w-full" style={{ gap: 1 }}>
                              {settings.scoreboardConfig.showRecord && (
                                <input
                                  type="text"
                                  data-scoreboard-input
                                  placeholder="Record"
                                  value={homeTeam.record || ''}
                                  onChange={(e) => updateTeamDetails('home', 'record', e.target.value)}
                                  className="px-1 rounded border-0 bg-transparent focus:outline-none text-center font-bold"
                                  style={{ 
                                    color: currentTheme.textSecondary,
                                    fontFamily: currentTheme.headerFont,
                                    fontSize: scoreboardScales.recordSize,
                                    lineHeight: '1.2',
                                  }}
                                />
                              )}
                              {settings.scoreboardConfig.showStanding && (
                                <input
                                  type="text"
                                  data-scoreboard-input
                                  placeholder="Standing"
                                  value={homeTeam.standing || ''}
                                  onChange={(e) => updateTeamDetails('home', 'standing', e.target.value)}
                                  className="px-1 rounded border-0 bg-transparent focus:outline-none text-center font-bold"
                                  style={{ 
                                    color: currentTheme.textSecondary,
                                    fontFamily: currentTheme.headerFont,
                                    fontSize: scoreboardScales.recordSize,
                                    lineHeight: '1.2',
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        ref={homeScoreBoxRef}
                        className="aspect-square rounded-lg shadow-lg shrink-0"
                        style={{ 
                          backgroundColor: homeTeam.primaryColor, 
                          width: scoreboardScales.scoreBoxSize,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingTop: '6%',
                          marginTop: scoreboardScales.gap / 2
                        }}
                      >
                        <span style={{ 
                          color: homeTeam.secondaryColor, 
                          fontFamily: currentTheme.numberFont, 
                          fontSize: scoreboardScales.scoreBoxSize * 0.75,
                          fontWeight: 900,
                          lineHeight: 1,
                          textAlign: 'center'
                        }}>
                          {homeScore}
                        </span>
                      </div>
                    </div>

                    {/* Center - Quarter, Timer */}
                    <div className="flex flex-col items-center shrink-0" style={{ gap: scoreboardScales.gap / 3 }}>
                      {settings.scoreboardConfig.showQuarter && (
                        <div className="flex items-center" style={{ gap: 4 }}>
                          <button onClick={() => handleQuarterChange(-1)} className="rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 shrink-0" style={{ color: currentTheme.accentColor, width: scoreboardScales.quarterSize * 0.7, height: scoreboardScales.quarterSize * 0.7 }} disabled={quarter <= 1}>
                            <span style={{ fontSize: scoreboardScales.quarterSize * 0.4 }}>◀</span>
                          </button>
                          <span className="font-black text-center" style={{ fontFamily: currentTheme.numberFont, fontSize: scoreboardScales.quarterSize, lineHeight: '1', minWidth: '2.5ch' }}>
                            Q{quarter}
                          </span>
                          <button onClick={() => handleQuarterChange(1)} className="rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 shrink-0" style={{ color: currentTheme.accentColor, width: scoreboardScales.quarterSize * 0.7, height: scoreboardScales.quarterSize * 0.7 }} disabled={quarter >= 4}>
                            <span style={{ fontSize: scoreboardScales.quarterSize * 0.4 }}>▶</span>
                          </button>
                        </div>
                      )}
                      {settings.scoreboardConfig.showTimer && (
                        <input
                          type="text"
                          data-scoreboard-input
                          value={timeRemaining}
                          onChange={e => updateCurrentGame({ timeRemaining: e.target.value })}
                          className="text-center bg-transparent border-b-2 font-mono focus:outline-none font-bold leading-none"
                          style={{ borderColor: currentTheme.accentColor, color: currentTheme.textColor, fontSize: scoreboardScales.timerSize, minWidth: '3.5ch', maxWidth: '5ch' }}
                        />
                      )}
                    </div>

                    {/* Away Team Score - Right Side */}
                    <div className="flex flex-col items-center" style={{ gap: scoreboardScales.gap / 3, minWidth: scoreboardScales.scoreBoxSize }}>
                      <div className="flex flex-col items-center w-full shrink-0" style={{ gap: 2 }}>
                        <div className="flex flex-col items-center w-full" style={{ gap: 0 }}>
                          <input
                            type="text"
                            data-scoreboard-input
                            value={awayTeam.displayName || awayTeam.teamName}
                            onChange={(e) => updateTeamDetails('away', 'displayName', e.target.value)}
                            placeholder={awayTeam.teamName}
                            className="font-bold text-center w-full px-1 rounded border-0 bg-transparent focus:outline-none hover:bg-black/5"
                            style={{
                              fontFamily: currentTheme.headerFont,
                              color: currentTheme.textColor,
                              fontSize: scoreboardScales.teamNameSize,
                              lineHeight: '1.1',
                            }}
                            title={`Full name: ${awayTeam.teamName}`}
                          />
                          {(settings.scoreboardConfig.showRecord || settings.scoreboardConfig.showStanding) && (
                            <div className="flex flex-col items-center justify-center w-full" style={{ gap: 1 }}>
                              {settings.scoreboardConfig.showRecord && (
                                <input
                                  type="text"
                                  data-scoreboard-input
                                  placeholder="Record"
                                  value={awayTeam.record || ''}
                                  onChange={(e) => updateTeamDetails('away', 'record', e.target.value)}
                                  className="px-1 rounded border-0 bg-transparent focus:outline-none text-center font-bold"
                                  style={{ 
                                    color: currentTheme.textSecondary,
                                    fontFamily: currentTheme.headerFont,
                                    fontSize: scoreboardScales.recordSize,
                                    lineHeight: '1.2',
                                  }}
                                />
                              )}
                              {settings.scoreboardConfig.showStanding && (
                                <input
                                  type="text"
                                  data-scoreboard-input
                                  placeholder="Standing"
                                  value={awayTeam.standing || ''}
                                  onChange={(e) => updateTeamDetails('away', 'standing', e.target.value)}
                                  className="px-1 rounded border-0 bg-transparent focus:outline-none text-center font-bold"
                                  style={{ 
                                    color: currentTheme.textSecondary,
                                    fontFamily: currentTheme.headerFont,
                                    fontSize: scoreboardScales.recordSize,
                                    lineHeight: '1.2',
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        ref={awayScoreBoxRef}
                        className="aspect-square rounded-lg shadow-lg shrink-0"
                        style={{ 
                          backgroundColor: awayTeam.primaryColor, 
                          width: scoreboardScales.scoreBoxSize,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingTop: '6%',
                          marginTop: scoreboardScales.gap / 2
                        }}
                      >
                        <span style={{ 
                          color: awayTeam.secondaryColor, 
                          fontFamily: currentTheme.numberFont, 
                          fontSize: scoreboardScales.scoreBoxSize * 0.75,
                          fontWeight: 900,
                          lineHeight: 1,
                          textAlign: 'center'
                        }}>
                          {awayScore}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Foul Totals - Below Score Boxes */}
                  {showFouls && (
                    <div className="flex items-center justify-center w-full" style={{ gap: scoreboardScales.gap * 3, marginTop: scoreboardScales.gap }}>
                      <div className="flex flex-col items-center" style={{ gap: scoreboardScales.gap / 4 }}>
                        <span className="font-bold uppercase" style={{ color: currentTheme.textSecondary, fontSize: scoreboardScales.foulFontSize * 0.7 }}>PF</span>
                        <span className="font-black rounded-lg text-center shadow-lg inline-flex items-center justify-center" style={{ backgroundColor: homeTeam.primaryColor, color: homeTeam.secondaryColor, fontFamily: currentTheme.numberFont, fontSize: scoreboardScales.foulFontSize, width: scoreboardScales.foulBoxSize, height: scoreboardScales.foulBoxSize * 0.7 }}>
                          {homeFouls}
                        </span>
                      </div>
                      <div className="flex flex-col items-center" style={{ gap: scoreboardScales.gap / 4 }}>
                        <span className="font-bold uppercase" style={{ color: currentTheme.textSecondary, fontSize: scoreboardScales.foulFontSize * 0.7 }}>PF</span>
                        <span className="font-black rounded-lg text-center shadow-lg inline-flex items-center justify-center" style={{ backgroundColor: awayTeam.primaryColor, color: awayTeam.secondaryColor, fontFamily: currentTheme.numberFont, fontSize: scoreboardScales.foulFontSize, width: scoreboardScales.foulBoxSize, height: scoreboardScales.foulBoxSize * 0.7 }}>
                          {awayFouls}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

                {/* Away Team Stats */}
                <div style={{ height: '100%', minHeight: 0 }}>
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

