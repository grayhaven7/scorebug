import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function MatchSetupPage() {
  const navigate = useNavigate();
  const { teams, startGame, currentGame, currentTheme } = useApp();
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');

  const homeTeam = teams.find(t => t.id === homeTeamId);
  const awayTeam = teams.find(t => t.id === awayTeamId);

  const canStart = homeTeamId && awayTeamId && homeTeamId !== awayTeamId;

  const handleStartGame = () => {
    if (!canStart) return;
    startGame(homeTeamId, awayTeamId);
    navigate('/game');
  };

  const handleResumeGame = () => {
    navigate('/game');
  };

  const selectStyle = {
    backgroundColor: currentTheme.backgroundColor,
    borderColor: currentTheme.textSecondary + '40',
    color: currentTheme.textColor,
    borderRadius: currentTheme.borderRadius,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1
          className="text-4xl font-bold tracking-wide mb-2"
          style={{ fontFamily: currentTheme.headerFont }}
        >
          MATCH SETUP
        </h1>
        <p style={{ color: currentTheme.textSecondary }}>
          Select the teams and start tracking
        </p>
      </div>

      {/* Resume Current Game Banner */}
      {currentGame && (
        <div
          className="mb-8 p-4 rounded-xl border-2 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{
            backgroundColor: currentTheme.accentColor + '10',
            borderColor: currentTheme.accentColor,
            borderRadius: currentTheme.borderRadius,
          }}
        >
          <div className="text-center md:text-left">
            <p className="font-bold" style={{ color: currentTheme.accentColor }}>
              Game in Progress
            </p>
            <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
              {currentGame.homeTeam.teamName} vs {currentGame.awayTeam.teamName} • Q{currentGame.quarter}
            </p>
          </div>
          <button
            onClick={handleResumeGame}
            className="w-full md:w-auto px-6 py-2 rounded-lg font-bold transition-all hover:scale-105"
            style={{
              backgroundColor: currentTheme.accentColor,
              color: '#fff',
              borderRadius: currentTheme.borderRadius,
            }}
          >
            Resume Game
          </button>
        </div>
      )}

      {teams.length < 2 ? (
        /* Not Enough Teams */
        <div
          className="text-center py-16 rounded-xl"
          style={{ backgroundColor: currentTheme.secondaryBackground }}
        >
          <div className="text-6xl mb-4">🏀</div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ fontFamily: currentTheme.headerFont }}
          >
            NEED MORE TEAMS
          </h2>
          <p className="mb-6" style={{ color: currentTheme.textSecondary }}>
            Create at least 2 teams to start a match
          </p>
          <Link
            to="/teams"
            className="inline-block px-6 py-3 rounded-lg font-bold transition-all hover:scale-105"
            style={{
              backgroundColor: currentTheme.accentColor,
              color: '#fff',
              borderRadius: currentTheme.borderRadius,
            }}
          >
            Create Teams
          </Link>
        </div>
      ) : (
        /* Team Selection */
        <div className="space-y-8">
          {/* VS Layout */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
            {/* Home Team */}
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: currentTheme.secondaryBackground }}
            >
              <label
                className="block text-sm font-medium mb-3"
                style={{ color: currentTheme.textSecondary }}
              >
                HOME TEAM
              </label>
              <select
                value={homeTeamId}
                onChange={e => setHomeTeamId(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 cursor-pointer"
                style={selectStyle}
              >
                <option value="">Select home team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id} disabled={team.id === awayTeamId}>
                    {team.name}
                  </option>
                ))}
              </select>

              {/* Home Team Preview */}
              {homeTeam && (
                <div className="mt-4">
                  <div
                    className="h-20 rounded-lg flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${homeTeam.primaryColor} 0%, ${homeTeam.primaryColor} 60%, ${homeTeam.secondaryColor} 60%, ${homeTeam.secondaryColor} 100%)`,
                      borderRadius: currentTheme.borderRadius,
                    }}
                  >
                    <span
                      className="text-xl font-bold text-white drop-shadow-lg"
                      style={{ fontFamily: currentTheme.headerFont }}
                    >
                      {homeTeam.name}
                    </span>
                  </div>
                  <p className="text-sm mt-2" style={{ color: currentTheme.textSecondary }}>
                    {homeTeam.players.length} players on roster
                  </p>
                </div>
              )}
            </div>

            {/* VS Badge */}
            <div className="flex items-center justify-center py-4 md:py-0">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black"
                style={{
                  backgroundColor: currentTheme.accentColor,
                  fontFamily: currentTheme.headerFont,
                }}
              >
                VS
              </div>
            </div>

            {/* Away Team */}
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: currentTheme.secondaryBackground }}
            >
              <label
                className="block text-sm font-medium mb-3"
                style={{ color: currentTheme.textSecondary }}
              >
                AWAY TEAM
              </label>
              <select
                value={awayTeamId}
                onChange={e => setAwayTeamId(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 cursor-pointer"
                style={selectStyle}
              >
                <option value="">Select away team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id} disabled={team.id === homeTeamId}>
                    {team.name}
                  </option>
                ))}
              </select>

              {/* Away Team Preview */}
              {awayTeam && (
                <div className="mt-4">
                  <div
                    className="h-20 rounded-lg flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${awayTeam.primaryColor} 0%, ${awayTeam.primaryColor} 60%, ${awayTeam.secondaryColor} 60%, ${awayTeam.secondaryColor} 100%)`,
                      borderRadius: currentTheme.borderRadius,
                    }}
                  >
                    <span
                      className="text-xl font-bold text-white drop-shadow-lg"
                      style={{ fontFamily: currentTheme.headerFont }}
                    >
                      {awayTeam.name}
                    </span>
                  </div>
                  <p className="text-sm mt-2" style={{ color: currentTheme.textSecondary }}>
                    {awayTeam.players.length} players on roster
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Start Game Button */}
          <div className="text-center">
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className="w-full md:w-auto px-12 py-4 rounded-xl text-xl font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                backgroundColor: canStart ? currentTheme.accentColor : currentTheme.textSecondary,
                color: '#fff',
                borderRadius: currentTheme.borderRadius,
                fontFamily: currentTheme.headerFont,
              }}
            >
              🏀 START GAME
            </button>
            {!canStart && homeTeamId && awayTeamId && homeTeamId === awayTeamId && (
              <p className="mt-2 text-sm text-red-400">
                Please select different teams for home and away
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

