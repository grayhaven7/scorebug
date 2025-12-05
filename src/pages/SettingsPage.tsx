import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { StatType } from '../types';
import { statFullNames, statLabels } from '../types';

export function SettingsPage() {
  const { settings, updateStatsConfig, updateScoreboardConfig, currentTheme, resetAllData } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    resetAllData();
    setShowResetConfirm(false);
    window.location.reload(); // Reload to ensure clean state
  };

  const allStats: StatType[] = [
    'points',
    'rebounds',
    'assists',
    'steals',
    'blocks',
    'fouls',
    'turnovers',
    'threePointers',
  ];

  const handleToggleStat = (stat: StatType) => {
    updateStatsConfig({ [stat]: !settings.statsConfig[stat] });
  };

  const enabledCount = Object.values(settings.statsConfig).filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold tracking-wide mb-2"
          style={{ fontFamily: currentTheme.headerFont }}
        >
          SETTINGS
        </h1>
        <p style={{ color: currentTheme.textSecondary }}>
          Customize which stats to track during games
        </p>
      </div>

      {/* Scoreboard Display */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{ backgroundColor: currentTheme.secondaryBackground }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: currentTheme.headerFont }}
            >
              SCOREBOARD DISPLAY
            </h2>
            <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
              Customize game clock and quarter display
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'showTimer', label: 'Game Timer', desc: 'Show time remaining' },
            { id: 'showQuarter', label: 'Quarter/Period', desc: 'Show current period' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => updateScoreboardConfig({ [item.id]: !settings.scoreboardConfig[item.id as keyof typeof settings.scoreboardConfig] })}
              className="flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: settings.scoreboardConfig[item.id as keyof typeof settings.scoreboardConfig]
                  ? currentTheme.accentColor + '10'
                  : 'transparent',
                borderColor: settings.scoreboardConfig[item.id as keyof typeof settings.scoreboardConfig]
                  ? currentTheme.accentColor
                  : currentTheme.textSecondary + '30',
                borderRadius: currentTheme.borderRadius,
              }}
            >
              <div className="text-left">
                <p className="font-bold">{item.label}</p>
                <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                  {item.desc}
                </p>
              </div>
              <div
                className="w-12 h-7 rounded-full relative transition-all"
                style={{
                  backgroundColor: settings.scoreboardConfig[item.id as keyof typeof settings.scoreboardConfig]
                    ? currentTheme.accentColor
                    : currentTheme.textSecondary + '40',
                }}
              >
                <div
                  className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow"
                  style={{
                    left: settings.scoreboardConfig[item.id as keyof typeof settings.scoreboardConfig] ? 'calc(100% - 24px)' : '4px',
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Configuration */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: currentTheme.secondaryBackground }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: currentTheme.headerFont }}
            >
              STAT COLUMNS
            </h2>
            <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
              Toggle which statistics appear in the scorebug
            </p>
          </div>
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: currentTheme.accentColor + '20',
              color: currentTheme.accentColor,
            }}
          >
            {enabledCount} active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allStats.map(stat => (
            <button
              key={stat}
              onClick={() => handleToggleStat(stat)}
              className="flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: settings.statsConfig[stat]
                  ? currentTheme.accentColor + '10'
                  : 'transparent',
                borderColor: settings.statsConfig[stat]
                  ? currentTheme.accentColor
                  : currentTheme.textSecondary + '30',
                borderRadius: currentTheme.borderRadius,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-12 h-8 flex items-center justify-center rounded font-bold text-sm"
                  style={{
                    backgroundColor: settings.statsConfig[stat]
                      ? currentTheme.accentColor
                      : currentTheme.textSecondary + '30',
                    color: settings.statsConfig[stat]
                      ? '#fff'
                      : currentTheme.textSecondary,
                    borderRadius: currentTheme.borderRadius,
                  }}
                >
                  {statLabels[stat]}
                </span>
                <span className="font-medium">{statFullNames[stat]}</span>
              </div>
              <div
                className={`w-12 h-7 rounded-full relative transition-all ${
                  settings.statsConfig[stat] ? '' : ''
                }`}
                style={{
                  backgroundColor: settings.statsConfig[stat]
                    ? currentTheme.accentColor
                    : currentTheme.textSecondary + '40',
                }}
              >
                <div
                  className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow"
                  style={{
                    left: settings.statsConfig[stat] ? 'calc(100% - 24px)' : '4px',
                  }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="mt-8 pt-6 border-t" style={{ borderColor: currentTheme.textSecondary + '20' }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: currentTheme.textSecondary }}>
            PREVIEW
          </h3>
          <div
            className="flex items-center gap-1 p-3 rounded-lg overflow-x-auto"
            style={{
              backgroundColor: currentTheme.backgroundColor,
              borderRadius: currentTheme.borderRadius,
            }}
          >
            <span
              className="px-3 py-1 text-xs font-medium shrink-0"
              style={{ color: currentTheme.textSecondary }}
            >
              #
            </span>
            <span
              className="px-3 py-1 text-xs font-medium shrink-0 min-w-24"
              style={{ color: currentTheme.textSecondary }}
            >
              PLAYER
            </span>
            {allStats
              .filter(stat => settings.statsConfig[stat])
              .map(stat => (
                <span
                  key={stat}
                  className="px-3 py-1 text-xs font-medium shrink-0 text-center min-w-12"
                  style={{ color: currentTheme.textSecondary }}
                >
                  {statLabels[stat]}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div
        className="rounded-xl p-6 mt-6"
        style={{ backgroundColor: currentTheme.secondaryBackground }}
      >
        <h2
          className="text-xl font-bold mb-4"
          style={{ fontFamily: currentTheme.headerFont }}
        >
          QUICK PRESETS
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() =>
              updateStatsConfig({
                points: true,
                rebounds: false,
                assists: false,
                steals: false,
                blocks: false,
                fouls: true,
                turnovers: false,
                threePointers: false,
              })
            }
            className="p-4 rounded-lg border transition-all hover:scale-[1.02]"
            style={{
              borderColor: currentTheme.textSecondary + '30',
              borderRadius: currentTheme.borderRadius,
            }}
          >
            <p className="font-bold mb-1">Simple</p>
            <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
              Points & Fouls only
            </p>
          </button>
          <button
            onClick={() =>
              updateStatsConfig({
                points: true,
                rebounds: true,
                assists: true,
                steals: false,
                blocks: false,
                fouls: true,
                turnovers: false,
                threePointers: false,
              })
            }
            className="p-4 rounded-lg border transition-all hover:scale-[1.02]"
            style={{
              borderColor: currentTheme.textSecondary + '30',
              borderRadius: currentTheme.borderRadius,
            }}
          >
            <p className="font-bold mb-1">Standard</p>
            <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
              PTS, REB, AST, PF
            </p>
          </button>
          <button
            onClick={() =>
              updateStatsConfig({
                points: true,
                rebounds: true,
                assists: true,
                steals: true,
                blocks: true,
                fouls: true,
                turnovers: true,
                threePointers: true,
              })
            }
            className="p-4 rounded-lg border transition-all hover:scale-[1.02]"
            style={{
              borderColor: currentTheme.textSecondary + '30',
              borderRadius: currentTheme.borderRadius,
            }}
          >
            <p className="font-bold mb-1">Full Box Score</p>
            <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
              All stats enabled
            </p>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div
        className="rounded-xl p-6 mt-6 border-2 border-red-500/20"
        style={{ backgroundColor: currentTheme.secondaryBackground }}
      >
        <h2 className="text-xl font-bold mb-4 text-red-400">DANGER ZONE</h2>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-bold">Reset Application Data</p>
            <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
              Delete all teams, games, and settings. Restores default test data.
            </p>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Reset Data
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          />
          <div
            className="relative w-full max-w-md p-6 rounded-xl text-center"
            style={{ backgroundColor: currentTheme.secondaryBackground }}
          >
            <h2 className="text-xl font-bold mb-2 text-red-400">
              RESET ALL DATA?
            </h2>
            <p className="mb-6" style={{ color: currentTheme.textSecondary }}>
              This cannot be undone. All teams, games, and themes will be deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-3 rounded-lg font-medium border"
                style={{
                  borderColor: currentTheme.textSecondary + '40',
                  color: currentTheme.textSecondary,
                  borderRadius: currentTheme.borderRadius,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-3 rounded-lg font-medium bg-red-500 text-white"
                style={{ borderRadius: currentTheme.borderRadius }}
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

