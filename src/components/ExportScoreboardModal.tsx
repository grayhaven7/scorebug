import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import type { Theme, Game, ScoreboardTextField, ScoreboardTextSizes } from '../types';
import { TargetScoreBar } from './TargetScoreBar';

interface ExportScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  game: Game;
  homeScore: number;
  awayScore: number;
  textScale?: number;
  textSizes?: ScoreboardTextSizes;
}

type LayoutStyle = 'classic' | 'broadcast' | 'minimal' | 'vertical' | 'versus';
type BackgroundStyle = 'solid' | 'gradient' | 'radial' | 'pattern' | 'transparent';
type AspectRatio = 'auto' | 'square' | 'wide' | 'story';

interface ExportOptions {
  layoutStyle: LayoutStyle;
  includeTargetBar: boolean;
  includeTopScorers: boolean;
  showWatermark: boolean;
  watermarkText: string;
  backgroundStyle: BackgroundStyle;
  customBackgroundColor: string;
  gradientEndColor: string;
  patternType: 'dots' | 'grid' | 'stripes' | 'court';
  showDateTime: boolean;
  showWinnerGlow: boolean;
  aspectRatio: AspectRatio;
  borderStyle: 'none' | 'solid' | 'gradient' | 'glow';
}

const layoutDescriptions: Record<LayoutStyle, string> = {
  classic: 'Traditional horizontal layout',
  broadcast: 'TV broadcast style with score bug',
  minimal: 'Clean minimal design',
  vertical: 'Stacked vertical layout',
  versus: 'Face-off VS style',
};

const backgroundPatterns: Record<string, string> = {
  dots: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
  grid: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
  stripes: 'repeating-linear-gradient(45deg, currentColor, currentColor 2px, transparent 2px, transparent 12px)',
  court: 'linear-gradient(90deg, transparent 49%, currentColor 49%, currentColor 51%, transparent 51%)',
};

