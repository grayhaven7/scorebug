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
    <div className="flex flex-row items-center w-full max-w-2xl px-2 md:px-4 py-3 md:py-4">
      {/* Home Score (Left) */}
      <div 
        className="text-xl md:text-2xl font-bold mr-3 md:mr-4"
        style={{ 
          fontFamily: theme.numberFont,
          color: theme.textColor 
        }}
      >
        {homeScore}
      </div>

      {/* Bar Container */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Background Bar */}
        <div 
          className="absolute inset-x-0 h-4 md:h-6 rounded-full overflow-hidden flex flex-row shadow-inner"
          style={{ backgroundColor: theme.backgroundColor }}
        >
          {/* Left Half (Home) */}
          <div className="flex-1 h-full relative border-r-2" style={{ borderColor: theme.secondaryBackground }}>
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
          <div className="flex-1 h-full relative border-l-2" style={{ borderColor: theme.secondaryBackground }}>
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
          className="relative z-10 w-12 h-12 md:w-16 md:h-16 rounded-full border-[6px] flex items-center justify-center font-bold text-lg md:text-xl shadow-2xl transition-all hover:scale-110"
          style={{ 
            backgroundColor: theme.secondaryBackground,
            borderColor: theme.backgroundColor,
            color: theme.textColor,
            fontFamily: theme.numberFont
          }}
        >
          {targetScore}
        </div>
      </div>

      {/* Away Score (Right) */}
      <div 
        className="text-xl md:text-2xl font-bold ml-3 md:ml-4"
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
