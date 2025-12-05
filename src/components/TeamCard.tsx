import type { Team } from '../types';
import { useApp } from '../context/AppContext';

interface TeamCardProps {
  team: Team;
  onEdit: () => void;
  onDelete: () => void;
}

export function TeamCard({ team, onEdit, onDelete }: TeamCardProps) {
  const { currentTheme } = useApp();

  return (
    <div
      className="rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl"
      style={{
        backgroundColor: currentTheme.secondaryBackground,
        borderRadius: currentTheme.borderRadius,
      }}
    >
      {/* Team Header with Colors */}
      <div
        className="h-24 relative"
        style={{
          background: `linear-gradient(135deg, ${team.primaryColor} 0%, ${team.primaryColor} 60%, ${team.secondaryColor} 60%, ${team.secondaryColor} 100%)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <h3
            className="text-2xl font-bold text-white drop-shadow-lg tracking-wide"
            style={{ fontFamily: currentTheme.headerFont }}
          >
            {team.name}
          </h3>
        </div>
      </div>

      {/* Team Info */}
      <div className="p-4">
        {/* Color Swatches */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-full border-2 border-white/20"
            style={{ backgroundColor: team.primaryColor }}
            title={team.primaryColor}
          />
          <div
            className="w-6 h-6 rounded-full border-2 border-white/20"
            style={{ backgroundColor: team.secondaryColor }}
            title={team.secondaryColor}
          />
          <span className="text-xs ml-auto" style={{ color: currentTheme.textSecondary }}>
            {team.players.length} players
          </span>
        </div>

        {/* Player Preview */}
        <div className="mb-4">
          {team.players.slice(0, 3).map(player => (
            <div
              key={player.id}
              className="flex items-center gap-2 py-1 text-sm"
              style={{ color: currentTheme.textSecondary }}
            >
              <span
                className="w-8 h-6 rounded flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}
              >
                #{player.jerseyNumber}
              </span>
              <span>{player.name}</span>
            </div>
          ))}
          {team.players.length > 3 && (
            <p className="text-xs mt-1" style={{ color: currentTheme.textSecondary }}>
              +{team.players.length - 3} more players
            </p>
          )}
          {team.players.length === 0 && (
            <p className="text-xs py-2" style={{ color: currentTheme.textSecondary }}>
              No players added
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{
              backgroundColor: currentTheme.accentColor + '20',
              color: currentTheme.accentColor,
              borderRadius: currentTheme.borderRadius,
            }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-red-500/30 bg-red-500/10 text-red-400"
            style={{ borderRadius: currentTheme.borderRadius }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

