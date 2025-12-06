import type { Theme } from '../types';

interface TargetScoreBarProps {
  homeScore: number;
  awayScore: number;
  targetScore: number;
  homeColor: string;
  awayColor: string;
  theme: Theme;
}

export function TargetScoreBar({
  homeScore,
  awayScore,
  targetScore,
  homeColor,
  awayColor,
  theme,
}: TargetScoreBarProps) {
  // Calculate fill percentages (max 100% of the half-bar)
  const homePercent = Math.min(100, (homeScore / targetScore) * 100);
  const awayPercent = Math.min(100, (awayScore / targetScore) * 100);

  return (
    <div className="flex flex-row items-center w-full max-w-2xl px-2 md:px-4 py-2">
      {/* Home Score (Left) */}
      <div 
        className="text-lg md:text-xl font-bold mr-2 md:mr-3"
        style={{ 
          fontFamily: theme.numberFont,
          color: theme.textColor 
        }}
      >
        {homeScore}
      </div>

      {/* Bar Container */}
      <div className="flex-1 relative flex items-center">
        {/* Background Bar */}
        <div 
          className="absolute inset-x-0 h-3 md:h-4 rounded-full overflow-hidden flex flex-row"
          style={{ backgroundColor: theme.secondaryBackground }}
        >
          {/* Left Half (Home) */}
          <div className="flex-1 h-full relative border-r" style={{ borderColor: theme.backgroundColor }}>
            {/* Fill growing from left to right */}
            <div 
              className="absolute top-0 left-0 h-full transition-all duration-500 ease-out"
              style={{ 
                width: `${homePercent}%`,
                backgroundColor: homeColor 
              }}
            />
          </div>

          {/* Right Half (Away) */}
          <div className="flex-1 h-full relative border-l" style={{ borderColor: theme.backgroundColor }}>
            {/* Fill growing from right to left */}
            <div 
              className="absolute top-0 right-0 h-full transition-all duration-500 ease-out"
              style={{ 
                width: `${awayPercent}%`,
                backgroundColor: awayColor 
              }}
            />
          </div>
        </div>

        {/* Center Target Marker */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full border-4 flex items-center justify-center font-bold text-xs md:text-sm shadow-xl transition-all hover:scale-110"
          style={{ 
            backgroundColor: theme.backgroundColor,
            borderColor: theme.secondaryBackground,
            color: theme.textColor,
            fontFamily: theme.numberFont
          }}
        >
          {targetScore}
        </div>
      </div>

      {/* Away Score (Right) */}
      <div 
        className="text-lg md:text-xl font-bold ml-2 md:ml-3"
        style={{ 
          fontFamily: theme.numberFont,
          color: theme.textColor 
        }}
      >
        {awayScore}
      </div>
    </div>
  );
}
