import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Team, Player } from '../types';
import { useApp } from '../context/AppContext';

interface TeamFormProps {
  team?: Team;
  onSave: () => void;
  onCancel: () => void;
}

export function TeamForm({ team, onSave, onCancel }: TeamFormProps) {
  const { currentTheme, addTeam, updateTeam } = useApp();
  const [name, setName] = useState(team?.name || '');
  const [primaryColor, setPrimaryColor] = useState(team?.primaryColor || '#1e40af');
  const [secondaryColor, setSecondaryColor] = useState(team?.secondaryColor || '#ffffff');
  const [players, setPlayers] = useState<Player[]>(
    team?.players || []
  );
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');

  const handleAddPlayer = () => {
    if (newPlayerName.trim() && newPlayerNumber.trim()) {
      setPlayers([
        ...players,
        {
          id: uuidv4(),
          name: newPlayerName.trim(),
          jerseyNumber: newPlayerNumber.trim(),
        },
      ]);
      setNewPlayerName('');
      setNewPlayerNumber('');
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const handleUpdatePlayer = (playerId: string, field: 'name' | 'jerseyNumber', value: string) => {
    setPlayers(
      players.map(p => (p.id === playerId ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const teamData = {
      name: name.trim(),
      primaryColor,
      secondaryColor,
      players,
    };

    if (team) {
      updateTeam(team.id, teamData);
    } else {
      addTeam(teamData);
    }
    onSave();
  };

  const inputStyle = {
    backgroundColor: currentTheme.backgroundColor,
    borderColor: currentTheme.textSecondary + '40',
    color: currentTheme.textColor,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Team Name */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>
          Team Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter team name"
          className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
          style={{
            ...inputStyle,
            borderRadius: currentTheme.borderRadius,
          }}
          required
        />
      </div>

      {/* Team Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>
            Primary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-14 h-14 cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 uppercase font-mono"
              style={{ ...inputStyle, borderRadius: currentTheme.borderRadius }}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>
            Secondary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={secondaryColor}
              onChange={e => setSecondaryColor(e.target.value)}
              className="w-14 h-14 cursor-pointer"
            />
            <input
              type="text"
              value={secondaryColor}
              onChange={e => setSecondaryColor(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 uppercase font-mono"
              style={{ ...inputStyle, borderRadius: currentTheme.borderRadius }}
            />
          </div>
        </div>
      </div>

      {/* Team Color Preview */}
      <div
        className="p-4 rounded-lg flex items-center gap-4"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 50%, ${secondaryColor} 100%)`,
          borderRadius: currentTheme.borderRadius,
        }}
      >
        <span className="text-white font-bold text-lg drop-shadow-lg" style={{ fontFamily: currentTheme.headerFont }}>
          {name || 'Team Preview'}
        </span>
      </div>

      {/* Players Section */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: currentTheme.textSecondary }}>
          Roster ({players.length} players)
        </label>

        {/* Add Player Form */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPlayerNumber}
            onChange={e => setNewPlayerNumber(e.target.value)}
            placeholder="#"
            className="w-20 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 text-center font-mono"
            style={{ ...inputStyle, borderRadius: currentTheme.borderRadius }}
          />
          <input
            type="text"
            value={newPlayerName}
            onChange={e => setNewPlayerName(e.target.value)}
            placeholder="Player name"
            className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{ ...inputStyle, borderRadius: currentTheme.borderRadius }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddPlayer();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddPlayer}
            className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
            style={{
              backgroundColor: currentTheme.accentColor,
              color: '#fff',
              borderRadius: currentTheme.borderRadius,
            }}
          >
            Add
          </button>
        </div>

        {/* Players List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {players.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center gap-2 p-2 rounded-lg"
              style={{
                backgroundColor: currentTheme.secondaryBackground,
                borderRadius: currentTheme.borderRadius,
              }}
            >
              <span className="w-8 text-center text-sm" style={{ color: currentTheme.textSecondary }}>
                {index + 1}.
              </span>
              <input
                type="text"
                value={player.jerseyNumber}
                onChange={e => handleUpdatePlayer(player.id, 'jerseyNumber', e.target.value)}
                className="w-16 px-2 py-1 rounded border text-center font-mono text-sm"
                style={{ ...inputStyle, borderRadius: currentTheme.borderRadius }}
              />
              <input
                type="text"
                value={player.name}
                onChange={e => handleUpdatePlayer(player.id, 'name', e.target.value)}
                className="flex-1 px-3 py-1 rounded border text-sm"
                style={{ ...inputStyle, borderRadius: currentTheme.borderRadius }}
              />
              <button
                type="button"
                onClick={() => handleRemovePlayer(player.id)}
                className="p-1 rounded hover:bg-red-500/20 transition-colors text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
          {players.length === 0 && (
            <p className="text-center py-4 text-sm" style={{ color: currentTheme.textSecondary }}>
              No players added yet. Add players above.
            </p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-lg font-medium border transition-all hover:opacity-80"
          style={{
            borderColor: currentTheme.textSecondary + '40',
            color: currentTheme.textSecondary,
            borderRadius: currentTheme.borderRadius,
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-3 rounded-lg font-medium transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: currentTheme.accentColor,
            color: '#fff',
            borderRadius: currentTheme.borderRadius,
          }}
        >
          {team ? 'Save Changes' : 'Create Team'}
        </button>
      </div>
    </form>
  );
}

