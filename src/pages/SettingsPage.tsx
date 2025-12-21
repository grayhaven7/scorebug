import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { StatType, KeyboardBindings, Theme } from '../types';
import { statFullNames, statLabels, defaultKeyboardBindings } from '../types';

// Key binding button component
interface KeyBindingButtonProps {
  label: string;
  bindingKey: keyof KeyboardBindings;
  value: string;
  isEditing: boolean;
  onEdit: () => void;
  onKeyCapture: (key: string) => void;
  onCancel: () => void;
  theme: Theme;
}

function KeyBindingButton({
  label,
  value,
  isEditing,
  onEdit,
  onKeyCapture,
  onCancel,
  theme,
}: KeyBindingButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Allow escape to cancel
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      
      // Capture the key
      let key = e.key.toLowerCase();
      if (e.key === ' ') key = ' '; // Keep space as is
      
      onKeyCapture(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, onKeyCapture, onCancel]);

  const formatKey = (key: string) => {
    if (key === ' ') return 'Space';
    return key.toUpperCase();
  };

  return (
    <button
      ref={buttonRef}
      onClick={onEdit}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all"
      style={{
        backgroundColor: isEditing ? theme.accentColor + '20' : 'transparent',
        borderColor: isEditing ? theme.accentColor : theme.textSecondary + '30',
        borderRadius: theme.borderRadius,
      }}
    >
      <span className="text-xs" style={{ color: theme.textSecondary }}>
        {label}
      </span>
      <span
        className="px-2 py-0.5 rounded text-xs font-mono font-bold min-w-[32px] text-center"
        style={{
          backgroundColor: isEditing ? theme.accentColor : theme.secondaryBackground,
          color: isEditing ? '#fff' : theme.textColor,
        }}
      >
        {isEditing ? '...' : formatKey(value)}
      </span>
    </button>
  );
}

