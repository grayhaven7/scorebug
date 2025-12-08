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

  // Determine winner (if any team has reached or exceeded target)
  const homeWon = homeScore >= targetScore;
  const awayWon = awayScore >= targetScore;
  const winnerColor = homeWon ? homeColor : awayWon ? awayColor : null;
  const hasWinner = homeWon || awayWon;
  
  // Calculate fill percentages - bar reaches circle edge exactly when score = target
  // Scale linearly from 0 to maxPercent as score goes from 0 to targetScore
  // When a team wins, extend to 100% to fully reach the circle edge with no gap
  const homePercent = targetScore > 0 
    ? (homeWon ? 100 : Math.min(maxPercent, (homeScore / targetScore) * maxPercent))
    : 0;
  const awayPercent = targetScore > 0 
    ? (awayWon ? 100 : Math.min(maxPercent, (awayScore / targetScore) * maxPercent))
    : 0;

  return (
    <div className="flex flex-row items-center w-full max-w-4xl mx-1 xs:mx-2 sm:mx-3 md:mx-4 lg:mx-3 xl:mx-3 px-1 xs:px-2 sm:px-3 md:px-4 lg:px-3 xl:px-3 py-1 xs:py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2">
      {/* Home Score (Left) */}
      <div 
        className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-xl font-bold mr-1 xs:mr-1.5 sm:mr-2 md:mr-2.5 lg:mr-2 xl:mr-2 shrink-0"
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
          className="absolute inset-x-0 h-4 xs:h-5 sm:h-5 md:h-6 lg:h-4 xl:h-4 rounded-full overflow-hidden flex flex-row shadow-inner"
          style={{ backgroundColor: theme.backgroundColor }}
        >
          {/* Left Half (Home) */}
          <div 
            className={`flex-1 h-full relative ${hasWinner ? '' : 'border-r-2'}`}
            style={hasWinner ? {} : { borderColor: theme.secondaryBackground }}
          >
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
          <div 
            className={`flex-1 h-full relative ${hasWinner ? '' : 'border-l-2'}`}
            style={hasWinner ? {} : { borderColor: theme.secondaryBackground }}
          >
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
          className="relative z-10 w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-16 lg:h-16 xl:w-16 xl:h-16 rounded-full border-[3px] xs:border-[3.5px] sm:border-[4px] md:border-[4.5px] lg:border-[3.5px] xl:border-[3.5px] flex items-center justify-center font-bold text-sm xs:text-base sm:text-lg md:text-xl lg:text-lg xl:text-lg shadow-2xl transition-all hover:scale-110 shrink-0"
          style={{ 
            backgroundColor: winnerColor || theme.backgroundColor,
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
        className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-xl font-bold ml-1 xs:ml-1.5 sm:ml-2 md:ml-2.5 lg:ml-2 xl:ml-2 shrink-0"
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