export function ExportScoreboardModal({
  isOpen,
  onClose,
  theme,
  game,
  homeScore,
  awayScore,
  textScale,
  textSizes,
}: ExportScoreboardModalProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'layout' | 'background' | 'extras'>('layout');
  const [options, setOptions] = useState<ExportOptions>({
    layoutStyle: 'classic',
    includeTargetBar: !!game.targetScore,
    includeTopScorers: false,
    showWatermark: false,
    watermarkText: 'Scorebug',
    backgroundStyle: 'solid',
    customBackgroundColor: theme.secondaryBackground,
    gradientEndColor: theme.backgroundColor,
    patternType: 'dots',
    showDateTime: false,
    showWinnerGlow: true,
    aspectRatio: 'auto',
    borderStyle: 'none',
  });

  useEffect(() => {
    if (isOpen) {
      setOptions(prev => ({
        ...prev,
        includeTargetBar: !!game.targetScore,
        customBackgroundColor: theme.secondaryBackground,
        gradientEndColor: theme.backgroundColor,
      }));
    }
  }, [isOpen, game.targetScore, theme]);

  if (!isOpen) return null;

  const { homeTeam, awayTeam } = game;
  
  // Calculate winner
  const homeWon = game.targetScore ? homeScore >= game.targetScore : false;
  const awayWon = game.targetScore ? awayScore >= game.targetScore : false;
  const hasWinner = homeWon || awayWon;
  const winnerColor = homeWon ? homeTeam.primaryColor : awayWon ? awayTeam.primaryColor : null;

  // Get top scorers
  const getTopScorer = (players: typeof homeTeam.players) => {
    return [...players].sort((a, b) => b.points - a.points)[0];
  };
  const homeTopScorer = getTopScorer(homeTeam.players);
  const awayTopScorer = getTopScorer(awayTeam.players);
  
  const globalTextScale = textScale ?? 1;
  const textMult = (field: ScoreboardTextField) => textSizes?.[field] ?? 1;
  const px = (field: ScoreboardTextField, basePx: number) => `${basePx * globalTextScale * textMult(field)}px`;

  const getBackgroundStyle = (): React.CSSProperties => {
    const baseColor = options.customBackgroundColor;
    const endColor = options.gradientEndColor;
    
    switch (options.backgroundStyle) {
      case 'transparent':
        return { backgroundColor: 'transparent' };
      case 'gradient':
        return { background: `linear-gradient(135deg, ${baseColor} 0%, ${endColor} 100%)` };
      case 'radial':
        return { background: `radial-gradient(circle at center, ${baseColor} 0%, ${endColor} 100%)` };
      case 'pattern':
        const patternColor = theme.textSecondary + '15';
        return {
          backgroundColor: baseColor,
          backgroundImage: backgroundPatterns[options.patternType].replace(/currentColor/g, patternColor),
          backgroundSize: options.patternType === 'dots' ? '20px 20px' : 
                         options.patternType === 'grid' ? '20px 20px' :
                         options.patternType === 'court' ? '100% 100%' : '20px 20px',
        };
      default:
        return { backgroundColor: baseColor };
    }
  };

  const getBorderStyle = (): React.CSSProperties => {
    switch (options.borderStyle) {
      case 'solid':
        return { border: `4px solid ${theme.accentColor}` };
      case 'gradient':
        return {
          border: '4px solid transparent',
          backgroundClip: 'padding-box',
          boxShadow: `0 0 0 4px ${homeTeam.primaryColor}, 0 0 0 8px ${awayTeam.primaryColor}`,
        };
      case 'glow':
        return {
          boxShadow: hasWinner && options.showWinnerGlow
            ? `0 0 30px ${winnerColor}, 0 0 60px ${winnerColor}50`
            : `0 0 20px ${theme.accentColor}40`,
        };
      default:
        return {};
    }
  };

  const getAspectRatioStyle = (): React.CSSProperties => {
    switch (options.aspectRatio) {
      case 'square':
        return { aspectRatio: '1/1', minWidth: '400px' };
      case 'wide':
        return { aspectRatio: '16/9', minWidth: '500px' };
      case 'story':
        return { aspectRatio: '9/16', minWidth: '300px', minHeight: '500px' };
      default:
        return { minWidth: '450px' };
    }
  };

  const handleExport = async () => {
    if (!previewRef.current) return;

    setIsExporting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: options.backgroundStyle === 'transparent' ? null : options.customBackgroundColor,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const date = new Date().toISOString().split('T')[0];
        const homeName = (homeTeam.displayName || homeTeam.teamName).replace(/\s+/g, '-');
        const awayName = (awayTeam.displayName || awayTeam.teamName).replace(/\s+/g, '-');
        link.download = `scoreboard_${homeName}_vs_${awayName}_${date}.png`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsExporting(false);
        onClose();
      }, 'image/png');
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  // Layout renderers
  const renderClassicLayout = () => (
    <div className="flex items-center justify-center gap-6">
      {/* Home Team */}
      <div className="flex flex-col items-center gap-2">
        <span className="font-bold text-center" style={{ fontFamily: theme.headerFont, fontSize: px('teamName', 28), color: theme.textColor }}>
          {homeTeam.displayName || homeTeam.teamName}
        </span>
        {homeTeam.record && <span style={{ fontSize: px('record', 16), color: theme.textSecondary }}>{homeTeam.record}</span>}
        <div
          className="flex items-center justify-center rounded-lg shadow-lg transition-all"
          style={{
            backgroundColor: homeTeam.primaryColor,
            width: '90px',
            height: '90px',
            boxShadow: homeWon && options.showWinnerGlow ? `0 0 25px ${homeTeam.primaryColor}` : undefined,
          }}
        >
          <span style={{ fontFamily: theme.numberFont, fontSize: px('score', 52), fontWeight: 900, color: homeTeam.secondaryColor }}>
            {homeScore}
          </span>
        </div>
      </div>

      {/* Center */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-black" style={{ fontFamily: theme.numberFont, fontSize: px('quarter', 32), color: theme.textColor }}>
          Q{game.quarter}
        </span>
        <span className="font-mono font-bold" style={{ fontSize: px('timer', 22), color: theme.textColor, borderBottom: `2px solid ${theme.accentColor}` }}>
          {game.timeRemaining}
        </span>
      </div>

      {/* Away Team */}
      <div className="flex flex-col items-center gap-2">
        <span className="font-bold text-center" style={{ fontFamily: theme.headerFont, fontSize: px('teamName', 28), color: theme.textColor }}>
          {awayTeam.displayName || awayTeam.teamName}
        </span>
        {awayTeam.record && <span style={{ fontSize: px('record', 16), color: theme.textSecondary }}>{awayTeam.record}</span>}
        <div
          className="flex items-center justify-center rounded-lg shadow-lg"
          style={{
            backgroundColor: awayTeam.primaryColor,
            width: '90px',
            height: '90px',
            boxShadow: awayWon && options.showWinnerGlow ? `0 0 25px ${awayTeam.primaryColor}` : undefined,
          }}
        >
          <span style={{ fontFamily: theme.numberFont, fontSize: px('score', 52), fontWeight: 900, color: awayTeam.secondaryColor }}>
            {awayScore}
          </span>
        </div>
      </div>
    </div>
  );

  const renderBroadcastLayout = () => (
    <div className="flex items-stretch gap-0 rounded-lg overflow-hidden shadow-2xl" style={{ border: `3px solid ${theme.accentColor}` }}>
      {/* Home Section */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: homeTeam.primaryColor }}>
        <span className="font-bold uppercase tracking-wider" style={{ fontFamily: theme.headerFont, color: homeTeam.secondaryColor, fontSize: px('teamName', 18) }}>
          {(homeTeam.displayName || homeTeam.teamName).slice(0, 3).toUpperCase()}
        </span>
        <span className="font-black" style={{ fontFamily: theme.numberFont, color: homeTeam.secondaryColor, fontSize: px('score', 30) }}>
          {homeScore}
        </span>
      </div>
      
      {/* Center Divider */}
      <div className="flex flex-col items-center justify-center px-4 py-2" style={{ backgroundColor: theme.backgroundColor }}>
        <span className="font-bold" style={{ color: theme.textSecondary, fontSize: px('quarter', 12) }}>Q{game.quarter}</span>
        <span className="font-mono font-bold" style={{ color: theme.textColor, fontSize: px('timer', 14) }}>{game.timeRemaining}</span>
      </div>
      
      {/* Away Section */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: awayTeam.primaryColor }}>
        <span className="font-black" style={{ fontFamily: theme.numberFont, color: awayTeam.secondaryColor, fontSize: px('score', 30) }}>
          {awayScore}
        </span>
        <span className="font-bold uppercase tracking-wider" style={{ fontFamily: theme.headerFont, color: awayTeam.secondaryColor, fontSize: px('teamName', 18) }}>
          {(awayTeam.displayName || awayTeam.teamName).slice(0, 3).toUpperCase()}
        </span>
      </div>
    </div>
  );

  const renderMinimalLayout = () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <div className="uppercase tracking-widest mb-1" style={{ color: theme.textSecondary, fontFamily: theme.headerFont, fontSize: px('teamName', 14) }}>
          {homeTeam.displayName || homeTeam.teamName}
        </div>
        <div className="font-black" style={{ fontFamily: theme.numberFont, fontSize: px('score', 64), color: homeTeam.primaryColor, lineHeight: 1 }}>
          {homeScore}
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="font-light" style={{ color: theme.textSecondary, fontSize: px('quarter', 28) }}>–</div>
        <div className="mt-1" style={{ color: theme.textSecondary, fontSize: px('timer', 12) }}>Q{game.quarter} · {game.timeRemaining}</div>
      </div>
      <div className="text-center">
        <div className="uppercase tracking-widest mb-1" style={{ color: theme.textSecondary, fontFamily: theme.headerFont, fontSize: px('teamName', 14) }}>
          {awayTeam.displayName || awayTeam.teamName}
        </div>
        <div className="font-black" style={{ fontFamily: theme.numberFont, fontSize: px('score', 64), color: awayTeam.primaryColor, lineHeight: 1 }}>
          {awayScore}
        </div>
      </div>
    </div>
  );

  const renderVerticalLayout = () => (
    <div className="flex flex-col items-center gap-4">
      {/* Home */}
      <div className="flex items-center gap-4 w-full px-4">
        <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: homeTeam.primaryColor }}>
          <span className="font-black" style={{ color: homeTeam.secondaryColor, fontFamily: theme.numberFont, fontSize: px('score', 24) }}>{homeScore}</span>
        </div>
        <div className="flex-1">
          <div className="font-bold" style={{ fontFamily: theme.headerFont, color: theme.textColor, fontSize: px('teamName', 18) }}>
            {homeTeam.displayName || homeTeam.teamName}
          </div>
          {homeTeam.record && <div style={{ color: theme.textSecondary, fontSize: px('record', 14) }}>{homeTeam.record}</div>}
        </div>
        {homeWon && <span style={{ fontSize: px('score', 24) }}>👑</span>}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full px-4">
        <div className="flex-1 h-px" style={{ backgroundColor: theme.textSecondary + '30' }} />
        <span className="font-bold" style={{ color: theme.textSecondary, fontSize: px('timer', 14) }}>Q{game.quarter} · {game.timeRemaining}</span>
        <div className="flex-1 h-px" style={{ backgroundColor: theme.textSecondary + '30' }} />
      </div>

      {/* Away */}
      <div className="flex items-center gap-4 w-full px-4">
        <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: awayTeam.primaryColor }}>
          <span className="font-black" style={{ color: awayTeam.secondaryColor, fontFamily: theme.numberFont, fontSize: px('score', 24) }}>{awayScore}</span>
        </div>
        <div className="flex-1">
          <div className="font-bold" style={{ fontFamily: theme.headerFont, color: theme.textColor, fontSize: px('teamName', 18) }}>
            {awayTeam.displayName || awayTeam.teamName}
          </div>
          {awayTeam.record && <div style={{ color: theme.textSecondary, fontSize: px('record', 14) }}>{awayTeam.record}</div>}
        </div>
        {awayWon && <span style={{ fontSize: px('score', 24) }}>👑</span>}
      </div>
    </div>
  );

  const renderVersusLayout = () => (
    <div className="flex items-center gap-6">
      {/* Home */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
          style={{
            backgroundColor: homeTeam.primaryColor,
            boxShadow: homeWon && options.showWinnerGlow ? `0 0 30px ${homeTeam.primaryColor}` : undefined,
          }}
        >
          <span className="font-black" style={{ fontFamily: theme.numberFont, fontSize: px('score', 42), color: homeTeam.secondaryColor }}>
            {homeScore}
          </span>
        </div>
        <span className="font-bold text-center" style={{ fontFamily: theme.headerFont, fontSize: px('teamName', 18), color: theme.textColor }}>
          {homeTeam.displayName || homeTeam.teamName}
        </span>
      </div>

      {/* VS */}
      <div className="flex flex-col items-center">
        <span
          className="font-black italic"
          style={{
            fontFamily: theme.headerFont,
            fontSize: px('quarter', 48),
            color: theme.accentColor,
            textShadow: `0 0 20px ${theme.accentColor}50`,
          }}
        >
          VS
        </span>
        <div className="mt-2" style={{ color: theme.textSecondary, fontSize: px('timer', 12) }}>Q{game.quarter} · {game.timeRemaining}</div>
      </div>

      {/* Away */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
          style={{
            backgroundColor: awayTeam.primaryColor,
            boxShadow: awayWon && options.showWinnerGlow ? `0 0 30px ${awayTeam.primaryColor}` : undefined,
          }}
        >
          <span className="font-black" style={{ fontFamily: theme.numberFont, fontSize: px('score', 42), color: awayTeam.secondaryColor }}>
            {awayScore}
          </span>
        </div>
        <span className="font-bold text-center" style={{ fontFamily: theme.headerFont, fontSize: px('teamName', 18), color: theme.textColor }}>
          {awayTeam.displayName || awayTeam.teamName}
        </span>
      </div>
    </div>
  );

  const renderLayout = () => {
    switch (options.layoutStyle) {
      case 'broadcast': return renderBroadcastLayout();
      case 'minimal': return renderMinimalLayout();
      case 'vertical': return renderVerticalLayout();
      case 'versus': return renderVersusLayout();
      default: return renderClassicLayout();
    }
  };

  const renderExportableScoreboard = () => (
    <div
      ref={previewRef}
      data-export-scoreboard
      className="relative flex flex-col items-center justify-center"
      style={{
        ...getBackgroundStyle(),
        ...getBorderStyle(),
        ...getAspectRatioStyle(),
        padding: '28px 36px',
        borderRadius: options.backgroundStyle === 'transparent' ? 0 : '16px',
      }}
    >
      {/* Game Title */}
      {game.title && (
        <div
          className="text-center font-bold tracking-wide uppercase mb-4"
          style={{
            fontFamily: theme.headerFont,
            fontSize: px('title', 24),
            color: '#ffffff',
            letterSpacing: '0.08em',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {game.title}
        </div>
      )}

      {/* Main Scoreboard */}
      {renderLayout()}

      {/* Target Score Bar */}
      {options.includeTargetBar && game.targetScore && (
        <div className="w-full max-w-md mt-4">
          <TargetScoreBar
            homeScore={homeScore}
            awayScore={awayScore}
            targetScore={game.targetScore}
            homeColor={homeTeam.primaryColor}
            awayColor={awayTeam.primaryColor}
            theme={theme}
          />
        </div>
      )}

      {/* Top Scorers */}
      {options.includeTopScorers && (
        <div className="flex items-center justify-center gap-8 mt-4 pt-4" style={{ borderTop: `1px solid ${theme.textSecondary}30` }}>
          <div className="text-center">
            <div className="uppercase tracking-wide mb-1" style={{ color: theme.textSecondary, fontSize: px('statHeader', 12) }}>Top Scorer</div>
            <div className="font-bold" style={{ color: homeTeam.primaryColor, fontSize: px('playerName', 16) }}>
              #{homeTopScorer?.jerseyNumber} {homeTopScorer?.playerName}
            </div>
            <div className="font-black" style={{ color: theme.textColor, fontSize: px('statValue', 14) }}>{homeTopScorer?.points} PTS</div>
          </div>
          <div className="text-center">
            <div className="uppercase tracking-wide mb-1" style={{ color: theme.textSecondary, fontSize: px('statHeader', 12) }}>Top Scorer</div>
            <div className="font-bold" style={{ color: awayTeam.primaryColor, fontSize: px('playerName', 16) }}>
              #{awayTopScorer?.jerseyNumber} {awayTopScorer?.playerName}
            </div>
            <div className="font-black" style={{ color: theme.textColor, fontSize: px('statValue', 14) }}>{awayTopScorer?.points} PTS</div>
          </div>
        </div>
      )}

      {/* Date/Time */}
      {options.showDateTime && (
        <div className="mt-4 text-xs" style={{ color: theme.textSecondary }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      )}

      {/* Winner Banner */}
      {hasWinner && options.showWinnerGlow && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg"
          style={{
            backgroundColor: winnerColor || theme.accentColor,
            color: '#fff',
          }}
        >
          🏆 Winner
        </div>
      )}

      {/* Watermark */}
      {options.showWatermark && options.watermarkText && (
        <div
          className="absolute bottom-2 right-3 opacity-50 text-xs font-medium tracking-wide"
          style={{ fontFamily: theme.bodyFont, color: theme.textSecondary }}
        >
          {options.watermarkText}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{ backgroundColor: theme.secondaryBackground }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-4 border-b"
          style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.textSecondary + '20' }}
        >
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: theme.headerFont, color: theme.textColor }}>
            <span>📷</span> Export Scoreboard
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80"
            style={{ backgroundColor: theme.backgroundColor, color: theme.textSecondary }}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
                Preview
              </h3>
              <div
                className="rounded-lg p-6 flex items-center justify-center overflow-auto min-h-[300px]"
                style={{
                  backgroundColor: theme.backgroundColor,
                  backgroundImage: options.backgroundStyle === 'transparent'
                    ? 'repeating-conic-gradient(#808080 0% 25%, #606060 0% 50%)'
                    : 'none',
                  backgroundSize: '16px 16px',
                }}
              >
                <div className="transform scale-[0.55] origin-center">
                  {renderExportableScoreboard()}
                </div>
              </div>
            </div>

            {/* Options Section */}
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: theme.backgroundColor }}>
                {(['layout', 'background', 'extras'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all capitalize"
                    style={{
                      backgroundColor: activeTab === tab ? theme.accentColor : 'transparent',
                      color: activeTab === tab ? '#fff' : theme.textSecondary,
                    }}
                  >
                    {tab === 'layout' ? '🎨 Layout' : tab === 'background' ? '🖼️ Background' : '✨ Extras'}
                  </button>
                ))}
              </div>

              {/* Layout Tab */}
              {activeTab === 'layout' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <span className="block text-sm font-medium" style={{ color: theme.textColor }}>Layout Style</span>
                    <div className="grid grid-cols-2 gap-2">
                      {(['classic', 'broadcast', 'minimal', 'vertical', 'versus'] as LayoutStyle[]).map((style) => (
                        <button
                          key={style}
                          onClick={() => setOptions(prev => ({ ...prev, layoutStyle: style }))}
                          className="px-3 py-3 rounded-lg text-sm font-medium transition-all text-left"
                          style={{
                            backgroundColor: options.layoutStyle === style ? theme.accentColor : theme.backgroundColor,
                            color: options.layoutStyle === style ? '#fff' : theme.textColor,
                            border: `1px solid ${options.layoutStyle === style ? theme.accentColor : theme.textSecondary + '40'}`,
                          }}
                        >
                          <div className="font-bold capitalize">{style}</div>
                          <div className="text-xs opacity-70 mt-0.5">{layoutDescriptions[style]}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="block text-sm font-medium" style={{ color: theme.textColor }}>Aspect Ratio</span>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { value: 'auto', label: 'Auto', icon: '📐' },
                        { value: 'square', label: 'Square', icon: '⬜' },
                        { value: 'wide', label: '16:9', icon: '📺' },
                        { value: 'story', label: 'Story', icon: '📱' },
                      ] as const).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setOptions(prev => ({ ...prev, aspectRatio: opt.value }))}
                          className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            backgroundColor: options.aspectRatio === opt.value ? theme.accentColor : theme.backgroundColor,
                            color: options.aspectRatio === opt.value ? '#fff' : theme.textSecondary,
                          }}
                        >
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="block text-sm font-medium" style={{ color: theme.textColor }}>Border Style</span>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { value: 'none', label: 'None' },
                        { value: 'solid', label: 'Solid' },
                        { value: 'gradient', label: 'Team Colors' },
                        { value: 'glow', label: 'Glow' },
                      ] as const).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setOptions(prev => ({ ...prev, borderStyle: opt.value }))}
                          className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            backgroundColor: options.borderStyle === opt.value ? theme.accentColor : theme.backgroundColor,
                            color: options.borderStyle === opt.value ? '#fff' : theme.textSecondary,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Background Tab */}
              {activeTab === 'background' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <span className="block text-sm font-medium" style={{ color: theme.textColor }}>Background Style</span>
                    <div className="flex flex-wrap gap-2">
                      {(['solid', 'gradient', 'radial', 'pattern', 'transparent'] as BackgroundStyle[]).map((style) => (
                        <button
                          key={style}
                          onClick={() => setOptions(prev => ({ ...prev, backgroundStyle: style }))}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                          style={{
                            backgroundColor: options.backgroundStyle === style ? theme.accentColor : theme.backgroundColor,
                            color: options.backgroundStyle === style ? '#fff' : theme.textSecondary,
                          }}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {options.backgroundStyle !== 'transparent' && (
                    <div className="space-y-3">
                      <span className="block text-sm font-medium" style={{ color: theme.textColor }}>Colors</span>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-xs mb-1 block" style={{ color: theme.textSecondary }}>Primary</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={options.customBackgroundColor}
                              onChange={(e) => setOptions(prev => ({ ...prev, customBackgroundColor: e.target.value }))}
                              className="w-10 h-10 rounded cursor-pointer border-0"
                            />
                            <input
                              type="text"
                              value={options.customBackgroundColor}
                              onChange={(e) => setOptions(prev => ({ ...prev, customBackgroundColor: e.target.value }))}
                              className="flex-1 px-2 py-1 rounded border text-sm"
                              style={{ backgroundColor: theme.backgroundColor, borderColor: theme.textSecondary + '40', color: theme.textColor }}
                            />
                          </div>
                        </div>
                        {(options.backgroundStyle === 'gradient' || options.backgroundStyle === 'radial') && (
                          <div className="flex-1">
                            <label className="text-xs mb-1 block" style={{ color: theme.textSecondary }}>Secondary</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={options.gradientEndColor}
                                onChange={(e) => setOptions(prev => ({ ...prev, gradientEndColor: e.target.value }))}
                                className="w-10 h-10 rounded cursor-pointer border-0"
                              />
                              <input
                                type="text"
                                value={options.gradientEndColor}
                                onChange={(e) => setOptions(prev => ({ ...prev, gradientEndColor: e.target.value }))}
                                className="flex-1 px-2 py-1 rounded border text-sm"
                                style={{ backgroundColor: theme.backgroundColor, borderColor: theme.textSecondary + '40', color: theme.textColor }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {options.backgroundStyle === 'pattern' && (
                    <div className="space-y-3">
                      <span className="block text-sm font-medium" style={{ color: theme.textColor }}>Pattern Type</span>
                      <div className="flex flex-wrap gap-2">
                        {(['dots', 'grid', 'stripes', 'court'] as const).map((pattern) => (
                          <button
                            key={pattern}
                            onClick={() => setOptions(prev => ({ ...prev, patternType: pattern }))}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                            style={{
                              backgroundColor: options.patternType === pattern ? theme.accentColor : theme.backgroundColor,
                              color: options.patternType === pattern ? '#fff' : theme.textSecondary,
                            }}
                          >
                            {pattern}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Extras Tab */}
              {activeTab === 'extras' && (
                <div className="space-y-4">
                  {game.targetScore && (
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors hover:bg-black/10" style={{ backgroundColor: theme.backgroundColor }}>
                      <input
                        type="checkbox"
                        checked={options.includeTargetBar}
                        onChange={(e) => setOptions(prev => ({ ...prev, includeTargetBar: e.target.checked }))}
                        className="w-5 h-5 rounded"
                        style={{ accentColor: theme.accentColor }}
                      />
                      <div>
                        <div style={{ color: theme.textColor }}>🎯 Include progress bar</div>
                        <div className="text-xs" style={{ color: theme.textSecondary }}>Shows target score progress</div>
                      </div>
                    </label>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors hover:bg-black/10" style={{ backgroundColor: theme.backgroundColor }}>
                    <input
                      type="checkbox"
                      checked={options.includeTopScorers}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeTopScorers: e.target.checked }))}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: theme.accentColor }}
                    />
                    <div>
                      <div style={{ color: theme.textColor }}>⭐ Show top scorers</div>
                      <div className="text-xs" style={{ color: theme.textSecondary }}>Display leading scorer for each team</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors hover:bg-black/10" style={{ backgroundColor: theme.backgroundColor }}>
                    <input
                      type="checkbox"
                      checked={options.showWinnerGlow}
                      onChange={(e) => setOptions(prev => ({ ...prev, showWinnerGlow: e.target.checked }))}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: theme.accentColor }}
                    />
                    <div>
                      <div style={{ color: theme.textColor }}>🏆 Winner effects</div>
                      <div className="text-xs" style={{ color: theme.textSecondary }}>Glow and banner when a team wins</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors hover:bg-black/10" style={{ backgroundColor: theme.backgroundColor }}>
                    <input
                      type="checkbox"
                      checked={options.showDateTime}
                      onChange={(e) => setOptions(prev => ({ ...prev, showDateTime: e.target.checked }))}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: theme.accentColor }}
                    />
                    <div>
                      <div style={{ color: theme.textColor }}>📅 Show date</div>
                      <div className="text-xs" style={{ color: theme.textSecondary }}>Display current date on export</div>
                    </div>
                  </label>

                  <div className="space-y-3 p-3 rounded-lg" style={{ backgroundColor: theme.backgroundColor }}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.showWatermark}
                        onChange={(e) => setOptions(prev => ({ ...prev, showWatermark: e.target.checked }))}
                        className="w-5 h-5 rounded"
                        style={{ accentColor: theme.accentColor }}
                      />
                      <div style={{ color: theme.textColor }}>💧 Add watermark</div>
                    </label>
                    {options.showWatermark && (
                      <input
                        type="text"
                        value={options.watermarkText}
                        onChange={(e) => setOptions(prev => ({ ...prev, watermarkText: e.target.value }))}
                        placeholder="Watermark text..."
                        className="w-full px-3 py-2 rounded-lg border focus:outline-none"
                        style={{
                          backgroundColor: theme.secondaryBackground,
                          borderColor: theme.textSecondary + '40',
                          color: theme.textColor,
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: theme.backgroundColor,
                color: theme.textSecondary,
                border: `1px solid ${theme.textSecondary}40`,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-8 py-3 rounded-lg font-medium transition-all hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: theme.accentColor, color: '#fff' }}
            >
              {isExporting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Exporting...
                </>
              ) : (
                <>
                  <span>📥</span>
                  Download PNG
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