export function SettingsPage() {
  const { 
    settings, 
    updateStatsConfig, 
    updateScoreboardConfig, 
    updateDefaultTargetScore, 
    updateKeyboardBindings,
    setKeyboardShortcutsEnabled,
    currentTheme, 
    resetAllData 
  } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editingKey, setEditingKey] = useState<keyof KeyboardBindings | null>(null);

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[
            { id: 'showTimer', label: 'Game Timer', desc: 'Show time remaining' },
            { id: 'showQuarter', label: 'Quarter/Period', desc: 'Show current period' },
            { id: 'showTargetBar', label: 'Target Score Bar', desc: 'Show vertical progress bar' },
            { id: 'showQuickPoints', label: 'Quick Points', desc: 'Show +1, +2, +3 buttons' },
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

        {/* Default Target Score */}
        <div className="pt-6 border-t" style={{ borderColor: currentTheme.textSecondary + '20' }}>
          <div className="mb-4">
            <h3
              className="text-lg font-bold mb-2"
              style={{ fontFamily: currentTheme.headerFont }}
            >
              DEFAULT TARGET SCORE
            </h3>
            <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
              Set the default target score for new games. Set to 0 to disable by default.
            </p>
          </div>
          <input
            type="number"
            placeholder="e.g. 21"
            value={settings.defaultTargetScore || ''}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              updateDefaultTargetScore(val > 0 ? val : null);
            }}
            className="w-full px-4 py-3 rounded-lg border text-center text-xl font-bold focus:outline-none"
            style={{
              backgroundColor: currentTheme.backgroundColor,
              borderColor: currentTheme.textSecondary + '40',
              color: currentTheme.textColor,
              fontFamily: currentTheme.numberFont,
              borderRadius: currentTheme.borderRadius,
            }}
          />
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

      {/* Keyboard Shortcuts */}
      <div
        className="rounded-xl p-6 mt-6"
        style={{ backgroundColor: currentTheme.secondaryBackground }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: currentTheme.headerFont }}
            >
              KEYBOARD SHORTCUTS
            </h2>
            <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
              Score games without clicking - use keyboard for faster input
            </p>
          </div>
          <button
            onClick={() => setKeyboardShortcutsEnabled(!settings.keyboardShortcutsEnabled)}
            className="flex items-center gap-2"
          >
            <div
              className="w-12 h-7 rounded-full relative transition-all"
              style={{
                backgroundColor: settings.keyboardShortcutsEnabled
                  ? currentTheme.accentColor
                  : currentTheme.textSecondary + '40',
              }}
            >
              <div
                className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow"
                style={{
                  left: settings.keyboardShortcutsEnabled ? 'calc(100% - 24px)' : '4px',
                }}
              />
            </div>
          </button>
        </div>

        {settings.keyboardShortcutsEnabled && (
          <>
            {/* Key Bindings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Player Selection */}
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: currentTheme.backgroundColor }}
              >
                <h3 className="text-sm font-bold mb-3 uppercase" style={{ color: currentTheme.textSecondary }}>
                  Select Player
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(['selectPlayer1', 'selectPlayer2', 'selectPlayer3', 'selectPlayer4', 'selectPlayer5'] as const).map((key, idx) => (
                    <KeyBindingButton
                      key={key}
                      label={`P${idx + 1}`}
                      bindingKey={key}
                      value={settings.keyboardBindings[key]}
                      isEditing={editingKey === key}
                      onEdit={() => setEditingKey(key)}
                      onKeyCapture={(newKey) => {
                        updateKeyboardBindings({ [key]: newKey });
                        setEditingKey(null);
                      }}
                      onCancel={() => setEditingKey(null)}
                      theme={currentTheme}
                    />
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: currentTheme.textSecondary }}>
                  Use Toggle Team to switch between home/away
                </p>
              </div>

              {/* Points */}
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: currentTheme.backgroundColor }}
              >
                <h3 className="text-sm font-bold mb-3 uppercase" style={{ color: currentTheme.textSecondary }}>
                  Add Points
                </h3>
                <div className="flex flex-wrap gap-2">
                  <KeyBindingButton
                    label="+1"
                    bindingKey="addPoints1"
                    value={settings.keyboardBindings.addPoints1}
                    isEditing={editingKey === 'addPoints1'}
                    onEdit={() => setEditingKey('addPoints1')}
                    onKeyCapture={(newKey) => {
                      updateKeyboardBindings({ addPoints1: newKey });
                      setEditingKey(null);
                    }}
                    onCancel={() => setEditingKey(null)}
                    theme={currentTheme}
                  />
                  <KeyBindingButton
                    label="+2"
                    bindingKey="addPoints2"
                    value={settings.keyboardBindings.addPoints2}
                    isEditing={editingKey === 'addPoints2'}
                    onEdit={() => setEditingKey('addPoints2')}
                    onKeyCapture={(newKey) => {
                      updateKeyboardBindings({ addPoints2: newKey });
                      setEditingKey(null);
                    }}
                    onCancel={() => setEditingKey(null)}
                    theme={currentTheme}
                  />
                  <KeyBindingButton
                    label="+3"
                    bindingKey="addPoints3"
                    value={settings.keyboardBindings.addPoints3}
                    isEditing={editingKey === 'addPoints3'}
                    onEdit={() => setEditingKey('addPoints3')}
                    onKeyCapture={(newKey) => {
                      updateKeyboardBindings({ addPoints3: newKey });
                      setEditingKey(null);
                    }}
                    onCancel={() => setEditingKey(null)}
                    theme={currentTheme}
                  />
                </div>
              </div>

              {/* Other Actions */}
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: currentTheme.backgroundColor }}
              >
                <h3 className="text-sm font-bold mb-3 uppercase" style={{ color: currentTheme.textSecondary }}>
                  Other Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  <KeyBindingButton
                    label="Foul"
                    bindingKey="addFoul"
                    value={settings.keyboardBindings.addFoul}
                    isEditing={editingKey === 'addFoul'}
                    onEdit={() => setEditingKey('addFoul')}
                    onKeyCapture={(newKey) => {
                      updateKeyboardBindings({ addFoul: newKey });
                      setEditingKey(null);
                    }}
                    onCancel={() => setEditingKey(null)}
                    theme={currentTheme}
                  />
                  <KeyBindingButton
                    label="Toggle Team"
                    bindingKey="toggleTeam"
                    value={settings.keyboardBindings.toggleTeam}
                    isEditing={editingKey === 'toggleTeam'}
                    onEdit={() => setEditingKey('toggleTeam')}
                    onKeyCapture={(newKey) => {
                      updateKeyboardBindings({ toggleTeam: newKey });
                      setEditingKey(null);
                    }}
                    onCancel={() => setEditingKey(null)}
                    theme={currentTheme}
                  />
                </div>
              </div>

              {/* Undo */}
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: currentTheme.backgroundColor }}
              >
                <h3 className="text-sm font-bold mb-3 uppercase" style={{ color: currentTheme.textSecondary }}>
                  Undo
                </h3>
                <div className="flex flex-wrap gap-2">
                  <KeyBindingButton
                    label="Undo"
                    bindingKey="undo"
                    value={settings.keyboardBindings.undo}
                    isEditing={editingKey === 'undo'}
                    onEdit={() => setEditingKey('undo')}
                    onKeyCapture={(newKey) => {
                      updateKeyboardBindings({ undo: newKey });
                      setEditingKey(null);
                    }}
                    onCancel={() => setEditingKey(null)}
                    theme={currentTheme}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: currentTheme.textSecondary }}>
                  Also works with Ctrl+Z
                </p>
              </div>
            </div>

            {/* Reset to Defaults */}
            <button
              onClick={() => updateKeyboardBindings(defaultKeyboardBindings)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: currentTheme.backgroundColor,
                border: `1px solid ${currentTheme.textSecondary}40`,
                color: currentTheme.textSecondary,
                borderRadius: currentTheme.borderRadius,
              }}
            >
              Reset to Defaults
            </button>
          </>
        )}
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

