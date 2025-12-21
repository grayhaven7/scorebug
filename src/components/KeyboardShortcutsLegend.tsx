import type { Theme, KeyboardBindings } from '../types';

interface KeyboardShortcutsLegendProps {
  theme: Theme;
  bindings: KeyboardBindings;
  selectedTeam: 'home' | 'away';
  selectedPlayerIndex: number | null;
  selectedPlayerName?: string;
  canUndo: boolean;
  isCompact?: boolean;
  onClose?: () => void;
}

export function KeyboardShortcutsLegend({
  theme,
  bindings,
  selectedTeam,
  selectedPlayerIndex,
  selectedPlayerName,
  canUndo,
  isCompact = false,
  onClose,
}: KeyboardShortcutsLegendProps) {
  const formatKey = (key: string) => {
    if (key === ' ') return 'Space';
    return key.toUpperCase();
  };

  const KeyBadge = ({ children, active = false }: { children: React.ReactNode; active?: boolean }) => (
    <span
      className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded text-xs font-mono font-bold"
      style={{
        backgroundColor: active ? theme.accentColor : theme.backgroundColor,
        color: active ? '#fff' : theme.textSecondary,
        border: `1px solid ${active ? theme.accentColor : theme.textSecondary}40`,
      }}
    >
      {children}
    </span>
  );

  if (isCompact) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs"
        style={{ backgroundColor: theme.secondaryBackground }}
      >
        <div className="flex items-center gap-1.5">
          <span style={{ color: theme.textSecondary }}>⌨️</span>
          <span style={{ color: theme.textSecondary }}>Shortcuts ON</span>
        </div>
        <div className="h-4 w-px" style={{ backgroundColor: theme.textSecondary + '30' }} />
        <div className="flex items-center gap-1">
          <span style={{ color: theme.textSecondary }}>Team:</span>
          <KeyBadge active={selectedTeam === 'home'}>
            {selectedTeam === 'home' ? 'HOME' : 'AWAY'}
          </KeyBadge>
        </div>
        {selectedPlayerIndex !== null && selectedPlayerName && (
          <>
            <div className="h-4 w-px" style={{ backgroundColor: theme.textSecondary + '30' }} />
            <div className="flex items-center gap-1">
              <span style={{ color: theme.textSecondary }}>Player:</span>
              <KeyBadge active>{selectedPlayerName}</KeyBadge>
            </div>
          </>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: theme.textSecondary }}
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4 text-sm"
      style={{ backgroundColor: theme.secondaryBackground }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2" style={{ fontFamily: theme.headerFont }}>
          <span>⌨️</span>
          <span>KEYBOARD SHORTCUTS</span>
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="opacity-60 hover:opacity-100 transition-opacity text-lg"
            style={{ color: theme.textSecondary }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Current Selection Status */}
      <div
        className="mb-4 p-3 rounded-lg flex items-center justify-between"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: theme.textSecondary }}>Active Team:</span>
          <KeyBadge active>{selectedTeam.toUpperCase()}</KeyBadge>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ color: theme.textSecondary }}>Player:</span>
          {selectedPlayerIndex !== null && selectedPlayerName ? (
            <KeyBadge active>#{selectedPlayerIndex + 1} {selectedPlayerName}</KeyBadge>
          ) : (
            <span style={{ color: theme.textSecondary + '80' }}>None</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Player Selection */}
        <div>
          <h4 className="text-xs font-bold mb-2 uppercase" style={{ color: theme.textSecondary }}>
            Select Player (on active team)
          </h4>
          <div className="flex items-center gap-2">
            <KeyBadge>{formatKey(bindings.selectPlayer1)}</KeyBadge>
            <KeyBadge>{formatKey(bindings.selectPlayer2)}</KeyBadge>
            <KeyBadge>{formatKey(bindings.selectPlayer3)}</KeyBadge>
            <KeyBadge>{formatKey(bindings.selectPlayer4)}</KeyBadge>
            <KeyBadge>{formatKey(bindings.selectPlayer5)}</KeyBadge>
            <span className="text-xs" style={{ color: theme.textSecondary }}>Player 1-5</span>
          </div>
        </div>

        {/* Add Points */}
        <div>
          <h4 className="text-xs font-bold mb-2 uppercase" style={{ color: theme.textSecondary }}>
            Add Points
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <KeyBadge>{formatKey(bindings.addPoints1)}</KeyBadge>
              <span className="text-xs" style={{ color: theme.textSecondary }}>+1</span>
            </div>
            <div className="flex items-center gap-1">
              <KeyBadge>{formatKey(bindings.addPoints2)}</KeyBadge>
              <span className="text-xs" style={{ color: theme.textSecondary }}>+2</span>
            </div>
            <div className="flex items-center gap-1">
              <KeyBadge>{formatKey(bindings.addPoints3)}</KeyBadge>
              <span className="text-xs" style={{ color: theme.textSecondary }}>+3</span>
            </div>
          </div>
        </div>

        {/* Team Toggle & Foul */}
        <div>
          <h4 className="text-xs font-bold mb-2 uppercase" style={{ color: theme.textSecondary }}>
            Other Actions
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <KeyBadge>{formatKey(bindings.addFoul)}</KeyBadge>
              <span className="text-xs" style={{ color: theme.textSecondary }}>Add Foul</span>
            </div>
            <div className="flex items-center gap-2">
              <KeyBadge>{formatKey(bindings.toggleTeam)}</KeyBadge>
              <span className="text-xs" style={{ color: theme.textSecondary }}>Toggle Home/Away</span>
            </div>
          </div>
        </div>

        {/* Undo */}
        <div>
          <h4 className="text-xs font-bold mb-2 uppercase" style={{ color: theme.textSecondary }}>
            Undo
          </h4>
          <div className="flex items-center gap-2">
            <KeyBadge active={canUndo}>{formatKey(bindings.undo)}</KeyBadge>
            <span className="text-xs" style={{ color: theme.textSecondary }}>
              or
            </span>
            <KeyBadge active={canUndo}>Ctrl</KeyBadge>
            <span className="text-xs" style={{ color: theme.textSecondary }}>+</span>
            <KeyBadge active={canUndo}>{formatKey(bindings.undo)}</KeyBadge>
            <span className="text-xs" style={{ color: canUndo ? theme.accentColor : theme.textSecondary + '60' }}>
              {canUndo ? 'Ready' : 'No actions'}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-center" style={{ color: theme.textSecondary + '80' }}>
        Customize shortcuts in Settings → Keyboard Shortcuts
      </p>
    </div>
  );
}

