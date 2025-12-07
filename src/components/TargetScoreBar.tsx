import { useRef, useEffect, useState } from 'react';
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
  const barContainerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const [maxPercent, setMaxPercent] = useState(85); // Default fallback

  const calculateMaxPercent = () => {
    // Calculate the exact percentage needed to reach the circle edge
    if (barContainerRef.current && circleRef.current) {
      const containerWidth = barContainerRef.current.offsetWidth;
      const circleWidth = circleRef.current.offsetWidth;
      const halfBarWidth = containerWidth / 2;
      // Calculate what percentage of the half-bar reaches the circle edge
      // This is the maximum percentage the bar should reach when score = targetScore
      const calculatedMax = ((halfBarWidth - circleWidth / 2) / halfBarWidth) * 100;
      setMaxPercent(Math.max(70, Math.min(95, calculatedMax))); // Clamp between 70-95%
    }
  };

  useEffect(() => {
    calculateMaxPercent();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateMaxPercent);
    return () => window.removeEventListener('resize', calculateMaxPercent);
  }, []);

  // Calculate fill percentages - bar reaches circle edge exactly when score = target
  // Scale linearly from 0 to maxPercent as score goes from 0 to targetScore
  // The bar should only reach maxPercent (touching the circle) when score exactly equals targetScore
  const homePercent = targetScore > 0 
    ? Math.min(maxPercent, (homeScore / targetScore) * maxPercent)
    : 0;
  const awayPercent = targetScore > 0 
    ? Math.min(maxPercent, (awayScore / targetScore) * maxPercent)
    : 0;
  
  // Determine winner (if any team has reached or exceeded target)
  const homeWon = homeScore >= targetScore;
  const awayWon = awayScore >= targetScore;
  const winnerColor = homeWon ? homeColor : awayWon ? awayColor : null;

  return (
    <div className="flex flex-row items-center w-full max-w-2xl px-1 xs:px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 lg:py-4">
      {/* Home Score (Left) */}
      <div 
        className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold mr-1 xs:mr-2 sm:mr-3 md:mr-4 shrink-0"
        style={{ 
          fontFamily: theme.numberFont,
          color: theme.textColor 
        }}
      >
        {homeScore}
      </div>

      {/* Bar Container */}
      <div ref={barContainerRef} className="flex-1 relative flex items-center justify-center min-w-0">
        {/* Background Bar */}
        <div 
          className="absolute inset-x-0 h-2.5 xs:h-3 sm:h-4 md:h-5 lg:h-6 rounded-full overflow-hidden flex flex-row shadow-inner"
          style={{ backgroundColor: theme.backgroundColor }}
        >
          {/* Left Half (Home) */}
          <div className="flex-1 h-full relative border-r-2" style={{ borderColor: theme.secondaryBackground }}>
            {/* Fill growing from left to right, extending to center circle */}
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
            {/* Fill growing from right to left, extending to center circle */}
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
          ref={circleRef}
          className="relative z-10 w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full border-[3px] xs:border-[3.5px] sm:border-[4px] md:border-[5px] lg:border-[6px] flex items-center justify-center font-bold text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl shadow-2xl transition-all hover:scale-110 shrink-0"
          style={{ 
            backgroundColor: winnerColor || theme.secondaryBackground,
            borderColor: winnerColor || theme.backgroundColor,
            color: winnerColor ? '#ffffff' : theme.textColor,
            fontFamily: theme.numberFont
          }}
        >
          {targetScore}
        </div>
      </div>

      {/* Away Score (Right) */}
      <div 
        className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold ml-1 xs:ml-2 sm:ml-3 md:ml-4 shrink-0"
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
