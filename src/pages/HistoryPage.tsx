import { useApp } from '../context/AppContext';
import { statLabels } from '../types';
import type { StatType, PlayerGameStats } from '../types';

export function HistoryPage() {
  const { games, currentTheme, settings, deleteGame } = useApp();

  // Sort by most recent first
  const sortedGames = [...games].sort((a, b) => b.createdAt - a.createdAt);

  const calculateTotal = (players: PlayerGameStats[], stat: StatType) =>
    players.reduce((sum, p) => sum + (p[stat] || 0), 0);

  const enabledStats = Object.entries(settings.statsConfig)
    .filter(([, enabled]) => enabled)
    .map(([stat]) => stat as StatType);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold tracking-wide mb-2"
          style={{ fontFamily: currentTheme.headerFont }}
        >
          GAME HISTORY
        </h1>
        <p style={{ color: currentTheme.textSecondary }}>
          Review completed games and stats
        </p>
      </div>

      {sortedGames.length > 0 ? (
        <div className="space-y-6">
          {sortedGames.map(game => {
            const homeScore = calculateTotal(game.homeTeam.players, 'points');
            const awayScore = calculateTotal(game.awayTeam.players, 'points');
            const homeWon = homeScore > awayScore;

            return (
              <div
                key={game.id}
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: currentTheme.secondaryBackground }}
              >
                {/* Game Header */}
                <div
                  className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                  style={{ backgroundColor: currentTheme.backgroundColor }}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                    {/* Home Team */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-black text-lg sm:text-xl ${
                          homeWon ? 'ring-2 ring-yellow-400' : ''
                        }`}
                        style={{
                          backgroundColor: game.homeTeam.primaryColor,
                          color: game.homeTeam.secondaryColor,
                          fontFamily: currentTheme.numberFont,
                        }}
                      >
                        {homeScore}
                      </div>
                      <div className="text-left">
                        <p
                          className={`font-bold text-sm sm:text-base ${homeWon ? 'text-yellow-400' : ''}`}
                          style={{ fontFamily: currentTheme.headerFont }}
                        >
                          {game.homeTeam.teamName}
                        </p>
                        <p className="text-[10px] sm:text-xs" style={{ color: currentTheme.textSecondary }}>
                          HOME {homeWon && '• WINNER'}
                        </p>
                      </div>
                    </div>

                    {/* VS */}
                    <span className="text-sm sm:text-lg font-bold" style={{ color: currentTheme.textSecondary }}>
                      VS
                    </span>

                    {/* Away Team */}
                    <div className="flex items-center gap-2 sm:gap-3 text-right">
                      <div>
                        <p
                          className={`font-bold text-sm sm:text-base ${!homeWon ? 'text-yellow-400' : ''}`}
                          style={{ fontFamily: currentTheme.headerFont }}
                        >
                          {game.awayTeam.teamName}
                        </p>
                        <p className="text-[10px] sm:text-xs" style={{ color: currentTheme.textSecondary }}>
                          AWAY {!homeWon && awayScore > homeScore && '• WINNER'}
                        </p>
                      </div>
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-black text-lg sm:text-xl ${
                          !homeWon && awayScore > homeScore ? 'ring-2 ring-yellow-400' : ''
                        }`}
                        style={{
                          backgroundColor: game.awayTeam.primaryColor,
                          color: game.awayTeam.secondaryColor,
                          fontFamily: currentTheme.numberFont,
                        }}
                      >
                        {awayScore}
                      </div>
                    </div>
                  </div>

                  <div className="text-center sm:text-right w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0 flex flex-col items-center sm:items-end gap-2" style={{ borderColor: currentTheme.textSecondary + '20' }}>
                    <div>
                      <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                        {formatDate(game.createdAt)}
                      </p>
                      <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                        Final • Q{game.quarter}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this game?')) {
                          deleteGame(game.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      style={{ borderRadius: currentTheme.borderRadius }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Stats Summary */}
                <details className="group">
                  <summary
                    className="px-4 py-3 cursor-pointer flex items-center justify-between text-sm font-medium"
                    style={{ color: currentTheme.accentColor }}
                  >
                    View Full Box Score
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-4 border-t" style={{ borderColor: currentTheme.backgroundColor }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Home Team Stats */}
                      <div className="overflow-x-auto">
                        <h4
                          className="text-sm font-bold mb-2 px-2 py-1 rounded inline-block"
                          style={{
                            backgroundColor: game.homeTeam.primaryColor,
                            color: game.homeTeam.secondaryColor,
                          }}
                        >
                          {game.homeTeam.teamName}
                        </h4>
                        <table className="w-full text-sm min-w-[500px]">
                          <thead>
                            <tr>
                              <th className="text-left px-2 py-1 text-xs" style={{ color: currentTheme.textSecondary }}>
                                #
                              </th>
                              <th className="text-left px-2 py-1 text-xs" style={{ color: currentTheme.textSecondary }}>
                                Player
                              </th>
                              {enabledStats.map(stat => (
                                <th
                                  key={stat}
                                  className="text-center px-2 py-1 text-xs"
                                  style={{ color: currentTheme.textSecondary }}
                                >
                                  {statLabels[stat]}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {game.homeTeam.players.map(player => (
                              <tr key={player.playerId}>
                                <td className="px-2 py-1 font-mono text-xs">{player.jerseyNumber}</td>
                                <td className="px-2 py-1">{player.playerName}</td>
                                {enabledStats.map(stat => (
                                  <td key={stat} className="text-center px-2 py-1">
                                    {player[stat] || 0}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Away Team Stats */}
                      <div className="overflow-x-auto">
                        <h4
                          className="text-sm font-bold mb-2 px-2 py-1 rounded inline-block"
                          style={{
                            backgroundColor: game.awayTeam.primaryColor,
                            color: game.awayTeam.secondaryColor,
                          }}
                        >
                          {game.awayTeam.teamName}
                        </h4>
                        <table className="w-full text-sm min-w-[500px]">
                          <thead>
                            <tr>
                              <th className="text-left px-2 py-1 text-xs" style={{ color: currentTheme.textSecondary }}>
                                #
                              </th>
                              <th className="text-left px-2 py-1 text-xs" style={{ color: currentTheme.textSecondary }}>
                                Player
                              </th>
                              {enabledStats.map(stat => (
                                <th
                                  key={stat}
                                  className="text-center px-2 py-1 text-xs"
                                  style={{ color: currentTheme.textSecondary }}
                                >
                                  {statLabels[stat]}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {game.awayTeam.players.map(player => (
                              <tr key={player.playerId}>
                                <td className="px-2 py-1 font-mono text-xs">{player.jerseyNumber}</td>
                                <td className="px-2 py-1">{player.playerName}</td>
                                {enabledStats.map(stat => (
                                  <td key={stat} className="text-center px-2 py-1">
                                    {player[stat] || 0}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="text-center py-20 rounded-xl"
          style={{ backgroundColor: currentTheme.secondaryBackground }}
        >
          <div className="text-6xl mb-4">📊</div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ fontFamily: currentTheme.headerFont }}
          >
            NO GAMES YET
          </h2>
          <p style={{ color: currentTheme.textSecondary }}>
            Completed games will appear here
          </p>
        </div>
      )}
    </div>
  );
}

