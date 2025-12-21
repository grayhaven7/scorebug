import { useState, useEffect, useCallback } from 'react';
import type { KeyboardBindings, PlayerGameStats } from '../types';
import { defaultKeyboardBindings } from '../types';

interface UseKeyboardShortcutsOptions {
  enabled: boolean;
  bindings: KeyboardBindings;
  homePlayers: { playerId: string; playerName: string }[];
  awayPlayers: { playerId: string; playerName: string }[];
  onAddStat: (teamType: 'home' | 'away', playerId: string, stat: keyof PlayerGameStats, delta: number) => void;
  onUndo: () => void;
}

interface KeyboardShortcutsState {
  selectedTeam: 'home' | 'away';
  selectedPlayerIndex: number | null;
}

export function useKeyboardShortcuts({
  enabled,
  bindings = defaultKeyboardBindings,
  homePlayers,
  awayPlayers,
  onAddStat,
  onUndo,
}: UseKeyboardShortcutsOptions) {
  const [state, setState] = useState<KeyboardShortcutsState>({
    selectedTeam: 'home',
    selectedPlayerIndex: null,
  });

  const getSelectedPlayer = useCallback(() => {
    if (state.selectedPlayerIndex === null) return null;
    const players = state.selectedTeam === 'home' ? homePlayers : awayPlayers;
    return players[state.selectedPlayerIndex] || null;
  }, [state.selectedTeam, state.selectedPlayerIndex, homePlayers, awayPlayers]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (!enabled) return;

      const key = event.key.toLowerCase();
      const isCtrl = event.ctrlKey || event.metaKey;

      // Player selection - works on the currently selected team
      const playerKeys = [
        bindings.selectPlayer1,
        bindings.selectPlayer2,
        bindings.selectPlayer3,
        bindings.selectPlayer4,
        bindings.selectPlayer5,
      ];

      const playerIndex = playerKeys.findIndex((k) => k === key);
      if (playerIndex !== -1) {
        event.preventDefault();
        // Select player on the currently active team
        const players = state.selectedTeam === 'home' ? homePlayers : awayPlayers;
        
        // Only select if player exists at that index
        if (playerIndex < players.length) {
          setState((prev) => ({
            ...prev,
            selectedPlayerIndex: playerIndex,
          }));
        }
        return;
      }

      // Toggle team with spacebar
      if (key === bindings.toggleTeam || event.code === 'Space') {
        event.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedTeam: prev.selectedTeam === 'home' ? 'away' : 'home',
          // Keep same player index if valid, otherwise reset
          selectedPlayerIndex:
            prev.selectedPlayerIndex !== null &&
            prev.selectedPlayerIndex <
              (prev.selectedTeam === 'home' ? awayPlayers : homePlayers).length
              ? prev.selectedPlayerIndex
              : null,
        }));
        return;
      }

      // Undo with Z or Ctrl+Z
      if (key === bindings.undo && (isCtrl || !isCtrl)) {
        event.preventDefault();
        onUndo();
        return;
      }

      // Point and foul actions require a selected player
      const selectedPlayer = getSelectedPlayer();
      if (!selectedPlayer) return;

      // Add points
      if (key === bindings.addPoints1) {
        event.preventDefault();
        onAddStat(state.selectedTeam, selectedPlayer.playerId, 'points', 1);
        return;
      }

      if (key === bindings.addPoints2) {
        event.preventDefault();
        onAddStat(state.selectedTeam, selectedPlayer.playerId, 'points', 2);
        return;
      }

      if (key === bindings.addPoints3) {
        event.preventDefault();
        onAddStat(state.selectedTeam, selectedPlayer.playerId, 'points', 3);
        return;
      }

      // Add foul
      if (key === bindings.addFoul) {
        event.preventDefault();
        onAddStat(state.selectedTeam, selectedPlayer.playerId, 'fouls', 1);
        return;
      }
    },
    [
      enabled,
      bindings,
      homePlayers,
      awayPlayers,
      state.selectedTeam,
      getSelectedPlayer,
      onAddStat,
      onUndo,
    ]
  );


  // Clear selection
  const clearSelection = useCallback(() => {
    setState({
      selectedTeam: 'home',
      selectedPlayerIndex: null,
    });
  }, []);

  // Manually select a player
  const selectPlayer = useCallback((teamType: 'home' | 'away', playerIndex: number) => {
    setState({
      selectedTeam: teamType,
      selectedPlayerIndex: playerIndex,
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    selectedTeam: state.selectedTeam,
    selectedPlayerIndex: state.selectedPlayerIndex,
    selectedPlayer: getSelectedPlayer(),
    clearSelection,
    selectPlayer,
  };
}

